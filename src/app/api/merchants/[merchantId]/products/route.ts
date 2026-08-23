import { NextRequest } from "next/server";
import { getMerchantProducts } from "@/services/merchant-service";
import { ApiResponse } from "@/utils/ApiResponse";
import { handleApiError } from "@/utils/errorHandler";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ merchantId: string }> }
) {
    try {
        const { merchantId } = await params;
        const { searchParams } = new URL(request.url);

        const category = searchParams.get("category");
        const minPrice = searchParams.get("minPrice");
        const maxPrice = searchParams.get("maxPrice");
        const inStock = searchParams.get("inStock");
        const page = searchParams.get("page");
        const limit = searchParams.get("limit");

        const result = await getMerchantProducts(merchantId, {
            category,
            minPrice,
            maxPrice,
            inStock,
            page,
            limit,
        });

        return ApiResponse.success(
            result,
            "Merchant products retrieved successfully"
        );
    } catch (error) {
        return handleApiError(error);
    }
}
