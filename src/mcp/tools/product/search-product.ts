import { z } from "zod";

import { searchProducts } from "@/services/product-service";

export const searchProductsTool = {
    name: "search_products",

    description:
        "Search Arbell products using keywords, category, merchant, price range, stock availability, and pagination.",

    inputSchema: {
        search: z.string().optional(),

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
        ]).optional(),

        merchantId: z.string().uuid().optional(),

        minPrice: z.number().nonnegative().optional(),

        maxPrice: z.number().nonnegative().optional(),

        inStock: z.boolean().optional(),

        page: z.number().int().positive().optional(),

        limit: z.number().int().positive().max(100).optional(),
    },

    handler: async (args: {
        search?: string;
        category?: string;
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