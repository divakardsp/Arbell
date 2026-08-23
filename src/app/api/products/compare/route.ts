import { NextRequest } from "next/server";
import { compareProducts } from "@/services/product-service";
import { ApiResponse } from "@/utils/ApiResponse";
import { handleApiError } from "@/utils/errorHandler";
import { ApiError } from "@/utils/ApiError";

function extractProductIdsFromSearchParams(searchParams: URLSearchParams): string[] {
    const rawItems = [
        ...searchParams.getAll("productIds")
    ];

    const ids: string[] = [];
    for (const item of rawItems) {
        const parts = item.split(",").map((s) => s.trim()).filter(Boolean);
        ids.push(...parts);
    }

    return ids;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productIds = extractProductIdsFromSearchParams(searchParams);

        if (productIds.length === 0) {
            throw ApiError.badRequest(
                "Missing product IDs for comparison. Provide IDs via '?ids=id1,id2' or '?productIds=id1&productIds=id2'."
            );
        }

        const comparison = await compareProducts(productIds);

        return ApiResponse.success(
            comparison,
            "Product comparison retrieved successfully"
        );
    } catch (error) {
        return handleApiError(error);
    }
}



