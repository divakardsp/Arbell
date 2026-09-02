import { NextRequest } from "next/server";
import { getUserById } from "@/services/user-service";
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
            throw ApiError.forbidden("You are not authorized to view this user profile.");
        }

        const user = await getUserById(currentUser.id);

        return ApiResponse.success(
            user,
            "User details retrieved successfully"
        );
    } catch (error) {
        return handleApiError(error);
    }
}

