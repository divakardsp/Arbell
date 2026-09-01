import { z } from "zod";
import { getUserOrderHistory } from "@/services/user-service";

export const getUserOrdersTool = {
    name: "get_user_orders",

    description:
        "Retrieve the complete historical list of orders placed by a specific user by their unique user ID, including order items, order statuses, totals, merchant info, and associated payment records.",

    inputSchema: {
        userId: z.string().uuid({ message: "Invalid user UUID format" }),
    },

    handler: async (args: { userId: string }) => {
        const result = await getUserOrderHistory(args.userId);

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
