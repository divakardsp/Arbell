import { NextRequest } from "next/server";
import {
    createAuthorization,
    CreatePaymentAuthorizationInput,
} from "@/services/payment-authorization-service";
import { ApiResponse } from "@/utils/ApiResponse";
import { handleApiError } from "@/utils/errorHandler";
import { ApiError } from "@/utils/ApiError";
import { requireCurrentUser } from "@/utils/auth";

export async function POST(request: NextRequest) {
    try {
        const currentUser = await requireCurrentUser();

        let body: unknown;
        try {
            body = await request.json();
        } catch {
            throw ApiError.badRequest("Invalid JSON body.");
        }

        if (!body || typeof body !== "object") {
            throw ApiError.badRequest("Request body must be an object.");
        }

        const input: CreatePaymentAuthorizationInput = {
            ...(body as object),
            userId: currentUser.id,
        } as CreatePaymentAuthorizationInput;

        const result = await createAuthorization(input);

        return ApiResponse.success(
            result,
            "Payment authorization created successfully",
            201
        );
    } catch (error) {
        return handleApiError(error);
    }
}

