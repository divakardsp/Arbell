import { NextRequest } from "next/server";
import { processSbmdPayment, InitiateSbmdPaymentInput } from "@/services/payment-service";
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

        const result = await processSbmdPayment(body as InitiateSbmdPaymentInput);

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
