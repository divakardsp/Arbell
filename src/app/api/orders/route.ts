import { NextRequest } from "next/server";
import { createOrder, CreateOrderInput } from "@/services/order-service";
import { ApiResponse } from "@/utils/ApiResponse";
import { handleApiError } from "@/utils/errorHandler";
import { ApiError } from "@/utils/ApiError";

export async function POST(request: NextRequest) {
    try {
        let body: unknown;
        try {
            body = await request.json();
        } catch {
            throw ApiError.badRequest("Invalid JSON body.");
        }

        const result = await createOrder(body as CreateOrderInput);

        return ApiResponse.success(
            result,
            "Order created successfully",
            201
        );
    } catch (error) {
        return handleApiError(error);
    }
}
