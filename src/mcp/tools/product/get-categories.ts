import { getProductCategories } from "@/services/product-service";

export const getCategoriesTool = {
    name: "get_categories",

    description:
        "Retrieve the list of all supported product categories available in the Arbell marketplace catalog.",

    inputSchema: {},

    handler: async () => {
        const result = await getProductCategories();

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
