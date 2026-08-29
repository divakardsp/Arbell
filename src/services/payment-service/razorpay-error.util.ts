export interface ParsedRazorpayError {
    code: string;
    description: string;
    source?: string;
    step?: string;
    reason?: string;
    metadata?: Record<string, unknown>;
}

/**
 * Extracts and normalizes structured Razorpay error details from API responses or exceptions.
 * Ensures error codes and reasons are preserved for diagnostic audits.
 */
export function parseRazorpayError(error: unknown): ParsedRazorpayError {
    if (!error || typeof error !== "object") {
        return {
            code: "UNKNOWN_ERROR",
            description: String(error || "An unknown error occurred during payment processing."),
        };
    }

    const anyErr = error as any;

    // Check nested response data
    const rzpError = anyErr.response?.data?.error || anyErr.error || anyErr;

    const code = rzpError.code || anyErr.code || "PAYMENT_PROCESSING_ERROR";
    const description =
        rzpError.description ||
        rzpError.message ||
        anyErr.message ||
        "Payment processing failed.";
    const source = rzpError.source || anyErr.source;
    const step = rzpError.step || anyErr.step;
    const reason = rzpError.reason || anyErr.reason;
    const metadata = rzpError.metadata || anyErr.metadata;

    return {
        code: String(code),
        description: String(description),
        source: source ? String(source) : undefined,
        step: step ? String(step) : undefined,
        reason: reason ? String(reason) : undefined,
        metadata: metadata && typeof metadata === "object" ? metadata : undefined,
    };
}
