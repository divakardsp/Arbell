import { NextRequest } from "next/server";
import { getAllMerchants } from "@/services/merchant-service";
import { ApiResponse } from "@/utils/ApiResponse";
import { handleApiError } from "@/utils/errorHandler";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = searchParams.get("page");
        const limit = searchParams.get("limit");

        const result = await getAllMerchants(page, limit);

        return ApiResponse.success(
            result,
            "Merchants retrieved successfully"
        );
    } catch (error) {
        return handleApiError(error);
    }
}
