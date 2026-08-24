import { NextRequest } from "next/server";
import {
    createAuthorization,
    CreatePaymentAuthorizationInput,
} from "@/services/payment-authorization-service";
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

        const result = await createAuthorization(
            body as CreatePaymentAuthorizationInput
        );

        return ApiResponse.success(
            result,
            "Payment authorization created successfully",
            201
        );
    } catch (error) {
        return handleApiError(error);
    }
}
