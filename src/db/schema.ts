import {
    pgTable,
    uuid,
    varchar,
    timestamp,
    text,
    numeric,
    jsonb,
    integer,
    pgEnum,
    index,
} from "drizzle-orm/pg-core";

export const categoryEnum = pgEnum("category", [
    "Electronics",
    "Clothing",
    "Footwear",
    "Books",
    "Home & Kitchen",
    "Furniture",
    "Beauty & Personal Care",
    "Grocery",
    "Sports & Fitness",
    "Toys & Games",
    "Jewelry & Accessories",
    "Bags & Luggage",
    "Automotive",
    "Mobile Phones",
    "Computers & Laptops",
    "Cameras & Photography",
    "Appliances",
    "Health & Wellness",
]);

export const orderStatusEnum = pgEnum("order_status", [
    "pending",
    "confirmed",
    "processing",
    "in_transit",
    "delivered",
    "cancelled",
    "failed",
    "return_requested",
    "returned",
    "refunded",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
    "created",
    "authorized",
    "captured",
    "failed",
    "refunded",
    "partially_refunded",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
    "upi",
    "card",
    "netbanking",
    "wallet",
    "emi",
    "bank_transfer",
    "other",
]);

export const razorpayTokenStatusEnum = pgEnum("razorpay_token_status", [
    "active",
    "inactive",
    "expired",
    "revoked",
]);

export const preDebitStatusEnum = pgEnum("pre_debit_status", [
    "waiting",
    "processing",
    "completed",
    "failed",
]);

export const authorizationStatusEnum = pgEnum("authorization_status", [
    "pending",
    "active",
    "expired",
    "revoked",
]);

export const agentSessionStatusEnum = pgEnum("agent_session_status", [
    "active",
    "completed",
    "failed",
]);

export const agentEventTypeEnum = pgEnum("agent_event_type", [
    "run_started",
    "tool_called",
    "tool_completed",
    "payment_initiated",
    "payment_completed",
    "payment_failed",
    "order_created",
    "run_completed",
    "run_failed",
]);

export const agentEventStatusEnum = pgEnum("agent_event_status", [
    "pending",
    "running",
    "completed",
    "failed",
    "cancelled",
]);

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export const merchants = pgTable("merchants", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull().unique(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export const products = pgTable("products", {
    id: uuid("id").defaultRandom().primaryKey(),

    productName: varchar("product_name", { length: 255 }).notNull(),

    description: text("description"),

    merchantId: uuid("merchant_id")
        .notNull()
        .references(() => merchants.id),

    category: categoryEnum("category").notNull(),

    price: numeric("price", {
        precision: 12,
        scale: 2,
    }).notNull(),

    currency: varchar("currency", { length: 3 })
        .notNull()
        .default("INR"),

    attributes: jsonb("attributes")
        .$type<Record<string, string | number | boolean>>()
        .notNull()
        .default({}),

    inventoryStock: integer("inventory_stock")
        .notNull()
        .default(0),

    availableStock: integer("available_stock")
        .notNull()
        .default(0),

    reserveStock: integer("reserve_stock")
        .notNull()
        .default(0),

    soldStock: integer("sold_stock")
        .notNull()
        .default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export const orders = pgTable("orders", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id),
    merchantId: uuid("merchant_id")
        .notNull()
        .references(() => merchants.id),
    status: orderStatusEnum("status").notNull().default("pending"),
    amount: numeric("amount", {
        precision: 12,
        scale: 2,
    }).notNull(),
    razorpayOrderId: varchar("razorpay_order_id", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export const orderItems = pgTable("order_items", {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
        .notNull()
        .references(() => orders.id),
    productId: uuid("product_id")
        .notNull()
        .references(() => products.id),
    productName: varchar("product_name", { length: 255 }).notNull(),
    unitPrice: numeric("unit_price", {
        precision: 12,
        scale: 2,
    }).notNull(),
    quantity: integer("quantity").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export const razorpayCustomers = pgTable("razorpay_customers", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
        .notNull()
        .unique()
        .references(() => users.id),
    razorpayCustomerId: varchar("razorpay_customer_id", { length: 255 })
        .notNull()
        .unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export const razorpayTokens = pgTable(
    "razorpay_tokens",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        razorpayCustomerId: uuid("razorpay_customer_id")
            .notNull()
            .references(() => razorpayCustomers.id),
        razorpayTokenId: text("razorpay_token_id").notNull(),
        status: razorpayTokenStatusEnum("status")
            .notNull()
            .default("active"),
        expiresAt: timestamp("expires_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("razorpay_tokens_customer_id_idx").on(table.razorpayCustomerId),
        index("razorpay_tokens_status_idx").on(table.status),
    ]
);

export const payments = pgTable("payments", {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
        .notNull()
        .references(() => orders.id),
    razorpayTokenId: uuid("razorpay_token_id").references(() => razorpayTokens.id),
    razorpayOrderId: varchar("razorpay_order_id", { length: 255 }),
    razorpayPaymentId: varchar("razorpay_payment_id", { length: 255 }),
    amount: numeric("amount", {
        precision: 12,
        scale: 2,
    }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("INR"),
    status: paymentStatusEnum("status").notNull().default("created"),
    method: paymentMethodEnum("method"),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export const preDebitPayments = pgTable(
    "pre_debit_payments",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        paymentId: uuid("payment_id")
            .notNull()
            .references(() => payments.id),
        orderId: uuid("order_id")
            .notNull()
            .references(() => orders.id),
        razorpayOrderId: varchar("razorpay_order_id", { length: 255 }).notNull(),
        razorpayTokenId: uuid("razorpay_token_id")
            .notNull()
            .references(() => razorpayTokens.id),
        amount: numeric("amount", {
            precision: 12,
            scale: 2,
        }).notNull(),
        currency: varchar("currency", { length: 3 })
            .notNull()
            .default("INR"),
        paymentAfter: timestamp("payment_after", { withTimezone: true }).notNull(),
        status: preDebitStatusEnum("status")
            .notNull()
            .default("waiting"),
        failureReason: text("failure_reason"),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("pre_debit_payments_status_payment_after_idx").on(
            table.status,
            table.paymentAfter
        ),
        index("pre_debit_payments_order_id_idx").on(table.orderId),
        index("pre_debit_payments_payment_id_idx").on(table.paymentId),
    ]
);

export const paymentAuthorizations = pgTable("payment_authorizations", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id),
    merchantId: uuid("merchant_id")
        .notNull()
        .references(() => merchants.id),
    authorizedAmount: numeric("authorized_amount", {
        precision: 12,
        scale: 2,
    }).notNull(),
    remainingAmount: numeric("remaining_amount", {
        precision: 12,
        scale: 2,
    }).notNull(),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    status: authorizationStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export const agentSessions = pgTable("agent_sessions", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id),
    title: varchar("title", { length: 255 }).notNull(),
    status: agentSessionStatusEnum("status").notNull().default("active"),
    startedAt: timestamp("started_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export const agentEvents = pgTable("agent_events", {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
        .notNull()
        .references(() => agentSessions.id),
    runId: uuid("run_id").notNull(),
    eventType: agentEventTypeEnum("event_type").notNull(),
    toolName: varchar("tool_name", { length: 255 }),
    status: agentEventStatusEnum("status").notNull().default("pending"),
    inputData: jsonb("input_data"),
    outputData: jsonb("output_data"),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});
