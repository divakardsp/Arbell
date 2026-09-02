import { NextRequest } from "next/server";
import { getUserAuthorizations } from "@/services/payment-authorization-service";
import { ApiResponse } from "@/utils/ApiResponse";
import { handleApiError } from "@/utils/errorHandler";
import { requireCurrentUser } from "@/utils/auth";
import { ApiError } from "@/utils/ApiError";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const currentUser = await requireCurrentUser();
        const { userId } = await params;

        if (userId !== "me" && userId !== currentUser.id) {
            throw ApiError.forbidden("You are not authorized to view this user's payment authorizations.");
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");

        const result = await getUserAuthorizations(currentUser.id, status);

        return ApiResponse.success(
            result,
            "User payment authorizations retrieved successfully"
        );
    } catch (error) {
        return handleApiError(error);
    }
}

