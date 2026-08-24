import { NextRequest } from "next/server";
import { revokeAuthorization } from "@/services/payment-authorization-service";
import { ApiResponse } from "@/utils/ApiResponse";
import { handleApiError } from "@/utils/errorHandler";
import { ApiError } from "@/utils/ApiError";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ authorizationId: string }> }
) {
    try {
        const { authorizationId } = await params;

        let body: unknown;
        try {
            body = await request.json();
        } catch {
            throw ApiError.badRequest("Invalid JSON body.");
        }

        const bodyObj = body as { userId?: unknown };
        const userId = bodyObj?.userId;
        if (!userId || typeof userId !== "string") {
            throw ApiError.badRequest("Request body must contain 'userId'.");
        }

        const result = await revokeAuthorization(authorizationId, userId);

        return ApiResponse.success(
            result,
            "Payment authorization revoked successfully"
        );
    } catch (error) {
        return handleApiError(error);
    }
}
