import { NextRequest, NextResponse } from "next/server";
import { getUserOrderHistory } from "@/services/user-service";
import { ApiResponse } from "@/utils/ApiResponse";
import { handleApiError } from "@/utils/errorHandler";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;
        const orderHistory = await getUserOrderHistory(userId);


        return ApiResponse.success(
            orderHistory,
            "User order history retrieved successfully",
            200,
        )
    } catch (error) {
        return handleApiError(error);
    }
}
