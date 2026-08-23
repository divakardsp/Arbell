import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib";
import { users, orders, orderItems, products, merchants, payments } from "@/db/schema";
import { ApiError } from "@/utils/ApiError";
import { validateUUID } from "@/utils/validators";

export interface CreateOrderItemInput {
    productId: string;
    quantity: number;
}

export interface CreateOrderInput {
    userId: string;
    items: CreateOrderItemInput[];
}

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

export interface CreatedOrderResponse {
    id: string;
    userId: string;
    merchantId: string;
    status: string;
    amount: string;
    razorpayOrderId: string | null;
    items: OrderItemSummary[];
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
 * Creates a new order with items, validates stock and single-merchant consistency,
 * and deducts inventory stock.
 * Omits metadata timestamps.
 */
export async function createOrder(input: CreateOrderInput): Promise<CreatedOrderResponse> {
    if (!input || typeof input !== "object") {
        throw ApiError.badRequest("Request body must be an object with 'userId' and 'items'.");
    }

    // 1. Validate User ID
    const validUserId = validateUUID(input.userId, "User ID");

    // 2. Check user exists
    const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, validUserId));

    if (!user) {
        throw ApiError.notFound(`User with ID '${validUserId}' was not found.`);
    }

    // 3. Validate items
    if (!input.items || !Array.isArray(input.items) || input.items.length === 0) {
        throw ApiError.badRequest("Order must contain at least one item.");
    }

    const productQuantityMap = new Map<string, number>();

    for (const item of input.items) {
        if (!item || typeof item !== "object") {
            throw ApiError.badRequest("Each order item must be an object with 'productId' and 'quantity'.");
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

    // 4. Fetch products from database
    const dbProducts = await db
        .select({
            id: products.id,
            productName: products.productName,
            price: products.price,
            merchantId: products.merchantId,
            inventoryStock: products.inventoryStock,
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

    // 5. Verify single-merchant consistency
    const merchantId = dbProducts[0].merchantId;
    const differentMerchantProduct = dbProducts.find((p) => p.merchantId !== merchantId);
    if (differentMerchantProduct) {
        throw ApiError.badRequest(
            "All products in an order must belong to the same merchant."
        );
    }

    // 6. Verify inventory stock sufficiency
    for (const product of dbProducts) {
        const requestedQty = productQuantityMap.get(product.id)!;
        if (product.inventoryStock < requestedQty) {
            throw ApiError.badRequest(
                `Insufficient inventory stock for '${product.productName}'. Available: ${product.inventoryStock}, Requested: ${requestedQty}.`
            );
        }
    }

    // 7. Calculate total order amount
    let totalAmount = 0;
    for (const product of dbProducts) {
        const requestedQty = productQuantityMap.get(product.id)!;
        const priceNum = Number(product.price);
        totalAmount += priceNum * requestedQty;
    }

    // 8. Insert order record
    const [newOrder] = await db
        .insert(orders)
        .values({
            userId: validUserId,
            merchantId: merchantId,
            status: "pending",
            amount: totalAmount.toFixed(2),
        })
        .returning({
            id: orders.id,
            userId: orders.userId,
            merchantId: orders.merchantId,
            status: orders.status,
            amount: orders.amount,
            razorpayOrderId: orders.razorpayOrderId,
        });

    // 9. Insert order item records
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

    // 10. Deduct inventory stock
    for (const product of dbProducts) {
        const requestedQty = productQuantityMap.get(product.id)!;
        await db
            .update(products)
            .set({
                inventoryStock: sql`${products.inventoryStock} - ${requestedQty}`,
            })
            .where(eq(products.id, product.id));
    }

    return {
        id: newOrder.id,
        userId: newOrder.userId,
        merchantId: newOrder.merchantId,
        status: newOrder.status,
        amount: newOrder.amount,
        razorpayOrderId: newOrder.razorpayOrderId,
        items: insertedItems,
    };
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
