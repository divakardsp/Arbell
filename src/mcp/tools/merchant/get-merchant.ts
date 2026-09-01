import { z } from "zod";
import { getMerchantById } from "@/services/merchant-service";

export const getMerchantTool = {
    name: "get_merchant",

    description:
        "Retrieve profile information and details for a specific merchant by their unique merchant ID, including store name and description.",

    inputSchema: {
        merchantId: z.string().uuid({ message: "Invalid merchant UUID format" }),
    },

    handler: async (args: { merchantId: string }) => {
        const result = await getMerchantById(args.merchantId);

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
