import { NextRequest } from "next/server";
import {
    processRazorpayWebhook,
    ProcessRazorpayWebhookInput,
} from "@/services/payment-service";
import { ApiResponse } from "@/utils/ApiResponse";
import { handleApiError } from "@/utils/errorHandler";
import { ApiError } from "@/utils/ApiError";

export async function POST(request: NextRequest) {
    try {
        console.log(request)

        const rawBody = await request.text();

        console.log(rawBody)
        const webhookSignature = request.headers.get("x-razorpay-signature");

        if (!webhookSignature) {
            throw ApiError.badRequest("Missing x-razorpay-signature header.");
        }

        const input: ProcessRazorpayWebhookInput = {
            rawBody,
            webhookSignature,
        };

        const result = await processRazorpayWebhook(input);

        return ApiResponse.success(
            result,
            result.message || "Webhook processed successfully",
            200
        );
    } catch (error) {
        return handleApiError(error);
    }
}
