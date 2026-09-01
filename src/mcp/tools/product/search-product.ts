import { z } from "zod";

import { searchProducts } from "@/services/product-service";

export const searchProductsTool = {
    name: "search_products",

    description:
        "Search Arbell products using mandatory category and search keywords (e.g. 'laptop 6gb', '5g phone'), merchant, price range, stock availability, and pagination.",

    inputSchema: {
        category: z.enum([
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
        ]).describe("Mandatory product category"),

        search: z
            .string()
            .optional()
            .describe("Search keywords containing product specifications, brand, features, etc. (e.g. 'laptop 6gb', 'shoes black 9')"),

        merchantId: z.string().uuid().optional(),

        minPrice: z.number().nonnegative().optional(),

        maxPrice: z.number().nonnegative().optional(),

        inStock: z.boolean().optional(),

        page: z.number().int().positive().optional(),

        limit: z.number().int().positive().max(100).optional(),
    },

    handler: async (args: {
        category: string;
        search?: string;
        merchantId?: string;
        minPrice?: number;
        maxPrice?: number;
        inStock?: boolean;
        page?: number;
        limit?: number;
    }) => {
        const result = await searchProducts(args);

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