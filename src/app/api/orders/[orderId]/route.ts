import { NextRequest } from "next/server";
import { getOrderById } from "@/services/order-service";
import { ApiResponse } from "@/utils/ApiResponse";
import { handleApiError } from "@/utils/errorHandler";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        const { orderId } = await params;
        const order = await getOrderById(orderId);

        return ApiResponse.success(
            order,
            "Order retrieved successfully"
        );
    } catch (error) {
        return handleApiError(error);
    }
}
