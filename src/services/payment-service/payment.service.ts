import crypto from "crypto";
import { eq, and, or, inArray, sql, lte, desc } from "drizzle-orm";
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
    paymentAuthorizations,
    paymentMethodEnum,
} from "@/db/schema";
import { ApiError } from "@/utils/ApiError";
import { validateUUID } from "@/utils/validators";
import { encryptToken, decryptToken } from "@/utils/crypto";
import { parseRazorpayError } from "./razorpay-error.util";
import {
    getUserAuthorizations,
    getActiveMandateForUser,
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
    ProcessRecurringPaymentApiResponseInput,
    ProcessRecurringPaymentApiResponseResponse,
    ProcessRazorpayWebhookInput,
    ProcessRazorpayWebhookResponse,
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

export interface razorpayPaymentCallInput {
    preDebitPaymentId?: string;
    paymentId: string;
    orderId: string;
    razorpayOrderId: string;
    encryptedRazorpayTokenId: string;
    amount: string | number;
    currency?: string;
    status?: string;
    email: string;
}

/**
 * Verifies Razorpay payment signature after client-side checkout completion.
 */
export function verifyPaymentSignature(
    input: VerifyPaymentSignatureInput
): VerifyPaymentSignatureResponse {
    const key_secret =
        process.env.RAZORPAY_API_SECRET;
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

export interface RazorpayCustomerRecord {
    id: string;
    userId: string;
    razorpayCustomerId: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Searches Razorpay for an existing Customer by email.
 * Paginates through Razorpay customers and returns the matching customer object if found.
 * Case-insensitive exact email match.
 */
export async function findRazorpayCustomerByEmail(
    email: string
): Promise<{ id: string; name?: string; email?: string; contact?: string } | null> {
    if (!email || typeof email !== "string" || email.trim() === "") {
        return null;
    }

    const normalizedTargetEmail = email.trim().toLowerCase();
    const razorpay = getRazorpayInstance();
    const pageSize = 100;
    let skip = 0;
    const maxPages = 10; // Safety limit: up to 1,000 customers scanned

    for (let page = 0; page < maxPages; page++) {
        let response: any;
        try {
            response = await razorpay.customers.all({
                count: pageSize,
                skip,
            });
        } catch (error: unknown) {
            const parsed = parseRazorpayError(error);
            console.error(`[findRazorpayCustomerByEmail] Error fetching customers from Razorpay:`, parsed);
            throw ApiError.internal(`Failed to search Razorpay customers: ${parsed.description}`);
        }

        const items: Array<{ id: string; name?: string; email?: string; contact?: string | number; [key: string]: unknown }> =
            response?.items || [];
        if (items.length === 0) {
            break;
        }

        const matchingCustomers = items.filter(
            (c) => c.email && typeof c.email === "string" && c.email.trim().toLowerCase() === normalizedTargetEmail
        );

        if (matchingCustomers.length > 0) {
            // Return the most relevant matching customer
            const match = matchingCustomers[0];
            return {
                id: String(match.id),
                name: match.name ? String(match.name) : undefined,
                email: match.email ? String(match.email) : undefined,
                contact: match.contact !== undefined ? String(match.contact) : undefined,
            };
        }

        if (items.length < pageSize) {
            // Reached the end of available records
            break;
        }

        skip += pageSize;
    }

    return null;
}

/**
 * Retrieves the user's Razorpay Customer mapping from the local database or resolves/creates it on Razorpay.
 * Flow:
 * 1. Check local DB (razorpay_customers) for existing customer mapping.
 * 2. If missing, search Razorpay by user email.
 * 3. If found on Razorpay, save customer ID to local DB (with conflict safety) and return.
 * 4. If not found on Razorpay, create customer on Razorpay, save to DB, and return.
 */
export async function getOrCreateRazorpayCustomer(
    userId: string
): Promise<RazorpayCustomerRecord> {
    const validUserId = validateUUID(userId, "User ID");

    // 1. Check local database first
    const [existingDbCustomer] = await db
        .select()
        .from(razorpayCustomers)
        .where(eq(razorpayCustomers.userId, validUserId));

    if (existingDbCustomer) {
        return existingDbCustomer;
    }

    // Fetch user details for email & contact
    const [user] = await db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
            contact: users.contact,
        })
        .from(users)
        .where(eq(users.id, validUserId));

    if (!user) {
        throw ApiError.notFound(`User with ID '${validUserId}' was not found.`);
    }

    if (!user.email || typeof user.email !== "string" || user.email.trim() === "") {
        throw ApiError.badRequest(`User '${validUserId}' does not have a valid email address configured.`);
    }

    const razorpay = getRazorpayInstance();

    // 2. Search Razorpay for an existing customer by email
    const existingRazorpayCustomer = await findRazorpayCustomerByEmail(user.email);

    let resolvedRazorpayCustomerId: string;

    if (existingRazorpayCustomer && existingRazorpayCustomer.id) {
        // 3. Existing Razorpay customer found
        resolvedRazorpayCustomerId = existingRazorpayCustomer.id;
    } else {
        // 4. Customer NOT found on Razorpay -> Create a new customer
        try {
            const rzpCustomer = await razorpay.customers.create({
                name: user.name,
                email: user.email.trim(),
                contact: user.contact || "9999999999",
                fail_existing: 0,
                notes: {
                    userId: validUserId,
                },
            });
            resolvedRazorpayCustomerId = rzpCustomer.id;
        } catch (error: unknown) {
            const parsed = parseRazorpayError(error);
            console.error(`[getOrCreateRazorpayCustomer] Failed to create Razorpay Customer:`, parsed);
            throw ApiError.internal(`Failed to create Razorpay Customer: ${parsed.description}`);
        }
    }

    // 5. Save the resolved/created Customer ID in local database with upsert / conflict safety
    try {
        const [savedCustomer] = await db
            .insert(razorpayCustomers)
            .values({
                userId: validUserId,
                razorpayCustomerId: resolvedRazorpayCustomerId,
            })
            .onConflictDoUpdate({
                target: razorpayCustomers.userId,
                set: {
                    razorpayCustomerId: resolvedRazorpayCustomerId,
                    updatedAt: new Date(),
                },
            })
            .returning();

        return savedCustomer;
    } catch (dbError: unknown) {
        // Concurrency safeguard: If another concurrent request inserted, fetch the record
        const [concurrencyCustomer] = await db
            .select()
            .from(razorpayCustomers)
            .where(eq(razorpayCustomers.userId, validUserId));

        if (concurrencyCustomer) {
            return concurrencyCustomer;
        }

        console.error(`[getOrCreateRazorpayCustomer] Failed to save Razorpay customer record:`, dbError);
        throw ApiError.internal("Failed to persist Razorpay customer mapping in database.");
    }
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

    // 3. STEP 1: FETCH ACTIVE MANDATE & VALIDATE AVAILABLE AMOUNT
    const activeMandate = await getActiveMandateForUser(validUserId);

    if (!activeMandate) {
        const [merchant] = await db
            .select({ id: merchants.id, name: merchants.name })
            .from(merchants)
            .where(eq(merchants.id, merchantId));

        return {
            status: "requires_reserve",
            message:
                "No active universal payment mandate found. Please create a payment UPM (Universal Payment Mandate) first.",
            userId: validUserId,
            merchantId,
            merchantName: merchant?.name,
            requiredAmount: calculatedTotalStr,
            currency,
        };
    }

    const availableAmountNum = Number(activeMandate.remainingAmount || 0);

    // Validate that available mandate balance is sufficient for this purchase
    if (availableAmountNum < calculatedTotal) {
        throw ApiError.badRequest(
            `Insufficient mandate amount. Available: ₹${availableAmountNum.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}, required: ₹${calculatedTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
            "INSUFFICIENT_MANDATE_AMOUNT",
            {
                availableAmount: availableAmountNum.toFixed(2),
                requestedAmount: calculatedTotalStr,
                currency,
                authorizationId: activeMandate.id,
            }
        );
    }

    const validReserve = activeMandate;

    // 4. STEP 2: RESOLVE OR CREATE RAZORPAY CUSTOMER
    const razorpay = getRazorpayInstance();
    const dbCustomer = await getOrCreateRazorpayCustomer(validUserId);

    // 5. STEP 3: CHECK EXISTING RAZORPAY TOKEN
    const now = Date.now();
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
    const paymentAfterRaw = (debitOrder as any)?.notification?.payment_after;
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
        if (!tokenId || typeof tokenId !== "string") {
            throw ApiError.badRequest("No token_id returned by Razorpay for this authorization payment.");
        }

        // 3. Encrypt Token before saving in DB
        const encryptedToken = encryptToken(tokenId);

        // 4. Resolve Razorpay Customer
        const [dbCustomer] = await db
            .select()
            .from(razorpayCustomers)
            .where(eq(razorpayCustomers.userId, validUserId));

        if (!dbCustomer) {
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
 * Shared atomic helper: Executes successful payment capture state transitions.
 * 
 * 1. Idempotency guard (if already captured/confirmed, exit).
 * 2. Sets payments.status -> captured and records payment ID and method.
 * 3. Sets orders.status -> confirmed.
 * 4. Transitions product inventory: reserveStock -> soldStock.
 * 5. Captures payment authorization reserve: reserveAmount -> spentAmount.
 * 6. Marks preDebitPayments (if exists) -> success.
 */
export async function executePaymentSuccessTransition(params: {
    paymentId: string;
    orderId: string;
    razorpayPaymentId?: string;
    method?: (typeof paymentMethodEnum.enumValues)[number];
}): Promise<{ alreadyProcessed: boolean }> {
    return await db.transaction(async (tx) => {
        const [payment] = await tx
            .select()
            .from(payments)
            .where(eq(payments.id, params.paymentId));

        if (!payment) {
            throw ApiError.notFound(`Payment with ID '${params.paymentId}' not found.`);
        }

        const [order] = await tx
            .select()
            .from(orders)
            .where(eq(orders.id, params.orderId));

        if (!order) {
            throw ApiError.notFound(`Order with ID '${params.orderId}' not found.`);
        }

        // Idempotency check: Already processed successfully
        if (payment.status === "captured" && order.status === "confirmed") {
            return { alreadyProcessed: true };
        }

        // 1. Update Payment
        const updatePaymentPayload: any = {
            status: "captured",
            updatedAt: new Date(),
        };
        if (params.razorpayPaymentId) {
            updatePaymentPayload.razorpayPaymentId = params.razorpayPaymentId;
        }
        if (params.method) {
            updatePaymentPayload.method = params.method;
        }

        await tx
            .update(payments)
            .set(updatePaymentPayload)
            .where(eq(payments.id, params.paymentId));

        // 2. Update Order
        await tx
            .update(orders)
            .set({
                status: "confirmed",
                updatedAt: new Date(),
            })
            .where(eq(orders.id, params.orderId));

        // 3. Update Pre-debit payment if exists
        await tx
            .update(preDebitPayments)
            .set({
                status: "completed",
                updatedAt: new Date(),
            })
            .where(eq(preDebitPayments.paymentId, params.paymentId));

        // 4. Update Inventory: reserveStock -> soldStock
        const orderItemRows = await tx
            .select()
            .from(orderItems)
            .where(eq(orderItems.orderId, params.orderId));

        for (const item of orderItemRows) {
            await tx
                .update(products)
                .set({
                    reserveStock: sql`GREATEST(0, ${products.reserveStock} - ${item.quantity})`,
                    soldStock: sql`${products.soldStock} + ${item.quantity}`,
                })
                .where(eq(products.id, item.productId));
        }

        // 5. Update Authorization: reserveAmount -> spentAmount
        const [auth] = await tx
            .select()
            .from(paymentAuthorizations)
            .where(
                and(
                    eq(paymentAuthorizations.userId, order.userId),
                    eq(paymentAuthorizations.status, "active")
                )
            )
            .orderBy(desc(paymentAuthorizations.createdAt))
            .limit(1);

        if (auth) {
            const amountNum = Number(payment.amount);
            if (!isNaN(amountNum) && amountNum > 0) {
                const amountStr = amountNum.toFixed(2);
                await tx
                    .update(paymentAuthorizations)
                    .set({
                        reserveAmount: sql`GREATEST(0, ${paymentAuthorizations.reserveAmount} - ${amountStr}::numeric)`,
                        spentAmount: sql`${paymentAuthorizations.spentAmount} + ${amountStr}::numeric`,
                    })
                    .where(eq(paymentAuthorizations.id, auth.id));
            }
        }

        return { alreadyProcessed: false };
    });
}

/**
 * Shared atomic helper: Executes payment failure state transitions and cleanups.
 * 
 * 1. Idempotency guard (if already failed/cancelled, exit).
 * 2. Sets payments.status -> failed.
 * 3. Sets orders.status -> failed.
 * 4. Rolls back product inventory: reserveStock -> availableStock.
 * 5. Releases payment authorization reserve: reserveAmount -> remainingAmount.
 * 6. Marks preDebitPayments (if exists) -> failed.
 */
export async function executePaymentFailureTransition(params: {
    paymentId: string;
    orderId: string;
    reason?: string;
}): Promise<{ alreadyProcessed: boolean }> {
    return await db.transaction(async (tx) => {
        const [payment] = await tx
            .select()
            .from(payments)
            .where(eq(payments.id, params.paymentId));

        if (!payment) {
            throw ApiError.notFound(`Payment with ID '${params.paymentId}' not found.`);
        }

        const [order] = await tx
            .select()
            .from(orders)
            .where(eq(orders.id, params.orderId));

        if (!order) {
            throw ApiError.notFound(`Order with ID '${params.orderId}' not found.`);
        }

        // Idempotency check: Already failed
        if (payment.status === "failed" && order.status === "failed") {
            return { alreadyProcessed: true };
        }

        // 1. Update Payment
        await tx
            .update(payments)
            .set({
                status: "failed",
                updatedAt: new Date(),
            })
            .where(eq(payments.id, params.paymentId));

        // 2. Update Order
        await tx
            .update(orders)
            .set({
                status: "failed",
                updatedAt: new Date(),
            })
            .where(eq(orders.id, params.orderId));

        // 3. Update Pre-debit payment if exists
        await tx
            .update(preDebitPayments)
            .set({
                status: "failed",
                failureReason: params.reason || "Payment failed",
                updatedAt: new Date(),
            })
            .where(eq(preDebitPayments.paymentId, params.paymentId));

        // 4. Release Inventory: reserveStock -> availableStock
        const orderItemRows = await tx
            .select()
            .from(orderItems)
            .where(eq(orderItems.orderId, params.orderId));

        for (const item of orderItemRows) {
            await tx
                .update(products)
                .set({
                    reserveStock: sql`GREATEST(0, ${products.reserveStock} - ${item.quantity})`,
                    availableStock: sql`${products.availableStock} + ${item.quantity}`,
                })
                .where(eq(products.id, item.productId));
        }

        // 5. Release Authorization: reserveAmount -> remainingAmount
        const [auth] = await tx
            .select()
            .from(paymentAuthorizations)
            .where(
                and(
                    eq(paymentAuthorizations.userId, order.userId),
                )
            )
            .orderBy(desc(paymentAuthorizations.createdAt))
            .limit(1);

        if (auth) {
            const amountNum = Number(payment.amount);
            if (!isNaN(amountNum) && amountNum > 0) {
                const amountStr = amountNum.toFixed(2);
                await tx
                    .update(paymentAuthorizations)
                    .set({
                        remainingAmount: sql`${paymentAuthorizations.remainingAmount} + ${amountStr}::numeric`,
                        reserveAmount: sql`GREATEST(0, ${paymentAuthorizations.reserveAmount} - ${amountStr}::numeric)`,
                    })
                    .where(eq(paymentAuthorizations.id, auth.id));
            }
        }

        return { alreadyProcessed: false };
    });
}

/**
 * FUNCTION 1:
 * Processes response received after Razorpay recurring/SBMD payment execution.
 * 
 * 1. Validates input.
 * 2. Verifies Razorpay payment signature using RAZORPAY_API_SECRET / RAZORPAY_KEY_SECRET.
 * 3. Associates razorpayPaymentId with payments table.
 * 4. DOES NOT change payment status (delegated to webhook for finality).
 */
export async function processRecurringPaymentFromApiResponse(
    input: ProcessRecurringPaymentApiResponseInput
): Promise<ProcessRecurringPaymentApiResponseResponse> {
    if (!input || typeof input !== "object") {
        throw ApiError.badRequest("Request body must be an object with razorpayOrderId, razorpayPaymentId, and signature.");
    }

    const { razorpayOrderId, razorpayPaymentId, signature } = input;

    if (!razorpayOrderId || typeof razorpayOrderId !== "string" || !razorpayOrderId.trim()) {
        throw ApiError.badRequest("razorpayOrderId is required.");
    }

    if (!razorpayPaymentId || typeof razorpayPaymentId !== "string" || !razorpayPaymentId.trim()) {
        throw ApiError.badRequest("razorpayPaymentId is required.");
    }

    if (!signature || typeof signature !== "string" || !signature.trim()) {
        throw ApiError.badRequest("signature is required.");
    }

    // 1. Signature Verification using RAZORPAY_API_SECRET
    const { isValid } = verifyPaymentSignature({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature: signature,
    });

    if (!isValid) {
        throw ApiError.badRequest("Invalid Razorpay payment signature verification failed.");
    }

    // 2. Lookup payment by Razorpay Order ID
    const [dbPayment] = await db
        .select()
        .from(payments)
        .where(eq(payments.razorpayOrderId, razorpayOrderId))
        .orderBy(desc(payments.createdAt))
        .limit(1);

    if (!dbPayment) {
        throw ApiError.notFound(`No payment record found associated with Razorpay Order ID '${razorpayOrderId}'.`);
    }

    // 3. Store razorpayPaymentId and ensure status is "created" without final confirmation
    const [updatedPayment] = await db
        .update(payments)
        .set({
            razorpayPaymentId,
            status: "created",
            updatedAt: new Date(),
        })
        .where(eq(payments.id, dbPayment.id))
        .returning();

    return {
        success: true,
        orderId: dbPayment.orderId,
        paymentId: dbPayment.id,
        razorpayOrderId,
        razorpayPaymentId,
        status: updatedPayment?.status || "created",
        message: "Payment response verified and linked with status set to created. Awaiting final confirmation via webhook.",
    };
}

/**
 * FUNCTION 2:
 * Processes incoming Razorpay webhooks.
 * 
 * 1. Validates payload and HMAC signature using RAZORPAY_WEBHOOK_SECRET.
 * 2. Parses event type (payment.captured, order.paid, payment.failed, etc.).
 * 3. Applies atomic transactional state transitions with idempotency checks.
 */
export async function processRazorpayWebhook(
    input: ProcessRazorpayWebhookInput
): Promise<ProcessRazorpayWebhookResponse> {
    if (!input || typeof input !== "object") {
        throw ApiError.badRequest("Webhook input must be an object with rawBody and webhookSignature.");
    }

    const { rawBody, webhookSignature } = input;

    if (!rawBody || typeof rawBody !== "string") {
        throw ApiError.badRequest("Missing rawBody in webhook payload.");
    }

    if (!webhookSignature || typeof webhookSignature !== "string") {
        throw ApiError.badRequest("Missing webhookSignature (x-razorpay-signature header).");
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
        throw ApiError.internal("RAZORPAY_WEBHOOK_SECRET is missing from environment configuration.");
    }

    // 1. Verify Webhook HMAC Signature
    const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

    if (expectedSignature !== webhookSignature) {
        throw ApiError.unauthorized("Invalid Razorpay webhook signature.");
    }

    // 2. Parse Webhook Event JSON
    let eventPayload: any;
    try {
        eventPayload = JSON.parse(rawBody);
        console.dir(eventPayload, { depth: null })
        console.log("LOGGING---------------------------------------------------")
        console.log(eventPayload)
    } catch {
        throw ApiError.badRequest("Webhook rawBody is not valid JSON.");
    }

    const event = eventPayload.event;
    if (!event || typeof event !== "string") {
        throw ApiError.badRequest("Webhook payload missing 'event' field.");
    }

    const paymentEntity = eventPayload.payload?.payment?.entity;
    const orderEntity = eventPayload.payload?.order?.entity;

    const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
    const razorpayPaymentId = paymentEntity?.id;

    if (!razorpayOrderId && !razorpayPaymentId) {
        return {
            received: true,
            event,
            status: "ignored",
            message: "Webhook event has no associated order_id or payment_id entity.",
        };
    }

    // 3. Find corresponding Arbell Payment
    let dbPayment;
    if (razorpayOrderId) {
        [dbPayment] = await db
            .select()
            .from(payments)
            .where(eq(payments.razorpayOrderId, razorpayOrderId))
            .orderBy(desc(payments.createdAt))
            .limit(1);
    }

    if (!dbPayment && razorpayPaymentId) {
        [dbPayment] = await db
            .select()
            .from(payments)
            .where(eq(payments.razorpayPaymentId, razorpayPaymentId))
            .orderBy(desc(payments.createdAt))
            .limit(1);
    }

    if (!dbPayment) {
        return {
            received: true,
            event,
            status: "ignored",
            message: "No matching Arbell payment record found for this webhook entity.",
        };
    }

    // 4. Handle Specific Event Types
    if (event === "payment.captured" || event === "order.paid") {
        const method = paymentEntity?.method === "card" ? "card" : "upi";
        const { alreadyProcessed } = await executePaymentSuccessTransition({
            paymentId: dbPayment.id,
            orderId: dbPayment.orderId,
            razorpayPaymentId: razorpayPaymentId || dbPayment.razorpayPaymentId || undefined,
            method,
        });

        return {
            received: true,
            event,
            orderId: dbPayment.orderId,
            paymentId: dbPayment.id,
            status: alreadyProcessed ? "already_processed" : "processed",
            message: alreadyProcessed
                ? "Payment was already captured and confirmed."
                : "Payment captured, order confirmed, and stock liquidated successfully.",
        };
    }

    if (event === "payment.failed") {
        const failureReason = paymentEntity?.error_description || "Razorpay payment failed";
        const { alreadyProcessed } = await executePaymentFailureTransition({
            paymentId: dbPayment.id,
            orderId: dbPayment.orderId,
            reason: failureReason,
        });

        return {
            received: true,
            event,
            status: alreadyProcessed ? "already_processed" : "processed",
            message: alreadyProcessed
                ? "Payment failure was already processed."
                : "Payment marked failed, order cancelled, and stock/authorization released.",
        };
    }

    // Other events (refunds, token updates, etc.)
    return {
        received: true,
        event,
        orderId: dbPayment.orderId,
        paymentId: dbPayment.id,
        status: "ignored",
        message: `Webhook event '${event}' acknowledged without state mutation.`,
    };
}

export async function razorpayPaymentCall(inputs: razorpayPaymentCallInput[]) {
    if (!Array.isArray(inputs) || inputs.length === 0) {
        return [];
    }

    const razorpay = getRazorpayInstance();
    const results = [];

    for (const item of inputs) {
        const {
            paymentId,
            orderId,
            razorpayOrderId,
            encryptedRazorpayTokenId,
            amount: rawAmount,
            currency = "INR",
            email,
            preDebitPaymentId,
        } = item;

        try {
            // 1. Basic input validation
            if (!paymentId || !orderId || !razorpayOrderId || !encryptedRazorpayTokenId || !email) {
                const missingMsg = "Missing required parameters (paymentId, orderId, razorpayOrderId, encryptedRazorpayTokenId, or email).";
                console.error(`[razorpayPaymentCall] Validation failed:`, { item, error: missingMsg });

                if (paymentId && orderId) {
                    await executePaymentFailureTransition({
                        paymentId,
                        orderId,
                        reason: missingMsg,
                    }).catch((err) => console.error(`[razorpayPaymentCall] Failed executePaymentFailureTransition:`, err));
                }

                results.push({
                    paymentId: paymentId || "unknown",
                    orderId: orderId || "unknown",
                    success: false,
                    error: missingMsg,
                });
                continue;
            }

            // 2. Fetch User & Customer ID corresponding to orderId
            const [orderRecord] = await db
                .select({
                    orderId: orders.id,
                    userId: orders.userId,
                })
                .from(orders)
                .where(eq(orders.id, orderId))
                .limit(1);

            if (!orderRecord || !orderRecord.userId) {
                const userNotFoundMsg = `Order '${orderId}' or associated user not found.`;
                console.error(`[razorpayPaymentCall] ${userNotFoundMsg}`);

                await executePaymentFailureTransition({
                    paymentId,
                    orderId,
                    reason: userNotFoundMsg,
                }).catch((err) => console.error(`[razorpayPaymentCall] Failed executePaymentFailureTransition:`, err));

                results.push({
                    paymentId,
                    orderId,
                    success: false,
                    error: userNotFoundMsg,
                });
                continue;
            }

            const [customerRecord] = await db
                .select({
                    razorpayCustomerId: razorpayCustomers.razorpayCustomerId,
                })
                .from(razorpayCustomers)
                .where(eq(razorpayCustomers.userId, orderRecord.userId))
                .limit(1);

            if (!customerRecord || !customerRecord.razorpayCustomerId) {
                const custNotFoundMsg = `Razorpay customer ID not found for userId '${orderRecord.userId}'.`;
                console.error(`[razorpayPaymentCall] ${custNotFoundMsg}`);

                await executePaymentFailureTransition({
                    paymentId,
                    orderId,
                    reason: custNotFoundMsg,
                }).catch((err) => console.error(`[razorpayPaymentCall] Failed executePaymentFailureTransition:`, err));

                results.push({
                    paymentId,
                    orderId,
                    success: false,
                    error: custNotFoundMsg,
                });
                continue;
            }

            // 3. Prepare parameters for Razorpay recurring payment API
            const amountNum = Number(rawAmount);
            if (isNaN(amountNum) || amountNum <= 0) {
                const invalidAmountMsg = `Invalid payment amount '${rawAmount}'.`;
                console.error(`[razorpayPaymentCall] ${invalidAmountMsg}`);

                await executePaymentFailureTransition({
                    paymentId,
                    orderId,
                    reason: invalidAmountMsg,
                }).catch((err) => console.error(`[razorpayPaymentCall] Failed executePaymentFailureTransition:`, err));

                results.push({
                    paymentId,
                    orderId,
                    success: false,
                    error: invalidAmountMsg,
                });
                continue;
            }

            // Convert amount to subunits (paise)
            const amountInSubunits = Math.round(amountNum * 100);
            const plainToken = decryptToken(encryptedRazorpayTokenId);

            const paymentPayload = {
                email: email.trim(),
                contact: "9999999999",
                amount: amountInSubunits,
                currency,
                order_id: razorpayOrderId,
                customer_id: customerRecord.razorpayCustomerId,
                token: plainToken,
                recurring: true,
                description: `Recurring debit for order ${orderId}`,
                notes: {
                    orderId,
                    paymentId,
                    preDebitPaymentId: preDebitPaymentId || "",
                },
            };

            // 4. Call Razorpay payment API
            let rzpResponse: any;
            try {
                rzpResponse = await razorpay.payments.createRecurringPayment(paymentPayload);
            } catch (apiError: unknown) {
                const parsedError = parseRazorpayError(apiError);
                const failureReason = parsedError.reason || parsedError.description || "Razorpay recurring payment failed";

                console.error(`[razorpayPaymentCall] Razorpay API Error for paymentId '${paymentId}':`, {
                    parsedError,
                    apiError,
                });

                await executePaymentFailureTransition({
                    paymentId,
                    orderId,
                    reason: failureReason,
                }).catch((err) => console.error(`[razorpayPaymentCall] Failed executePaymentFailureTransition:`, err));

                results.push({
                    paymentId,
                    orderId,
                    success: false,
                    error: failureReason,
                    details: parsedError,
                });
                continue;
            }

            // 5. Success handling
            const razorpayPaymentId = rzpResponse.razorpay_payment_id || rzpResponse.id;
            const resRazorpayOrderId = rzpResponse.razorpay_order_id || razorpayOrderId;
            const razorpaySignature = rzpResponse.razorpay_signature || "";

            const processResult = await processRecurringPaymentFromApiResponse({
                razorpayOrderId: resRazorpayOrderId,
                razorpayPaymentId,
                signature: razorpaySignature,
            });

            results.push({
                paymentId,
                orderId,
                success: true,
                razorpayPaymentId,
                razorpayOrderId: resRazorpayOrderId,
                processResult,
            });
        } catch (unexpectedError: any) {
            console.error(`[razorpayPaymentCall] Unexpected error for paymentId '${paymentId}':`, unexpectedError);

            if (paymentId && orderId) {
                await executePaymentFailureTransition({
                    paymentId,
                    orderId,
                    reason: unexpectedError?.message || "Unexpected error during recurring payment processing",
                }).catch((err) => console.error(`[razorpayPaymentCall] Failed executePaymentFailureTransition:`, err));
            }

            results.push({
                paymentId: paymentId || "unknown",
                orderId: orderId || "unknown",
                success: false,
                error: unexpectedError?.message || "Internal error occurred",
            });
        }
    }

    return results;
}


