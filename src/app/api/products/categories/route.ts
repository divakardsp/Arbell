import { getProductCategories } from "@/services/product-service";
import { ApiResponse } from "@/utils/ApiResponse";
import { handleApiError } from "@/utils/errorHandler";

export async function GET() {
    try {
        const categories = await getProductCategories();

        return ApiResponse.success(
            categories,
            "Product categories retrieved successfully"
        );
    } catch (error) {
        return handleApiError(error);
    }
}
