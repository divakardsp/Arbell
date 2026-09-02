import { NextRequest } from "next/server";
import { getUserOrderHistory } from "@/services/user-service";
import { ApiResponse } from "@/utils/ApiResponse";
import { handleApiError } from "@/utils/errorHandler";
import { requireCurrentUser } from "@/utils/auth";
import { ApiError } from "@/utils/ApiError";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const currentUser = await requireCurrentUser();
        const { userId } = await params;

        if (userId !== "me" && userId !== currentUser.id) {
            throw ApiError.forbidden("You are not authorized to view this user's order history.");
        }

        const orderHistory = await getUserOrderHistory(currentUser.id);

        return ApiResponse.success(
            orderHistory,
            "User order history retrieved successfully",
            200
        );
    } catch (error) {
        return handleApiError(error);
    }
}

