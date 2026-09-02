import { NextRequest } from "next/server";
import { revokeAuthorization } from "@/services/payment-authorization-service";
import { ApiResponse } from "@/utils/ApiResponse";
import { handleApiError } from "@/utils/errorHandler";
import { requireCurrentUser } from "@/utils/auth";

export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ authorizationId: string }> }
) {
    try {
        const currentUser = await requireCurrentUser();
        const { authorizationId } = await params;

        const result = await revokeAuthorization(authorizationId, currentUser.id);

        return ApiResponse.success(
            result,
            "Payment authorization revoked successfully"
        );
    } catch (error) {
        return handleApiError(error);
    }
}

