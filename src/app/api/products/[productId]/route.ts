import { NextRequest } from "next/server";
import { getProductById } from "@/services/product-service";
import { ApiResponse } from "@/utils/ApiResponse";
import { handleApiError } from "@/utils/errorHandler";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ productId: string }> }
) {
    try {
        const { productId } = await params;
        const product = await getProductById(productId);

        return ApiResponse.success(
            product,
            "Product details retrieved successfully"
        );
    } catch (error) {
        return handleApiError(error);
    }
}
