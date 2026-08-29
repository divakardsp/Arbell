import crypto from "crypto";
import { eq, and, inArray, sql, lte, desc } from "drizzle-orm";
import { db } from "@/lib";
import { getRazorpayInstance } from "@/lib/razorpay";
import {
    users,
    orders,
    orderItems,
    products,
    merchants,
    payments,
    razorpayCustomers,
    razorpayTokens,
    preDebitPayments,
} from "@/db/schema";
import { ApiError } from "@/utils/ApiError";
import { validateUUID } from "@/utils/validators";
import { encryptToken, decryptToken } from "@/utils/crypto";
import { parseRazorpayError } from "./razorpay-error.util";
import {
    getUserAuthorizations,
    holdAuthorizationReserve,
    releaseAuthorizationReserve,
    captureAuthorizationReserve,
} from "@/services/payment-authorization-service";
import {
    InitiateSbmdPaymentInput,
    InitiateSbmdPaymentResponse,
    ConfirmSbmdMandateInput,
    ConfirmSbmdMandateResponse,
    ExecutePreDebitPaymentInput,
    ExecutePreDebitPaymentResponse,
} from "./sbmd-types";

export interface CreatePaymentItemInput {
    productId: string;
    quantity: number;
}

export interface CreatePaymentInput {
    userId: string;
    amount: number | string;
    items: CreatePaymentItemInput[];
    currency?: string;
}

export interface PaymentOrderItemSummary {
    id: string;
    productId: string;
    productName: string;
    unitPrice: string;
    quantity: number;
}

export interface CreatePaymentResponse {
    orderId: string;
    razorpayOrderId: string;
    amount: string;
    currency: string;
    status: string;
    merchantId: string;
    items: PaymentOrderItemSummary[];
    paymentId: string;
    razorpayKeyId?: string;
}

export interface VerifyPaymentSignatureInput {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
}

export interface VerifyPaymentSignatureResponse {
    isValid: boolean;
}

/**
 * Verifies Razorpay payment signature after client-side checkout completion.
 */
export function verifyPaymentSignature(
    input: VerifyPaymentSignatureInput
): VerifyPaymentSignatureResponse {
    const key_secret =
        process.env.RAZORPAY_API_SECRET || process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
        throw ApiError.internal(
            "RAZORPAY_API_SECRET is missing from environment configuration."
        );
    }

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = input;
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        throw ApiError.badRequest(
            "Missing razorpayOrderId, razorpayPaymentId, or razorpaySignature."
        );
    }

    const expectedSignature = crypto
        .createHmac("sha256", key_secret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

    const isValid = expectedSignature === razorpaySignature;

    return { isValid };
}

/**
 * Core SBMD Flow: Buy Now with Razorpay UPI Reserve Pay.
 * 
 * 1. Validates products and calculates purchase total.
 * 2. Checks Arbell Payment Authorization Reserve (returns requires_reserve if missing/insufficient).
 * 3. Resolves or creates the Razorpay Customer mapping.
 * 4. Checks for existing active Razorpay token:
 *    - If NO token: Creates SBMD mandate authorization order (mandate_required).
 *    - If token EXISTS: Creates debit order and preDebitPayments record (debit_scheduled).
 */
export async function processSbmdPayment(
    input: InitiateSbmdPaymentInput
): Promise<InitiateSbmdPaymentResponse> {
    if (!input || typeof input !== "object") {
        throw ApiError.badRequest("Request body must be an object with 'userId' and 'items'.");
    }

    // 1. Validate User
    const validUserId = validateUUID(input.userId, "User ID");
    const [user] = await db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
        })
        .from(users)
        .where(eq(users.id, validUserId));

    if (!user) {
        throw ApiError.notFound(`User with ID '${validUserId}' was not found.`);
    }

    // 2. Validate Items & Quantities
    if (!input.items || !Array.isArray(input.items) || input.items.length === 0) {
        throw ApiError.badRequest("Purchase request must contain at least one item.");
    }

    const productQuantityMap = new Map<string, number>();
    for (const item of input.items) {
        const validProductId = validateUUID(item.productId, "Product ID");
        const quantity = Number(item.quantity);
        if (!Number.isInteger(quantity) || quantity < 1) {
            throw ApiError.badRequest(
                `Invalid quantity '${item.quantity}' for product '${item.productId}'.`
            );
        }
        const currentQty = productQuantityMap.get(validProductId) ?? 0;
        productQuantityMap.set(validProductId, currentQty + quantity);
    }

    const uniqueProductIds = Array.from(productQuantityMap.keys());
    const dbProducts = await db
        .select({
            id: products.id,
            productName: products.productName,
            price: products.price,
            merchantId: products.merchantId,
            availableStock: products.availableStock,
        })
        .from(products)
        .where(inArray(products.id, uniqueProductIds));

    const foundIds = new Set(dbProducts.map((p) => p.id));
    const missingIds = uniqueProductIds.filter((id) => !foundIds.has(id));
    if (missingIds.length > 0) {
        throw ApiError.notFound(
            `The following product(s) were not found: ${missingIds.join(", ")}`
        );
    }

    // Verify all products belong to the same merchant
    const merchantId = dbProducts[0].merchantId;
    const differentMerchant = dbProducts.find((p) => p.merchantId !== merchantId);
    if (differentMerchant) {
        throw ApiError.badRequest("All products in a purchase must belong to the same merchant.");
    }

    // Check stock availability
    for (const product of dbProducts) {
        const requestedQty = productQuantityMap.get(product.id)!;
        if (product.availableStock < requestedQty) {
            throw ApiError.badRequest(
                `Insufficient stock for '${product.productName}'. Available: ${product.availableStock}, Requested: ${requestedQty}.`
            );
        }
    }

    // Calculate total purchase amount
    let calculatedTotal = 0;
    for (const product of dbProducts) {
        const requestedQty = productQuantityMap.get(product.id)!;
        calculatedTotal += Number(product.price) * requestedQty;
    }
    const calculatedTotalStr = calculatedTotal.toFixed(2);
    const currency = input.currency || "INR";

    // 3. STEP 1: CHECK ARBELL RESERVE
    const userAuthsResponse = await getUserAuthorizations(validUserId, "active");
    const now = Date.now();

    // Find a valid active reserve for this user & merchant with remainingAmount >= calculatedTotal
    const validReserve = userAuthsResponse.authorizations.find((auth) => {
        if (auth.merchant.id !== merchantId) return false;
        if (auth.status !== "active") return false;
        if (auth.validUntil && new Date(auth.validUntil).getTime() <= now) return false;
        return Number(auth.remainingAmount) >= calculatedTotal;
    });

    if (!validReserve) {
        const [merchant] = await db
            .select({ id: merchants.id, name: merchants.name })
            .from(merchants)
            .where(eq(merchants.id, merchantId));

        return {
            status: "requires_reserve",
            message:
                "No valid Arbell payment authorization reserve found with sufficient balance for this merchant. Please create an authorization reserve first.",
            userId: validUserId,
            merchantId,
            merchantName: merchant?.name,
            requiredAmount: calculatedTotalStr,
            currency,
        };
    }

    // 4. STEP 2: RESOLVE OR CREATE RAZORPAY CUSTOMER
    const razorpay = getRazorpayInstance();
    let dbCustomer = await db
        .select()
        .from(razorpayCustomers)
        .where(eq(razorpayCustomers.userId, validUserId))
        .then((rows) => rows[0]);

    if (!dbCustomer) {
        let rzpCustomer;
        try {
            rzpCustomer = await razorpay.customers.create({
                name: user.name,
                email: user.email,
                contact: "9999999999",
                fail_existing: 0,
                notes: {
                    userId: validUserId,
                },
            });
        } catch (error: unknown) {
            const parsed = parseRazorpayError(error);
            throw ApiError.internal(`Failed to create Razorpay Customer: ${parsed.description}`);
        }

        const [inserted] = await db
            .insert(razorpayCustomers)
            .values({
                userId: validUserId,
                razorpayCustomerId: rzpCustomer.id,
            })
            .returning();
        dbCustomer = inserted;
    }

    // 5. STEP 3: CHECK EXISTING RAZORPAY TOKEN
    const activeTokens = await db
        .select()
        .from(razorpayTokens)
        .where(
            and(
                eq(razorpayTokens.razorpayCustomerId, dbCustomer.id),
                eq(razorpayTokens.status, "active")
            )
        )
        .orderBy(desc(razorpayTokens.createdAt));

    const usableToken = activeTokens.find((t) => {
        if (t.expiresAt && new Date(t.expiresAt).getTime() <= now) return false;
        return true;
    });

    const purchaseAmountInSubunits = Math.round(calculatedTotal * 100);

    // -------------------------------------------------------------
    // SCENARIO A: No Usable Token -> Create SBMD Mandate Authorization Order
    // -------------------------------------------------------------
    if (!usableToken) {
        const [newOrder] = await db
            .insert(orders)
            .values({
                userId: validUserId,
                merchantId,
                status: "pending",
                amount: calculatedTotalStr,
            })
            .returning();

        // Insert order items
        const itemsToInsert = dbProducts.map((product) => ({
            orderId: newOrder.id,
            productId: product.id,
            productName: product.productName,
            unitPrice: product.price,
            quantity: productQuantityMap.get(product.id)!,
        }));
        await db.insert(orderItems).values(itemsToInsert);

        // Reserve stock
        for (const product of dbProducts) {
            const requestedQty = productQuantityMap.get(product.id)!;
            await db
                .update(products)
                .set({
                    availableStock: sql`${products.availableStock} - ${requestedQty}`,
                    reserveStock: sql`${products.reserveStock} + ${requestedQty}`,
                })
                .where(eq(products.id, product.id));
        }

        // Token max amount directly from Arbell authorization reserve
        const reserveAmountSubunits = Math.round(Number(validReserve.authorizedAmount) * 100);
        const maxAmountInSubunits = reserveAmountSubunits;
        const expireAtUnix = validReserve.validUntil
            ? Math.floor(new Date(validReserve.validUntil).getTime() / 1000)
            : Math.floor(Date.now() / 1000) + 30 * 86400;

        let authOrder;
        try {
            authOrder = await razorpay.orders.create({
                amount: purchaseAmountInSubunits,
                currency,
                method: "upi",
                customer_id: dbCustomer.razorpayCustomerId,
                receipt: `sbmd_auth_${Date.now()}_${newOrder.id.slice(0, 8)}`,
                notes: {
                    orderId: newOrder.id,
                    userId: validUserId,
                    merchantId,
                    authorizationId: validReserve.id,
                },
                token: {
                    max_amount: maxAmountInSubunits,
                    expire_at: expireAtUnix,
                    frequency: "as_presented",
                    type: "single_block_multiple_debit",
                } as any,
            });
        } catch (error: unknown) {
            const parsed = parseRazorpayError(error);
            throw ApiError.internal(`Failed to create Razorpay SBMD mandate order: ${parsed.description}`);
        }

        await db
            .update(orders)
            .set({ razorpayOrderId: authOrder.id })
            .where(eq(orders.id, newOrder.id));

        const [newPayment] = await db
            .insert(payments)
            .values({
                orderId: newOrder.id,
                razorpayOrderId: authOrder.id,
                amount: calculatedTotalStr,
                currency,
                status: "created",
                method: "upi",
            })
            .returning();

        // Hold authorization reserve for Scenario A
        await holdAuthorizationReserve({
            authorizationId: validReserve.id,
            amount: calculatedTotalStr,
        });

        return {
            status: "mandate_required",
            message: "Razorpay SBMD mandate authorization required. Complete UPI setup via Checkout.",
            orderId: newOrder.id,
            paymentId: newPayment.id,
            razorpayOrderId: authOrder.id,
            razorpayCustomerId: dbCustomer.razorpayCustomerId,
            amount: calculatedTotalStr,
            currency,
            authorizationId: validReserve.id,
            maxAmount: (maxAmountInSubunits / 100).toFixed(2),
            validUntil: validReserve.validUntil,
        };
    }

    // -------------------------------------------------------------
    // SCENARIO B: Usable Token Exists -> Create Pre-Debit Debit Order Flow
    // -------------------------------------------------------------
    const plaintextToken = decryptToken(usableToken.razorpayTokenId);

    const [newOrder] = await db
        .insert(orders)
        .values({
            userId: validUserId,
            merchantId,
            status: "pending",
            amount: calculatedTotalStr,
        })
        .returning();

    const itemsToInsert = dbProducts.map((product) => ({
        orderId: newOrder.id,
        productId: product.id,
        productName: product.productName,
        unitPrice: product.price,
        quantity: productQuantityMap.get(product.id)!,
    }));
    await db.insert(orderItems).values(itemsToInsert);

    for (const product of dbProducts) {
        const requestedQty = productQuantityMap.get(product.id)!;
        await db
            .update(products)
            .set({
                availableStock: sql`${products.availableStock} - ${requestedQty}`,
                reserveStock: sql`${products.reserveStock} + ${requestedQty}`,
            })
            .where(eq(products.id, product.id));
    }


    const razorpayOrderPayload: any = {
        amount: purchaseAmountInSubunits,
        currency,
        payment_capture: true,
        receipt: `sbmd_debit_${Date.now()}_${newOrder.id.slice(0, 8)}`,
        notes: {
            orderId: newOrder.id,
            userId: validUserId,
            merchantId,
            authorizationId: validReserve.id,
        },
        notification: {
            token_id: plaintextToken,
        }
    };

    let debitOrder;
    try {
        debitOrder = await razorpay.orders.create(razorpayOrderPayload);
    } catch (error: unknown) {
        console.log(error)
        const parsed = parseRazorpayError(error);
        throw ApiError.internal(`Failed to create Razorpay debit order: ${parsed.description}`);
    }

    await db
        .update(orders)
        .set({ razorpayOrderId: debitOrder.id })
        .where(eq(orders.id, newOrder.id));

    const [newPayment] = await db
        .insert(payments)
        .values({
            orderId: newOrder.id,
            razorpayTokenId: usableToken.id,
            razorpayOrderId: debitOrder.id,
            amount: calculatedTotalStr,
            currency,
            status: "created",
            method: "upi",
        })
        .returning();

    // Razorpay returns payment_after as a Unix epoch timestamp (seconds integer)
    const paymentAfterRaw = debitOrder.notification?.payment_after;
    const paymentAfterUnix = paymentAfterRaw
        ? Math.floor(Number(paymentAfterRaw))
        : Math.floor(Date.now() / 1000);

    const [preDebit] = await db
        .insert(preDebitPayments)
        .values({
            paymentId: newPayment.id,
            orderId: newOrder.id,
            razorpayOrderId: debitOrder.id,
            razorpayTokenId: usableToken.id,
            amount: calculatedTotalStr,
            currency,
            paymentAfter: paymentAfterUnix,
            status: "waiting",
        })
        .returning();

    // Update payment authorization table: deduct available amount and increase reserve amount by order amount
    await holdAuthorizationReserve({
        authorizationId: validReserve.id,
        amount: calculatedTotalStr,
    });

    return {
        status: "debit_scheduled",
        message: "Razorpay debit order created and pre-debit payment scheduled.",
        orderId: newOrder.id,
        paymentId: newPayment.id,
        preDebitPaymentId: preDebit.id,
        razorpayOrderId: debitOrder.id,
        amount: calculatedTotalStr,
        currency,
        paymentAfter: paymentAfterUnix,
    };
}

/**
 * Confirms client-side SBMD mandate authorization, verifies signature,
 * fetches & encrypts token, records token in DB, and captures or releases authorization reserve.
 */
export async function confirmSbmdMandate(
    input: ConfirmSbmdMandateInput
): Promise<ConfirmSbmdMandateResponse> {
    if (!input || typeof input !== "object") {
        throw ApiError.badRequest("Request body must be an object with authorization details.");
    }

    const {
        userId,
        orderId,
        paymentId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        authorizationId,
    } = input;

    const validUserId = validateUUID(userId, "User ID");
    const validOrderId = validateUUID(orderId, "Order ID");
    const validPaymentId = validateUUID(paymentId, "Payment ID");
    const validAuthId = validateUUID(authorizationId, "Authorization ID");

    const [dBpayment] = await db
        .select()
        .from(payments)
        .where(eq(payments.id, validPaymentId));

    if (!dBpayment) {
        throw ApiError.notFound("Payment record not found.");
    }

    if (dBpayment.razorpayOrderId !== razorpayOrderId) {
        throw ApiError.badRequest("Invalid Razorpay order ID.");
    }

    const [dBorder] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, validOrderId));

    if (!dBorder) {
        throw ApiError.notFound("Order record not found.");
    }

    // Check if order or payment has already failed or been cancelled
    if (
        dBpayment.status === "failed" ||
        dBorder.status === "failed" ||
        dBorder.status === "cancelled"
    ) {
        throw ApiError.badRequest(
            "This order has been cancelled due to failed payment verification. Kindly place your order again."
        );
    }

    // Check if payment is already confirmed
    if (dBpayment.status === "captured" || dBorder.status === "confirmed") {
        throw ApiError.badRequest("This payment has already been verified and confirmed.");
    }

    let failureHandled = false;
    // Helper to release stock, fail payment/order, and release held authorization reserve
    const handleFailure = async () => {
        if (failureHandled) return;
        failureHandled = true;
        try {
            await db
                .update(payments)
                .set({ status: "failed" })
                .where(eq(payments.id, validPaymentId));

            await db
                .update(orders)
                .set({ status: "failed" })
                .where(eq(orders.id, validOrderId));

            const orderItemRows = await db
                .select()
                .from(orderItems)
                .where(eq(orderItems.orderId, validOrderId));

            for (const item of orderItemRows) {
                await db
                    .update(products)
                    .set({
                        reserveStock: sql`GREATEST(0, ${products.reserveStock} - ${item.quantity})`,
                        availableStock: sql`${products.availableStock} + ${item.quantity}`,
                    })
                    .where(eq(products.id, item.productId));
            }

            await releaseAuthorizationReserve({
                authorizationId: validAuthId,
                amount: dBpayment.amount,
            });
        } catch (cleanupErr) {
            console.error("Error during failure cleanup:", cleanupErr);
        }
    };

    try {
        // 1. Verify Razorpay Signature
        const { isValid } = verifyPaymentSignature({
            razorpayOrderId: dBpayment.razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
        });

        if (!isValid) {
            throw ApiError.badRequest("Invalid Razorpay payment signature verification failed.");
        }

        // 2. Fetch Payment details from Razorpay to retrieve token_id
        const razorpay = getRazorpayInstance();
        let paymentDetails: any;
        try {
            paymentDetails = await razorpay.payments.fetch(razorpayPaymentId);
        } catch (error: unknown) {
            const parsed = parseRazorpayError(error);
            throw ApiError.internal(`Failed to fetch Razorpay payment details: ${parsed.description}`);
        }

        if (paymentDetails.status === "failed") {
            throw ApiError.badRequest(
                `Payment failed on Razorpay: ${paymentDetails.error_description || "Unknown error"}`
            );
        }

        const tokenId = paymentDetails.token_id;
        if (!tokenId || typeof tokenId !== "string"){
            throw ApiError.badRequest("No token_id returned by Razorpay for this authorization payment.");
        }

        // 3. Encrypt Token before saving in DB
        const encryptedToken = encryptToken(tokenId);

        // 4. Resolve Razorpay Customer
        const [dbCustomer] = await db
            .select()
            .from(razorpayCustomers)
            .where(eq(razorpayCustomers.userId, validUserId));

        if (!dbCustomer){
            throw ApiError.notFound("Razorpay customer mapping not found for user.");
        }

        // 5. Store Encrypted Token in razorpay_tokens
        const [newToken] = await db
            .insert(razorpayTokens)
            .values({
                razorpayCustomerId: dbCustomer.id,
                razorpayTokenId: encryptedToken,
                status: "active",
            })
            .returning();

        // 6. Update Payment Record
        const isCaptured = paymentDetails.status === "captured";
        const paymentStatus = isCaptured ? "captured" : "authorized";

        const [updatedPayment] = await db
            .update(payments)
            .set({
                razorpayPaymentId,
                razorpayTokenId: newToken.id,
                status: paymentStatus,
            })
            .where(eq(payments.id, validPaymentId))
            .returning();

        let remainingAuthAmount: string | undefined;

        // 7. If payment was captured directly on checkout, update order and capture reserve into spent
        if (isCaptured) {
            await db
                .update(orders)
                .set({ status: "confirmed" })
                .where(eq(orders.id, validOrderId));

            // Move stock from reserveStock to soldStock
            const orderItemRows = await db
                .select()
                .from(orderItems)
                .where(eq(orderItems.orderId, validOrderId));

            for (const item of orderItemRows) {
                await db
                    .update(products)
                    .set({
                        reserveStock: sql`${products.reserveStock} - ${item.quantity}`,
                        soldStock: sql`${products.soldStock} + ${item.quantity}`,
                    })
                    .where(eq(products.id, item.productId));
            }

            // Capture authorization reserve (moves from reserveAmount to spentAmount)
            const captureResult = await captureAuthorizationReserve({
                authorizationId: validAuthId,
                amount: updatedPayment.amount,
            });
            remainingAuthAmount = captureResult.remainingAmount;
        }

        return {
            success: true,
            orderId: validOrderId,
            paymentId: validPaymentId,
            tokenId: newToken.id,
            razorpayPaymentId,
            authorizationRemainingAmount: remainingAuthAmount,
        };
    } catch (error) {
        await handleFailure();
        throw error;
    }
}



/**
 * Retrieves all pre-debit payments in 'waiting' status whose paymentAfter window has passed.
 * Used by background debit workers or schedulers.
 */
export async function getPendingPreDebitPayments() {

    const now = Number(Math.floor(Date.now() / 1000));

    return db
        .select()
        .from(preDebitPayments)
        .where(
            and(
                eq(preDebitPayments.status, "waiting"),
                lte(preDebitPayments.paymentAfter, now)
            )
        )
        .orderBy(preDebitPayments.paymentAfter);
}
