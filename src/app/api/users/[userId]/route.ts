import { NextRequest, NextResponse } from "next/server";
import { getUserById } from "@/services/user-service";
import { ApiResponse } from "@/utils/ApiResponse";
import { handleApiError } from "@/utils/errorHandler";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;
        const user = await getUserById(userId);

        return ApiResponse.success(
            user,
            "User details retrieved successfully",
        );
    } catch (error) {
        return handleApiError(error);
    }
}
