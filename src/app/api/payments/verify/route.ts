import { NextRequest } from "next/server";
import { confirmSbmdMandate, ConfirmSbmdMandateInput } from "@/services/payment-service";
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

        const result = await confirmSbmdMandate(body as ConfirmSbmdMandateInput);

        return ApiResponse.success(
            result,
            "Payment mandate and authorization verified successfully",
            200
        );
    } catch (error) {
        return handleApiError(error);
    }
}
