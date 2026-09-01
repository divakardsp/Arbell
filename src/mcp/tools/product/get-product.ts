import { z } from "zod";
import { getProductById } from "@/services/product-service";

export const getProductTool = {
    name: "get_product",

    description:
        "Retrieve detailed information for a single product by its unique product ID, including name, description, category, price, available stock, category-specific attributes, and merchant details.",

    inputSchema: {
        productId: z.string().uuid({ message: "Invalid product UUID format" }),
    },

    handler: async (args: { productId: string }) => {
        const result = await getProductById(args.productId);

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
