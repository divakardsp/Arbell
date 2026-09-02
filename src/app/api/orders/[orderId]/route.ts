import { NextRequest } from "next/server";
import { getOrderById } from "@/services/order-service";
import { ApiResponse } from "@/utils/ApiResponse";
import { handleApiError } from "@/utils/errorHandler";
import { requireCurrentUser } from "@/utils/auth";
import { ApiError } from "@/utils/ApiError";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        const currentUser = await requireCurrentUser();
        const { orderId } = await params;

        const order = await getOrderById(orderId);

        if (order.user.id !== currentUser.id) {
            throw ApiError.forbidden("You are not authorized to view this order.");
        }

        return ApiResponse.success(
            order,
            "Order retrieved successfully"
        );
    } catch (error) {
        return handleApiError(error);
    }
}

