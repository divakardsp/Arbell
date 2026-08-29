import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "@/lib";
import { users, merchants, paymentAuthorizations, authorizationStatusEnum } from "@/db/schema";
import { ApiError } from "@/utils/ApiError";
import { validateUUID } from "@/utils/validators";

export interface CreatePaymentAuthorizationInput {
    userId: string;
    merchantId: string;
    amount: number | string;
    validUntil: string | Date;
}

export interface PaymentAuthorizationResponse {
    id: string;
    userId: string;
    merchantId: string;
    authorizedAmount: string;
    remainingAmount: string;
    reserveAmount: string;
    spentAmount: string;
    validUntil: string | null;
    status: string;
}

export interface UserAuthorizationItem {
    id: string;
    merchant: {
        id: string;
        name: string;
    };
    authorizedAmount: string;
    remainingAmount: string;
    reserveAmount: string;
    spentAmount: string;
    validUntil: string | null;
    status: string;
}

export interface UserAuthorizationsResponse {
    userId: string;
    total: number;
    authorizations: UserAuthorizationItem[];
}

export interface VerifyPaymentAuthorizationInput {
    userId: string;
    merchantId: string;
    amount?: number | string;
}

export interface VerifyPaymentAuthorizationResponse {
    isAuthorized: boolean;
    reason?: string;
    authorization: PaymentAuthorizationResponse | null;
}

export interface DeductAuthorizationAmountInput {
    authorizationId: string;
    amount: number | string;
}

export interface HoldAuthorizationReserveInput {
    authorizationId: string;
    amount: number | string;
}

export interface ReleaseAuthorizationReserveInput {
    authorizationId: string;
    amount: number | string;
}

export interface CaptureAuthorizationReserveInput {
    authorizationId: string;
    amount: number | string;
}

/**
 * Creates a new payment authorization reserve with status 'pending'.
 * Mocks an external payment authorization provider API.
 * Omits metadata timestamps.
 */
export async function createAuthorization(
    input: CreatePaymentAuthorizationInput
): Promise<PaymentAuthorizationResponse> {
    if (!input || typeof input !== "object") {
        throw ApiError.badRequest("Request body must be an object.");
    }

    // 1. Validate UUIDs
    const validUserId = validateUUID(input.userId, "User ID");
    const validMerchantId = validateUUID(input.merchantId, "Merchant ID");

    // 2. Validate Amount (Min: ₹500, Max: ₹15,000 INR)
    const amountNum = Number(input.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
        throw ApiError.badRequest("Amount must be a valid positive number.");
    }
    if (amountNum < 500 || amountNum > 15000) {
        throw ApiError.badRequest(
            `Authorization amount must be between ₹500 and ₹15,000 INR. Received: ₹${amountNum.toFixed(2)}.`
        );
    }

    // 3. Validate validUntil (Min: 5 days, Max: 30 days from now)
    if (!input.validUntil) {
        throw ApiError.badRequest("validUntil date is required.");
    }
    const validUntilDate = new Date(input.validUntil);
    if (isNaN(validUntilDate.getTime())) {
        throw ApiError.badRequest("validUntil must be a valid ISO date timestamp.");
    }

    const now = Date.now();
    const minValidUntilMs = now + 5 * 24 * 60 * 60 * 1000; // 5 days from now
    const maxValidUntilMs = now + 30 * 24 * 60 * 60 * 1000; // 30 days from now

    if (validUntilDate.getTime() < minValidUntilMs) {
        throw ApiError.badRequest("validUntil must be at least 5 days from now.");
    }
    if (validUntilDate.getTime() > maxValidUntilMs) {
        throw ApiError.badRequest("validUntil cannot exceed 30 days from now.");
    }

    // 4. Verify User exists
    const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, validUserId));
    if (!user) {
        throw ApiError.notFound(`User with ID '${validUserId}' was not found.`);
    }

    // 5. Verify Merchant exists
    const [merchant] = await db
        .select({ id: merchants.id })
        .from(merchants)
        .where(eq(merchants.id, validMerchantId));
    if (!merchant) {
        throw ApiError.notFound(`Merchant with ID '${validMerchantId}' was not found.`);
    }

    const formattedAmount = amountNum.toFixed(2);

    // 6. Insert pending authorization row
    const [inserted] = await db
        .insert(paymentAuthorizations)
        .values({
            userId: validUserId,
            merchantId: validMerchantId,
            authorizedAmount: formattedAmount,
            remainingAmount: formattedAmount,
            reserveAmount: "0.00",
            spentAmount: "0.00",
            validUntil: validUntilDate,
            status: "active",
        })
        .returning({
            id: paymentAuthorizations.id,
            userId: paymentAuthorizations.userId,
            merchantId: paymentAuthorizations.merchantId,
            authorizedAmount: paymentAuthorizations.authorizedAmount,
            remainingAmount: paymentAuthorizations.remainingAmount,
            reserveAmount: paymentAuthorizations.reserveAmount,
            spentAmount: paymentAuthorizations.spentAmount,
            validUntil: paymentAuthorizations.validUntil,
            status: paymentAuthorizations.status,
        });

    return {
        id: inserted.id,
        userId: inserted.userId,
        merchantId: inserted.merchantId,
        authorizedAmount: inserted.authorizedAmount,
        remainingAmount: inserted.remainingAmount,
        reserveAmount: inserted.reserveAmount,
        spentAmount: inserted.spentAmount,
        validUntil: inserted.validUntil ? inserted.validUntil.toISOString() : null,
        status: inserted.status,
    };
}

/**
 * Approves a pending payment authorization by the user, setting its status to 'active'.
 * Omits metadata timestamps.
 */
export async function approveAuthorization(
    authorizationId: string,
    userId: string
): Promise<PaymentAuthorizationResponse> {
    const validAuthorizationId = validateUUID(authorizationId, "Authorization ID");
    const validUserId = validateUUID(userId, "User ID");

    // 1. Fetch authorization
    const [auth] = await db
        .select({
            id: paymentAuthorizations.id,
            userId: paymentAuthorizations.userId,
            merchantId: paymentAuthorizations.merchantId,
            authorizedAmount: paymentAuthorizations.authorizedAmount,
            remainingAmount: paymentAuthorizations.remainingAmount,
            reserveAmount: paymentAuthorizations.reserveAmount,
            spentAmount: paymentAuthorizations.spentAmount,
            validUntil: paymentAuthorizations.validUntil,
            status: paymentAuthorizations.status,
        })
        .from(paymentAuthorizations)
        .where(eq(paymentAuthorizations.id, validAuthorizationId));

    if (!auth) {
        throw ApiError.notFound(`Payment authorization with ID '${validAuthorizationId}' was not found.`);
    }

    // 2. Ownership check
    if (auth.userId !== validUserId) {
        throw ApiError.forbidden("You are not authorized to approve this payment authorization.");
    }

    // 3. Status check
    if (auth.status !== "pending") {
        throw ApiError.badRequest(
            `Only payment authorizations with 'pending' status can be approved. Current status: '${auth.status}'.`
        );
    }

    // 4. Expiration check
    if (auth.validUntil && new Date(auth.validUntil).getTime() <= Date.now()) {
        throw ApiError.badRequest("Cannot approve an expired payment authorization.");
    }

    // 5. Update status to active
    const [updated] = await db
        .update(paymentAuthorizations)
        .set({ status: "active" })
        .where(eq(paymentAuthorizations.id, validAuthorizationId))
        .returning({
            id: paymentAuthorizations.id,
            userId: paymentAuthorizations.userId,
            merchantId: paymentAuthorizations.merchantId,
            authorizedAmount: paymentAuthorizations.authorizedAmount,
            remainingAmount: paymentAuthorizations.remainingAmount,
            reserveAmount: paymentAuthorizations.reserveAmount,
            spentAmount: paymentAuthorizations.spentAmount,
            validUntil: paymentAuthorizations.validUntil,
            status: paymentAuthorizations.status,
        });

    return {
        id: updated.id,
        userId: updated.userId,
        merchantId: updated.merchantId,
        authorizedAmount: updated.authorizedAmount,
        remainingAmount: updated.remainingAmount,
        reserveAmount: updated.reserveAmount,
        spentAmount: updated.spentAmount,
        validUntil: updated.validUntil ? updated.validUntil.toISOString() : null,
        status: updated.status,
    };
}

/**
 * Revokes an existing payment authorization.
 * Omits metadata timestamps.
 */
export async function revokeAuthorization(
    authorizationId: string,
    userId: string
): Promise<PaymentAuthorizationResponse> {
    const validAuthorizationId = validateUUID(authorizationId, "Authorization ID");
    const validUserId = validateUUID(userId, "User ID");

    // 1. Fetch authorization
    const [auth] = await db
        .select({
            id: paymentAuthorizations.id,
            userId: paymentAuthorizations.userId,
            merchantId: paymentAuthorizations.merchantId,
            authorizedAmount: paymentAuthorizations.authorizedAmount,
            remainingAmount: paymentAuthorizations.remainingAmount,
            reserveAmount: paymentAuthorizations.reserveAmount,
            spentAmount: paymentAuthorizations.spentAmount,
            validUntil: paymentAuthorizations.validUntil,
            status: paymentAuthorizations.status,
        })
        .from(paymentAuthorizations)
        .where(eq(paymentAuthorizations.id, validAuthorizationId));

    if (!auth) {
        throw ApiError.notFound(`Payment authorization with ID '${validAuthorizationId}' was not found.`);
    }

    // 2. Ownership check (user or merchant)
    if (auth.userId !== validUserId && auth.merchantId !== validUserId) {
        throw ApiError.forbidden("You are not authorized to revoke this payment authorization.");
    }

    // 3. Status check
    if (auth.status === "revoked") {
        throw ApiError.badRequest("Payment authorization is already revoked.");
    }

    // 4. Update status to revoked
    const [updated] = await db
        .update(paymentAuthorizations)
        .set({ status: "revoked" })
        .where(eq(paymentAuthorizations.id, validAuthorizationId))
        .returning({
            id: paymentAuthorizations.id,
            userId: paymentAuthorizations.userId,
            merchantId: paymentAuthorizations.merchantId,
            authorizedAmount: paymentAuthorizations.authorizedAmount,
            remainingAmount: paymentAuthorizations.remainingAmount,
            reserveAmount: paymentAuthorizations.reserveAmount,
            spentAmount: paymentAuthorizations.spentAmount,
            validUntil: paymentAuthorizations.validUntil,
            status: paymentAuthorizations.status,
        });

    return {
        id: updated.id,
        userId: updated.userId,
        merchantId: updated.merchantId,
        authorizedAmount: updated.authorizedAmount,
        remainingAmount: updated.remainingAmount,
        reserveAmount: updated.reserveAmount,
        spentAmount: updated.spentAmount,
        validUntil: updated.validUntil ? updated.validUntil.toISOString() : null,
        status: updated.status,
    };
}

/**
 * Retrieves all payment authorizations for a given user, with optional status filtering.
 * Omits metadata timestamps.
 */
export async function getUserAuthorizations(
    userId: string,
    status?: string | null
): Promise<UserAuthorizationsResponse> {
    const validUserId = validateUUID(userId, "User ID");

    // 1. Check user exists
    const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, validUserId));

    if (!user) {
        throw ApiError.notFound(`User with ID '${validUserId}' was not found.`);
    }

    // 2. Build conditions
    const conditions = [eq(paymentAuthorizations.userId, validUserId)];

    if (status !== undefined && status !== null && status.trim() !== "") {
        const trimmedStatus = status.trim().toLowerCase();
        const matchedStatus = authorizationStatusEnum.enumValues.find(
            (s) => s.toLowerCase() === trimmedStatus
        );
        if (!matchedStatus) {
            throw ApiError.badRequest(
                `Invalid status: '${status}'.`
            );
        }
        conditions.push(eq(paymentAuthorizations.status, matchedStatus));
    }

    // 3. Query authorizations joined with merchants
    const rows = await db
        .select({
            id: paymentAuthorizations.id,
            merchantId: paymentAuthorizations.merchantId,
            merchantName: merchants.name,
            authorizedAmount: paymentAuthorizations.authorizedAmount,
            remainingAmount: paymentAuthorizations.remainingAmount,
            reserveAmount: paymentAuthorizations.reserveAmount,
            spentAmount: paymentAuthorizations.spentAmount,
            validUntil: paymentAuthorizations.validUntil,
            status: paymentAuthorizations.status,
        })
        .from(paymentAuthorizations)
        .leftJoin(merchants, eq(paymentAuthorizations.merchantId, merchants.id))
        .where(and(...conditions));

    const authorizations: UserAuthorizationItem[] = rows.map((r) => ({
        id: r.id,
        merchant: {
            id: r.merchantId,
            name: r.merchantName ?? "",
        },
        authorizedAmount: r.authorizedAmount,
        remainingAmount: r.remainingAmount,
        reserveAmount: r.reserveAmount ?? "0.00",
        spentAmount: r.spentAmount ?? "0.00",
        validUntil: r.validUntil ? r.validUntil.toISOString() : null,
        status: r.status,
    }));

    return {
        userId: validUserId,
        total: authorizations.length,
        authorizations,
    };
}

/**
 * Verifies if a user has an active, valid payment authorization reserve for a given merchant
 * with sufficient remaining balance (remainingAmount is the available spend source of truth).
 * Returns positive verification details if valid, or reason if not authorized.
 * Omits metadata timestamps.
 */
export async function verifyPaymentAuthorization(
    input: VerifyPaymentAuthorizationInput
): Promise<VerifyPaymentAuthorizationResponse> {
    if (!input || typeof input !== "object") {
        throw ApiError.badRequest("Request body must be an object with 'userId' and 'merchantId'.");
    }

    // 1. Validate UUIDs
    const validUserId = validateUUID(input.userId, "User ID");
    const validMerchantId = validateUUID(input.merchantId, "Merchant ID");

    // 2. Validate Amount if provided
    let amountNum: number | undefined;
    if (input.amount !== undefined && input.amount !== null && input.amount !== "") {
        amountNum = Number(input.amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            throw ApiError.badRequest("Amount must be a valid positive number.");
        }
    }

    // 3. Verify User exists
    const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, validUserId));
    if (!user) {
        throw ApiError.notFound(`User with ID '${validUserId}' was not found.`);
    }

    // 4. Verify Merchant exists
    const [merchant] = await db
        .select({ id: merchants.id })
        .from(merchants)
        .where(eq(merchants.id, validMerchantId));
    if (!merchant) {
        throw ApiError.notFound(`Merchant with ID '${validMerchantId}' was not found.`);
    }

    // 5. Query active payment authorizations for this user and merchant
    const activeAuths = await db
        .select({
            id: paymentAuthorizations.id,
            userId: paymentAuthorizations.userId,
            merchantId: paymentAuthorizations.merchantId,
            authorizedAmount: paymentAuthorizations.authorizedAmount,
            remainingAmount: paymentAuthorizations.remainingAmount,
            reserveAmount: paymentAuthorizations.reserveAmount,
            spentAmount: paymentAuthorizations.spentAmount,
            validUntil: paymentAuthorizations.validUntil,
            status: paymentAuthorizations.status,
        })
        .from(paymentAuthorizations)
        .where(
            and(
                eq(paymentAuthorizations.userId, validUserId),
                eq(paymentAuthorizations.merchantId, validMerchantId),
                eq(paymentAuthorizations.status, "active")
            )
        )
        .orderBy(desc(paymentAuthorizations.createdAt));

    if (activeAuths.length === 0) {
        return {
            isAuthorized: false,
            reason: "No active payment authorization found for this user and merchant.",
            authorization: null,
        };
    }

    // 6. Find a valid, unexpired authorization with sufficient remaining balance
    const now = Date.now();
    let hasExpired = false;
    let insufficientBalanceAuth: (typeof activeAuths)[0] | null = null;

    for (const auth of activeAuths) {
        // Expiration check
        if (auth.validUntil && new Date(auth.validUntil).getTime() <= now) {
            hasExpired = true;
            continue;
        }

        const remaining = Number(auth.remainingAmount);

        // Balance check
        if (amountNum !== undefined) {
            if (remaining >= amountNum) {
                return {
                    isAuthorized: true,
                    authorization: {
                        id: auth.id,
                        userId: auth.userId,
                        merchantId: auth.merchantId,
                        authorizedAmount: auth.authorizedAmount,
                        remainingAmount: auth.remainingAmount,
                        reserveAmount: auth.reserveAmount ?? "0.00",
                        spentAmount: auth.spentAmount ?? "0.00",
                        validUntil: auth.validUntil ? auth.validUntil.toISOString() : null,
                        status: auth.status,
                    },
                };
            } else {
                insufficientBalanceAuth = auth;
            }
        } else {
            // If no specific amount was requested, any active unexpired authorization with remaining > 0 is valid
            if (remaining > 0) {
                return {
                    isAuthorized: true,
                    authorization: {
                        id: auth.id,
                        userId: auth.userId,
                        merchantId: auth.merchantId,
                        authorizedAmount: auth.authorizedAmount,
                        remainingAmount: auth.remainingAmount,
                        reserveAmount: auth.reserveAmount ?? "0.00",
                        spentAmount: auth.spentAmount ?? "0.00",
                        validUntil: auth.validUntil ? auth.validUntil.toISOString() : null,
                        status: auth.status,
                    },
                };
            } else {
                insufficientBalanceAuth = auth;
            }
        }
    }

    // If no valid authorization satisfied the requirements
    if (insufficientBalanceAuth && amountNum !== undefined) {
        return {
            isAuthorized: false,
            reason: `Insufficient reserve balance.`,
            authorization: null,
        };
    }

    if (hasExpired) {
        return {
            isAuthorized: false,
            reason: "Payment authorization has expired.",
            authorization: null,
        };
    }

    return {
        isAuthorized: false,
        reason: "No valid payment authorization reserve available with sufficient remaining amount.",
        authorization: null,
    };
}

/**
 * Holds an authorization amount when scheduling a pre-debit:
 * Atomically decrements remainingAmount (available) and increments reserveAmount.
 */
export async function holdAuthorizationReserve(
    input: HoldAuthorizationReserveInput
): Promise<PaymentAuthorizationResponse> {
    const validAuthId = validateUUID(input.authorizationId, "Authorization ID");
    const amountNum = Number(input.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
        throw ApiError.badRequest("Amount must be a valid positive number.");
    }

    const [auth] = await db
        .select()
        .from(paymentAuthorizations)
        .where(eq(paymentAuthorizations.id, validAuthId));

    if (!auth) {
        throw ApiError.notFound(`Payment authorization with ID '${validAuthId}' was not found.`);
    }

    if (auth.status !== "active") {
        throw ApiError.badRequest(`Payment authorization is not active. Current status: '${auth.status}'.`);
    }

    const remainingNum = Number(auth.remainingAmount);
    if (remainingNum < amountNum) {
        throw ApiError.badRequest(
            `Insufficient available authorization balance. Available: ${remainingNum.toFixed(2)}, Required: ${amountNum.toFixed(2)}.`
        );
    }

    const amountStr = amountNum.toFixed(2);

    const [updated] = await db
        .update(paymentAuthorizations)
        .set({
            remainingAmount: sql`${paymentAuthorizations.remainingAmount} - ${amountStr}::numeric`,
            reserveAmount: sql`${paymentAuthorizations.reserveAmount} + ${amountStr}::numeric`,
        })
        .where(eq(paymentAuthorizations.id, validAuthId))
        .returning();

    return {
        id: updated.id,
        userId: updated.userId,
        merchantId: updated.merchantId,
        authorizedAmount: updated.authorizedAmount,
        remainingAmount: updated.remainingAmount,
        reserveAmount: updated.reserveAmount,
        spentAmount: updated.spentAmount,
        validUntil: updated.validUntil ? updated.validUntil.toISOString() : null,
        status: updated.status,
    };
}

/**
 * Releases a held reserve amount back to available remainingAmount when a pre-debit fails or is cancelled:
 * Atomically decrements reserveAmount and increments remainingAmount.
 */
export async function releaseAuthorizationReserve(
    input: ReleaseAuthorizationReserveInput
): Promise<PaymentAuthorizationResponse> {
    const validAuthId = validateUUID(input.authorizationId, "Authorization ID");
    const amountNum = Number(input.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
        throw ApiError.badRequest("Amount must be a valid positive number.");
    }

    const amountStr = amountNum.toFixed(2);

    const [updated] = await db
        .update(paymentAuthorizations)
        .set({
            remainingAmount: sql`${paymentAuthorizations.remainingAmount} + ${amountStr}::numeric`,
            reserveAmount: sql`GREATEST(0, ${paymentAuthorizations.reserveAmount} - ${amountStr}::numeric)`,
        })
        .where(eq(paymentAuthorizations.id, validAuthId))
        .returning();

    if (!updated) {
        throw ApiError.notFound(`Payment authorization with ID '${validAuthId}' was not found.`);
    }

    return {
        id: updated.id,
        userId: updated.userId,
        merchantId: updated.merchantId,
        authorizedAmount: updated.authorizedAmount,
        remainingAmount: updated.remainingAmount,
        reserveAmount: updated.reserveAmount,
        spentAmount: updated.spentAmount,
        validUntil: updated.validUntil ? updated.validUntil.toISOString() : null,
        status: updated.status,
    };
}

/**
 * Captures a held reserve amount when a pre-debit payment succeeds:
 * Atomically decrements reserveAmount and increments spentAmount.
 */
export async function captureAuthorizationReserve(
    input: CaptureAuthorizationReserveInput
): Promise<PaymentAuthorizationResponse> {
    const validAuthId = validateUUID(input.authorizationId, "Authorization ID");
    const amountNum = Number(input.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
        throw ApiError.badRequest("Amount must be a valid positive number.");
    }

    const amountStr = amountNum.toFixed(2);

    const [updated] = await db
        .update(paymentAuthorizations)
        .set({
            reserveAmount: sql`GREATEST(0, ${paymentAuthorizations.reserveAmount} - ${amountStr}::numeric)`,
            spentAmount: sql`${paymentAuthorizations.spentAmount} + ${amountStr}::numeric`,
        })
        .where(eq(paymentAuthorizations.id, validAuthId))
        .returning();

    if (!updated) {
        throw ApiError.notFound(`Payment authorization with ID '${validAuthId}' was not found.`);
    }

    return {
        id: updated.id,
        userId: updated.userId,
        merchantId: updated.merchantId,
        authorizedAmount: updated.authorizedAmount,
        remainingAmount: updated.remainingAmount,
        reserveAmount: updated.reserveAmount,
        spentAmount: updated.spentAmount,
        validUntil: updated.validUntil ? updated.validUntil.toISOString() : null,
        status: updated.status,
    };
}

/**
 * Deducts an authorized amount directly from an active payment authorization reserve.
 * Used during direct payment capture / mandate confirmation.
 * Omits metadata timestamps.
 */
export async function deductAuthorizationAmount(
    input: DeductAuthorizationAmountInput
): Promise<PaymentAuthorizationResponse> {
    if (!input || typeof input !== "object") {
        throw ApiError.badRequest("Request body must be an object with 'authorizationId' and 'amount'.");
    }

    const validAuthId = validateUUID(input.authorizationId, "Authorization ID");
    const amountNum = Number(input.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
        throw ApiError.badRequest("Amount must be a valid positive number.");
    }

    const [auth] = await db
        .select({
            id: paymentAuthorizations.id,
            userId: paymentAuthorizations.userId,
            merchantId: paymentAuthorizations.merchantId,
            authorizedAmount: paymentAuthorizations.authorizedAmount,
            remainingAmount: paymentAuthorizations.remainingAmount,
            reserveAmount: paymentAuthorizations.reserveAmount,
            spentAmount: paymentAuthorizations.spentAmount,
            validUntil: paymentAuthorizations.validUntil,
            status: paymentAuthorizations.status,
        })
        .from(paymentAuthorizations)
        .where(eq(paymentAuthorizations.id, validAuthId));

    if (!auth) {
        throw ApiError.notFound(`Payment authorization with ID '${validAuthId}' was not found.`);
    }

    if (auth.status !== "active") {
        throw ApiError.badRequest(
            `Payment authorization is not active. Current status: '${auth.status}'.`
        );
    }

    if (auth.validUntil && new Date(auth.validUntil).getTime() <= Date.now()) {
        throw ApiError.badRequest("Payment authorization has expired.");
    }

    const currentRemaining = Number(auth.remainingAmount);
    if (currentRemaining < amountNum) {
        throw ApiError.badRequest(
            `Insufficient authorization balance. Available: ${currentRemaining.toFixed(2)}, Required: ${amountNum.toFixed(2)}.`
        );
    }

    const amountStr = amountNum.toFixed(2);

    const [updated] = await db
        .update(paymentAuthorizations)
        .set({
            remainingAmount: sql`${paymentAuthorizations.remainingAmount} - ${amountStr}::numeric`,
            spentAmount: sql`${paymentAuthorizations.spentAmount} + ${amountStr}::numeric`,
        })
        .where(eq(paymentAuthorizations.id, validAuthId))
        .returning({
            id: paymentAuthorizations.id,
            userId: paymentAuthorizations.userId,
            merchantId: paymentAuthorizations.merchantId,
            authorizedAmount: paymentAuthorizations.authorizedAmount,
            remainingAmount: paymentAuthorizations.remainingAmount,
            reserveAmount: paymentAuthorizations.reserveAmount,
            spentAmount: paymentAuthorizations.spentAmount,
            validUntil: paymentAuthorizations.validUntil,
            status: paymentAuthorizations.status,
        });

    return {
        id: updated.id,
        userId: updated.userId,
        merchantId: updated.merchantId,
        authorizedAmount: updated.authorizedAmount,
        remainingAmount: updated.remainingAmount,
        reserveAmount: updated.reserveAmount,
        spentAmount: updated.spentAmount,
        validUntil: updated.validUntil ? updated.validUntil.toISOString() : null,
        status: updated.status,
    };
}
