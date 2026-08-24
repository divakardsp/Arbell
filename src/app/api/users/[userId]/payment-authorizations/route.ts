import { NextRequest } from "next/server";
import { getUserAuthorizations } from "@/services/payment-authorization-service";
import { ApiResponse } from "@/utils/ApiResponse";
import { handleApiError } from "@/utils/errorHandler";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");

        const result = await getUserAuthorizations(userId, status);

        return ApiResponse.success(
            result,
            "User payment authorizations retrieved successfully"
        );
    } catch (error) {
        return handleApiError(error);
    }
}
