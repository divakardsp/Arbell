import { NextRequest } from "next/server";
import { requestMerchantReserve, RequestMerchantReserveInput } from "@/services/merchant-service";
import { ApiResponse } from "@/utils/ApiResponse";
import { handleApiError } from "@/utils/errorHandler";
import { ApiError } from "@/utils/ApiError";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ merchantId: string }> }
) {
    try {
        const { merchantId } = await params;

        let body: unknown;
        try {
            body = await request.json();
        } catch {
            throw ApiError.badRequest("Invalid JSON body.");
        }

        const result = await requestMerchantReserve(
            merchantId,
            body as RequestMerchantReserveInput
        );

        return ApiResponse.success(
            result,
            "Reserve request created successfully",
            201
        );
    } catch (error) {
        return handleApiError(error);
    }
}
