import { z } from "zod";
import { compareProducts } from "@/services/product-service";

export const compareProductsTool = {
    name: "compare_products",

    description:
        "Compare 2 to 10 products side-by-side using their product IDs to evaluate differences in specifications, pricing, available stock, custom attributes, category, and merchant information.",

    inputSchema: {
        productIds: z
            .array(z.string().uuid({ message: "Each item must be a valid product UUID" }))
            .min(2, { message: "At least 2 product IDs are required for comparison" })
            .max(10, { message: "Cannot compare more than 10 products at a time" }),
    },

    handler: async (args: { productIds: string[] }) => {
        const result = await compareProducts(args.productIds);

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
