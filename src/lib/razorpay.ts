import Razorpay from "razorpay";
import { ApiError } from "@/utils/ApiError";

/**
 * Returns a configured Razorpay instance using environment credentials.
 * Throws an ApiError if credentials are not configured.
 */
export function getRazorpayInstance(): Razorpay {
    const key_id = process.env.RAZORPAY_API_KEY;
    const key_secret = process.env.RAZORPAY_API_SECRET;

    if (!key_id || !key_secret) {
        throw ApiError.internal(
            "Razorpay credentials are missing."
        );
    }

    return new Razorpay({
        key_id,
        key_secret,
    });
}
