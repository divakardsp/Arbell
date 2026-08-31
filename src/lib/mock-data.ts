export type OrderStatus =
    | "pending"
    | "confirmed"
    | "processing"
    | "in_transit"
    | "delivered"
    | "cancelled"
    | "failed"
    | "return_requested"
    | "returned"
    | "refunded";

export interface MockOrder {
    id: string;
    productName: string;
    description: string;
    amount: string;
    status: OrderStatus;
    date: string;
}

export const mockOrders: MockOrder[] = [
    {
        id: "ord-1",
        productName: "MacBook Air M4",
        description: "Apple MacBook Air M4, 16GB Unified Memory, 256GB SSD, Space Gray",
        amount: "₹99,999",
        status: "delivered",
        date: "31 Aug 2026",
    },
    {
        id: "ord-2",
        productName: "Sony WH-1000XM5 Wireless Headphones",
        description: "Industry Leading Noise Canceling with 2 Processors, 8 Microphones, Silver",
        amount: "₹24,990",
        status: "in_transit",
        date: "29 Aug 2026",
    },
    {
        id: "ord-3",
        productName: "Nike Pegasus 41 Running Shoes",
        description: "Responsive cushioning road running shoes, Dual Air Zoom units, Size UK 9",
        amount: "₹11,495",
        status: "processing",
        date: "28 Aug 2026",
    },
    {
        id: "ord-4",
        productName: "Logitech MX Master 3S Mouse",
        description: "Performance wireless mouse with quiet clicks, 8K DPI tracking, Pale Gray",
        amount: "₹8,995",
        status: "confirmed",
        date: "27 Aug 2026",
    },
    {
        id: "ord-5",
        productName: "Keychron K2 Pro Mechanical Keyboard",
        description: "Wireless custom mechanical keyboard, QMK/VIA programmable, RGB Backlight",
        amount: "₹9,200",
        status: "pending",
        date: "26 Aug 2026",
    },
    {
        id: "ord-6",
        productName: "Kindle Paperwhite (16 GB)",
        description: "6.8\" display, warm adjustable light, up to 10 weeks battery life",
        amount: "₹13,999",
        status: "return_requested",
        date: "20 Aug 2026",
    },
    {
        id: "ord-7",
        productName: "Bose QuietComfort Earbuds II",
        description: "Personalized noise cancellation and sound performance, Triple Black",
        amount: "₹19,900",
        status: "refunded",
        date: "15 Aug 2026",
    },
    {
        id: "ord-8",
        productName: "Samsung 27-inch 4K UHD Monitor",
        description: "IPS panel with HDR10, USB-C 90W charging, Height adjustable stand",
        amount: "₹32,499",
        status: "cancelled",
        date: "10 Aug 2026",
    },
];

export interface MockMandate {
    id: string;
    amountAuthorized: string;
    amountRemaining: string;
    createdAt?: string;
    validUntil?: string;
    status?: "active" | "revoked";
}

export const mockMandates: MockMandate[] = [];

