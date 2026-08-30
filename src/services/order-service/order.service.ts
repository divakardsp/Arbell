import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib";
import { users, orders, orderItems, products, merchants, payments } from "@/db/schema";
import { ApiError } from "@/utils/ApiError";
import { validateUUID } from "@/utils/validators";



export interface OrderItemSummary {
    id: string;
    productId: string;
    productName: string;
    unitPrice: string;
    quantity: number;
}

export interface OrderPaymentSummary {
    id: string;
    razorpayOrderId: string | null;
    razorpayPaymentId: string | null;
    amount: string;
    currency: string;
    status: string;
    method: string | null;
}


export interface OrderDetailResponse {
    id: string;
    status: string;
    amount: string;
    razorpayOrderId: string | null;
    user: {
        id: string;
        name: string;
        email: string;
    };
    merchant: {
        id: string;
        name: string;
    };
    items: OrderItemSummary[];
    payments: OrderPaymentSummary[];
}

/**
 * Retrieves details of a specific order by ID, joined with user, merchant, items, and payments.
 * Omits metadata timestamps.
 */
export async function getOrderById(orderId: string): Promise<OrderDetailResponse> {
    const validOrderId = validateUUID(orderId, "Order ID");

    // 1. Fetch order joined with user and merchant
    const [order] = await db
        .select({
            id: orders.id,
            status: orders.status,
            amount: orders.amount,
            razorpayOrderId: orders.razorpayOrderId,
            userId: orders.userId,
            userName: users.name,
            userEmail: users.email,
            merchantId: orders.merchantId,
            merchantName: merchants.name,
        })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .leftJoin(merchants, eq(orders.merchantId, merchants.id))
        .where(eq(orders.id, validOrderId));

    if (!order) {
        throw ApiError.notFound(`Order with ID '${validOrderId}' was not found.`);
    }

    // 2. Fetch order items
    const items = await db
        .select({
            id: orderItems.id,
            productId: orderItems.productId,
            productName: orderItems.productName,
            unitPrice: orderItems.unitPrice,
            quantity: orderItems.quantity,
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, validOrderId));

    // 3. Fetch payments
    const paymentRecords = await db
        .select({
            id: payments.id,
            razorpayOrderId: payments.razorpayOrderId,
            razorpayPaymentId: payments.razorpayPaymentId,
            amount: payments.amount,
            currency: payments.currency,
            status: payments.status,
            method: payments.method,
        })
        .from(payments)
        .where(eq(payments.orderId, validOrderId));

    return {
        id: order.id,
        status: order.status,
        amount: order.amount,
        razorpayOrderId: order.razorpayOrderId,
        user: {
            id: order.userId,
            name: order.userName ?? "",
            email: order.userEmail ?? "",
        },
        merchant: {
            id: order.merchantId,
            name: order.merchantName ?? "",
        },
        items,
        payments: paymentRecords,
    };
}
