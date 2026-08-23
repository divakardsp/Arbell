import { eq, inArray, desc } from "drizzle-orm";
import { db } from "@/lib";
import { users, orders, orderItems, merchants, payments } from "@/db/schema";
import { ApiError } from "@/utils/ApiError";

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates that the provided ID is a valid UUID string.
 * Throws a 400 Bad Request ApiError if invalid.
 */
export function validateUserId(userId: string): void {
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
        throw ApiError.badRequest("User ID is required and must be a non-empty string.");
    }

    if (!UUID_REGEX.test(userId.trim())) {
        throw ApiError.badRequest(
            `Invalid user ID format: '${userId}'. Expected a valid UUID (e.g. 123e4567-e89b-12d3-a456-426614174000).`
        );
    }
}

export interface UserDetails {
    id: string;
    name: string;
    email: string;
}

export interface OrderItemSummary {
    id: string;
    productId: string;
    productName: string;
    unitPrice: string;
    quantity: number;
}

export interface PaymentSummary {
    id: string;
    razorpayOrderId: string | null;
    razorpayPaymentId: string | null;
    amount: string;
    currency: string;
    status: string;
    method: string | null;
}

export interface OrderSummary {
    id: string;
    status: string;
    amount: string;
    razorpayOrderId: string | null;
    merchant: {
        id: string;
        name: string | null;
    };
    items: OrderItemSummary[];
    payments: PaymentSummary[];
}

export interface UserOrderHistoryResponse {
    userId: string;
    totalOrders: number;
    orders: OrderSummary[];
}

/**
 * Retrieves user details by userId.
 * Strips metadata like timestamps.
 */
export async function getUserById(userId: string): Promise<UserDetails> {
    const trimmedUserId = userId.trim();
    validateUserId(trimmedUserId);

    const [user] = await db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
        })
        .from(users)
        .where(eq(users.id, trimmedUserId));
    if (!user) {
        throw ApiError.notFound(`User with ID '${trimmedUserId}' was not found.`);
    }

    return {
        id: user.id,
        name: user.name,
        email: user.email,
    };
}

/**
 * Retrieves full order history for a user, including items, merchant info, and payments.
 * Strips unnecessary timestamp metadata.
 */
export async function getUserOrderHistory(userId: string): Promise<UserOrderHistoryResponse> {
    const trimmedUserId = userId.trim();
    validateUserId(trimmedUserId);

    // 1. Verify user exists
    const [user] = await db
        .select({
            id: users.id,
        })
        .from(users)
        .where(eq(users.id, trimmedUserId))
        .limit(1);

    if (!user) {
        throw ApiError.notFound(`User with ID '${trimmedUserId}' was not found.`);
    }

    // 2. Fetch all orders for this user with merchant info
    const userOrders = await db
        .select({
            id: orders.id,
            status: orders.status,
            amount: orders.amount,
            razorpayOrderId: orders.razorpayOrderId,
            merchantId: orders.merchantId,
            merchantName: merchants.name,
        })
        .from(orders)
        .leftJoin(merchants, eq(orders.merchantId, merchants.id))
        .where(eq(orders.userId, trimmedUserId))
        .orderBy(desc(orders.createdAt));

    if (userOrders.length === 0) {
        return {
            userId: user.id,
            totalOrders: 0,
            orders: [],
        };
    }

    const orderIds = userOrders.map((order) => order.id);

    // 3. Batch fetch order items for all user orders
    const items = await db
        .select({
            id: orderItems.id,
            orderId: orderItems.orderId,
            productId: orderItems.productId,
            productName: orderItems.productName,
            unitPrice: orderItems.unitPrice,
            quantity: orderItems.quantity,
        })
        .from(orderItems)
        .where(inArray(orderItems.orderId, orderIds));

    // 4. Batch fetch payments for all user orders
    const paymentRecords = await db
        .select({
            id: payments.id,
            orderId: payments.orderId,
            razorpayOrderId: payments.razorpayOrderId,
            razorpayPaymentId: payments.razorpayPaymentId,
            amount: payments.amount,
            currency: payments.currency,
            status: payments.status,
            method: payments.method,
        })
        .from(payments)
        .where(inArray(payments.orderId, orderIds));

    // 5. Index items and payments by orderId for O(1) aggregation
    const itemsByOrderId = new Map<string, typeof items>();
    for (const item of items) {
        const list = itemsByOrderId.get(item.orderId) ?? [];
        list.push(item);
        itemsByOrderId.set(item.orderId, list);
    }

    const paymentsByOrderId = new Map<string, typeof paymentRecords>();
    for (const payment of paymentRecords) {
        const list = paymentsByOrderId.get(payment.orderId) ?? [];
        list.push(payment);
        paymentsByOrderId.set(payment.orderId, list);
    }

    // 6. Assemble clean response objects without timestamps
    const formattedOrders: OrderSummary[] = userOrders.map((order) => {
        const orderItemList = itemsByOrderId.get(order.id) ?? [];
        const orderPaymentList = paymentsByOrderId.get(order.id) ?? [];

        return {
            id: order.id,
            status: order.status,
            amount: order.amount,
            razorpayOrderId: order.razorpayOrderId,
            merchant: {
                id: order.merchantId,
                name: order.merchantName,
            },
            items: orderItemList.map((item) => ({
                id: item.id,
                productId: item.productId,
                productName: item.productName,
                unitPrice: item.unitPrice,
                quantity: item.quantity,
            })),
            payments: orderPaymentList.map((payment) => ({
                id: payment.id,
                razorpayOrderId: payment.razorpayOrderId,
                razorpayPaymentId: payment.razorpayPaymentId,
                amount: payment.amount,
                currency: payment.currency,
                status: payment.status,
                method: payment.method,
            })),
        };
    });

    return {
        userId: user.id,
        totalOrders: formattedOrders.length,
        orders: formattedOrders,
    };
}
