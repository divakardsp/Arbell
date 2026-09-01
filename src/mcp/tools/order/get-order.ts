import { z } from "zod";
import { getOrderById } from "@/services/order-service";

export const getOrderTool = {
    name: "get_order",

    description:
        "Retrieve detailed information for a specific order by its unique order ID, including current order status, total amount, ordered items with quantities and unit prices, merchant details, user information, and payment transactions.",

    inputSchema: {
        orderId: z.string().uuid({ message: "Invalid order UUID format" }),
    },

    handler: async (args: { orderId: string }) => {
        const result = await getOrderById(args.orderId);

        return {
            content: [
                {
                    type: "text" as const,
                    text: JSON.stringify(result),
                },
            ],
        };
    },
};
