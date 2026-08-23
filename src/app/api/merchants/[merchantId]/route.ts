import { NextRequest } from "next/server";
import { getMerchantById } from "@/services/merchant-service";
import { ApiResponse } from "@/utils/ApiResponse";
import { handleApiError } from "@/utils/errorHandler";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ merchantId: string }> }
) {
    try {
        const { merchantId } = await params;
        const merchant = await getMerchantById(merchantId);

        return ApiResponse.success(
            merchant,
            "Merchant details retrieved successfully"
        );
    } catch (error) {
        return handleApiError(error);
    }
}
