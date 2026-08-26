import crypto from "crypto";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib";
import { getRazorpayInstance } from "@/lib/razorpay";
import { users, orders, orderItems, products, payments } from "@/db/schema";
import { ApiError } from "@/utils/ApiError";
import { validateUUID } from "@/utils/validators";

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
 * Creates a Razorpay order, verifies pricing consistency against live database prices,
 * reserves stock (moves from availableStock to reserveStock), creates a pending order,
 * and initializes the payment record in the database.
 * Omits metadata timestamps.
 */
export async function createPayment(
    input: CreatePaymentInput
): Promise<CreatePaymentResponse> {
    console.log("Payment")
    if (!input || typeof input !== "object") {
        throw ApiError.badRequest(
            "Request body must be an object with 'userId', 'amount', and 'items'."
        );
    }

    // 1. Validate User ID format
    const validUserId = validateUUID(input.userId, "User ID");

    // 2. Verify user exists in database
    const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, validUserId));

    if (!user) {
        throw ApiError.notFound(`User with ID '${validUserId}' was not found.`);
    }

    // 3. Validate user-provided Amount
    const providedAmountNum = Number(input.amount);
    if (isNaN(providedAmountNum) || providedAmountNum <= 0) {
        throw ApiError.badRequest("Amount must be a valid positive number.");
    }

    // 4. Validate items array
    if (!input.items || !Array.isArray(input.items) || input.items.length === 0) {
        throw ApiError.badRequest("Payment request must contain at least one item.");
    }

    const productQuantityMap = new Map<string, number>();

    for (const item of input.items) {
        if (!item || typeof item !== "object") {
            throw ApiError.badRequest(
                "Each payment item must be an object with 'productId' and 'quantity'."
            );
        }

        const validProductId = validateUUID(item.productId, "Product ID");
        const quantity = Number(item.quantity);

        if (!Number.isInteger(quantity) || quantity < 1) {
            throw ApiError.badRequest(
                `Invalid quantity '${item.quantity}' for product '${item.productId}'. Quantity must be a positive integer.`
            );
        }

        const currentQty = productQuantityMap.get(validProductId) ?? 0;
        productQuantityMap.set(validProductId, currentQty + quantity);
    }

    const uniqueProductIds = Array.from(productQuantityMap.keys());

    // 5. Fetch products from database
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

    // Verify all requested products exist
    const foundIds = new Set(dbProducts.map((p) => p.id));
    const missingIds = uniqueProductIds.filter((id) => !foundIds.has(id));

    if (missingIds.length > 0) {
        throw ApiError.notFound(
            `The following product(s) were not found: ${missingIds.join(", ")}`
        );
    }

    // 6. Verify single-merchant consistency
    const merchantId = dbProducts[0].merchantId;
    const differentMerchantProduct = dbProducts.find((p) => p.merchantId !== merchantId);
    if (differentMerchantProduct) {
        throw ApiError.badRequest(
            "All products in an order must belong to the same merchant."
        );
    }

    // 7. Verify available stock sufficiency
    for (const product of dbProducts) {
        const requestedQty = productQuantityMap.get(product.id)!;
        if (product.availableStock < requestedQty) {
            throw ApiError.badRequest(
                `Insufficient available stock for '${product.productName}'. Available: ${product.availableStock}, Requested: ${requestedQty}.`
            );
        }
    }

    // 8. Calculate total price and match with user-provided amount
    let calculatedTotal = 0;
    for (const product of dbProducts) {
        const requestedQty = productQuantityMap.get(product.id)!;
        const priceNum = Number(product.price);
        calculatedTotal += priceNum * requestedQty;
    }

    const calculatedTotalStr = calculatedTotal.toFixed(2);
    const providedAmountStr = providedAmountNum.toFixed(2);

    if (calculatedTotalStr !== providedAmountStr) {
        throw ApiError.badRequest(
            `Amount is updated check the new amount. Expected: ${calculatedTotalStr}, Provided: ${providedAmountStr}`
        );
    }

    // 9. Create Razorpay order
    const razorpay = getRazorpayInstance();
    const currency = input.currency || "INR";
    const amountInSubunits = Math.round(calculatedTotal * 100);

    let razorpayOrder;
    try {
        razorpayOrder = await razorpay.orders.create({
            amount: amountInSubunits,
            currency,
            receipt: `rcpt_${Date.now()}_${validUserId.slice(0, 8)}`,
            notes: {
                userId: validUserId,
                merchantId,
            },
        });
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error ? error.message : "Razorpay order creation failed";
        throw ApiError.internal(`Failed to create Razorpay order: ${errorMessage}`);
    }

    console.log(razorpayOrder)

    // 10. Insert order record in database with status 'pending' and razorpayOrderId
    const [newOrder] = await db
        .insert(orders)
        .values({
            userId: validUserId,
            merchantId,
            status: "pending",
            amount: calculatedTotalStr,
            razorpayOrderId: razorpayOrder.id,
        })
        .returning({
            id: orders.id,
            userId: orders.userId,
            merchantId: orders.merchantId,
            status: orders.status,
            amount: orders.amount,
            razorpayOrderId: orders.razorpayOrderId,
        });

    // 11. Insert order item records
    const itemsToInsert = dbProducts.map((product) => ({
        orderId: newOrder.id,
        productId: product.id,
        productName: product.productName,
        unitPrice: product.price,
        quantity: productQuantityMap.get(product.id)!,
    }));

    const insertedItems = await db
        .insert(orderItems)
        .values(itemsToInsert)
        .returning({
            id: orderItems.id,
            productId: orderItems.productId,
            productName: orderItems.productName,
            unitPrice: orderItems.unitPrice,
            quantity: orderItems.quantity,
        });

    // 12. Reserve stock: decrease availableStock and increase reserveStock
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

    // 13. Create initial payment record with status 'created'
    const [newPayment] = await db
        .insert(payments)
        .values({
            orderId: newOrder.id,
            razorpayOrderId: razorpayOrder.id,
            amount: calculatedTotalStr,
            currency,
            status: "created",
        })
        .returning({
            id: payments.id,
            orderId: payments.orderId,
            razorpayOrderId: payments.razorpayOrderId,
            amount: payments.amount,
            currency: payments.currency,
            status: payments.status,
        });

    return {
        orderId: newOrder.id,
        razorpayOrderId: razorpayOrder.id,
        amount: calculatedTotalStr,
        currency,
        status: newOrder.status,
        merchantId,
        items: insertedItems,
        paymentId: newPayment.id,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    };
}

/**
 * Verifies Razorpay payment signature after client-side checkout completion.
 */
export function verifyPaymentSignature(
    input: VerifyPaymentSignatureInput
): VerifyPaymentSignatureResponse {
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
        throw ApiError.internal(
            "RAZORPAY_KEY_SECRET is missing from environment configuration."
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
