import { NextRequest } from "next/server";
import { searchProducts } from "@/services/product-service";
import { ApiResponse } from "@/utils/ApiResponse";
import { ApiError } from "@/utils/ApiError";
import { handleApiError } from "@/utils/errorHandler";

const STANDARD_QUERY_PARAMS = new Set([
    "search",
    "q",
    "category",
    "merchantid",
    "minprice",
    "maxprice",
    "instock",
    "page",
    "limit",
]);

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const search = searchParams.get("search") || searchParams.get("q");
        const category = searchParams.get("category");
        const merchantId = searchParams.get("merchantId");
        const minPrice = searchParams.get("minPrice");
        const maxPrice = searchParams.get("maxPrice");
        const inStock = searchParams.get("inStock");
        const page = searchParams.get("page");
        const limit = searchParams.get("limit");

        // Extract any additional query params as potential JSONB attribute filters
        const attributes: Record<string, string> = {};
        for (const [key, value] of searchParams.entries()) {
            if (!STANDARD_QUERY_PARAMS.has(key.toLowerCase())) {
                attributes[key] = value;
            }
        }

        if (!category || category.trim() === "") {
            throw ApiError.badRequest("Category query parameter is required.");
        }

        const result = await searchProducts({
            category,
            search,
            merchantId,
            minPrice,
            maxPrice,
            inStock,
            page,
            limit,
            attributes,
        });

        return ApiResponse.success(
            result,
            "Products retrieved successfully"
        );
    } catch (error) {
        return handleApiError(error);
    }
}
