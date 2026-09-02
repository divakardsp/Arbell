import { NextRequest } from "next/server";
import { processSbmdPayment, InitiateSbmdPaymentInput } from "@/services/payment-service";
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

        const input: InitiateSbmdPaymentInput = {
            ...(body as object),
            userId: currentUser.id,
        } as InitiateSbmdPaymentInput;

        const result = await processSbmdPayment(input);

        const successMessage =
            result.status === "requires_reserve"
                ? "Payment authorization reserve required"
                : result.status === "mandate_required"
                    ? "Razorpay SBMD mandate authorization required"
                    : "Razorpay SBMD debit order created and scheduled";

        return ApiResponse.success(result, successMessage, 200);
    } catch (error) {
        return handleApiError(error);
    }
}

