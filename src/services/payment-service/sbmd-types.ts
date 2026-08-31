export interface SbmdPaymentItemInput {
    productId: string;
    quantity: number;
}

export interface InitiateSbmdPaymentInput {
    userId: string;
    items: SbmdPaymentItemInput[];
    amount?: number | string;
    currency?: string;
}

export interface SbmdReserveRequiredResponse {
    status: "requires_reserve";
    message: string;
    userId: string;
    merchantId: string;
    merchantName?: string;
    requiredAmount: string;
    currency: string;
}

export interface SbmdMandateRequiredResponse {
    status: "mandate_required";
    message: string;
    orderId: string;
    paymentId: string;
    razorpayOrderId: string;
    razorpayCustomerId: string;
    amount: string;
    currency: string;
    razorpayKeyId?: string;
    authorizationId: string;
    maxAmount: string;
    validUntil: string | null;
}

export interface SbmdDebitScheduledResponse {
    status: "debit_scheduled";
    message: string;
    orderId: string;
    paymentId: string;
    preDebitPaymentId: string;
    razorpayOrderId: string;
    amount: string;
    currency: string;
    paymentAfter: number; // Unix timestamp in seconds
}

export type InitiateSbmdPaymentResponse =
    | SbmdReserveRequiredResponse
    | SbmdMandateRequiredResponse
    | SbmdDebitScheduledResponse;

export interface ConfirmSbmdMandateInput {
    userId: string;
    orderId: string;
    paymentId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    authorizationId: string;
}

export interface ConfirmSbmdMandateResponse {
    success: boolean;
    orderId: string;
    paymentId: string;
    tokenId: string; // internal DB token id
    razorpayPaymentId: string;
    authorizationRemainingAmount?: string;
}

export interface ExecutePreDebitPaymentInput {
    preDebitPaymentId: string;
}

export interface ExecutePreDebitPaymentResponse {
    success: boolean;
    preDebitPaymentId: string;
    orderId: string;
    paymentId: string;
    razorpayPaymentId?: string;
    amount: string;
    status: string;
    authorizationDeducted: boolean;
    failureReason?: string;
}

export interface ProcessRecurringPaymentApiResponseInput {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    signature: string;
}

export interface ProcessRecurringPaymentApiResponseResponse {
    success: boolean;
    orderId: string;
    paymentId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    status: string;
    message: string;
}

export interface ProcessRazorpayWebhookInput {
    rawBody: string;
    webhookSignature: string;
}

export interface ProcessRazorpayWebhookResponse {
    received: boolean;
    event: string;
    orderId?: string;
    paymentId?: string;
    status: "processed" | "ignored" | "already_processed";
    message: string;
}

