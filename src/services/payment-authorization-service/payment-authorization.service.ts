import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "@/lib";
import { users, paymentAuthorizations, authorizationStatusEnum } from "@/db/schema";
import { ApiError } from "@/utils/ApiError";
import { validateUUID } from "@/utils/validators";

export interface CreatePaymentAuthorizationInput {
    userId: string;
    amount: number | string;
    validUntil: string | Date;
}

export interface PaymentAuthorizationResponse {
    id: string;
    userId: string;
    authorizedAmount: string;
    remainingAmount: string;
    reserveAmount: string;
    spentAmount: string;
    validUntil: string | null;
    status: string;
}

export interface UserAuthorizationItem {
    id: string;
    authorizedAmount: string;
    remainingAmount: string;
    reserveAmount: string;
    spentAmount: string;
    validUntil: string | null;
    createdAt: string | null;
    status: string;
}

export interface UserAuthorizationsResponse {
    userId: string;
    total: number;
    authorizations: UserAuthorizationItem[];
}

export interface VerifyPaymentAuthorizationInput {
    userId: string;
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
 * Creates a new universal payment authorization reserve for a user.
 */
export async function createAuthorization(
    input: CreatePaymentAuthorizationInput
): Promise<PaymentAuthorizationResponse> {
    if (!input || typeof input !== "object") {
        throw ApiError.badRequest("Request body must be an object.");
    }

    // 1. Validate UUIDs
    const validUserId = validateUUID(input.userId, "User ID");

    // 2. Validate Amount (Min: ₹500, Max: ₹15,000 INR)
    const amountNum = Number(input.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
        throw ApiError.badRequest("Amount must be a valid positive number.");
    }
    if (amountNum < 500 || amountNum > 15000) {
        throw ApiError.badRequest(
            "Authorization amount must be between ₹500 and ₹15,000 INR."
        );
    }

    // 3. Validate validUntil date (Min: 5 days, Max: 30 days from now)
    if (!input.validUntil) {
        throw ApiError.badRequest("validUntil is required.");
    }
    const validUntilDate = new Date(input.validUntil);
    if (isNaN(validUntilDate.getTime())) {
        throw ApiError.badRequest("validUntil must be a valid ISO date string or Date object.");
    }

    const now = Date.now();
    const minExpiry = now + 5 * 24 * 60 * 60 * 1000;
    const maxExpiry = now + 30 * 24 * 60 * 60 * 1000;

    if (validUntilDate.getTime() < minExpiry || validUntilDate.getTime() > maxExpiry) {
        throw ApiError.badRequest(
            "validUntil must be between 5 and 30 days from today."
        );
    }

    // 4. Verify user exists
    const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, validUserId));

    if (!user) {
        throw ApiError.notFound(`User with ID '${validUserId}' was not found.`);
    }

    const formattedAmount = amountNum.toFixed(2);

    // 5. Insert active universal authorization row
    const [inserted] = await db
        .insert(paymentAuthorizations)
        .values({
            userId: validUserId,
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
        authorizedAmount: inserted.authorizedAmount,
        remainingAmount: inserted.remainingAmount,
        reserveAmount: inserted.reserveAmount,
        spentAmount: inserted.spentAmount,
        validUntil: inserted.validUntil ? inserted.validUntil.toISOString() : null,
        status: inserted.status,
    };
}

/**
 * Revokes an existing payment authorization.
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

    // 3. Query user authorizations
    const rows = await db
        .select({
            id: paymentAuthorizations.id,
            authorizedAmount: paymentAuthorizations.authorizedAmount,
            remainingAmount: paymentAuthorizations.remainingAmount,
            reserveAmount: paymentAuthorizations.reserveAmount,
            spentAmount: paymentAuthorizations.spentAmount,
            validUntil: paymentAuthorizations.validUntil,
            createdAt: paymentAuthorizations.createdAt,
            status: paymentAuthorizations.status,
        })
        .from(paymentAuthorizations)
        .where(and(...conditions))
        .orderBy(desc(paymentAuthorizations.createdAt));

    const authorizations: UserAuthorizationItem[] = rows.map((r) => ({
        id: r.id,
        authorizedAmount: r.authorizedAmount,
        remainingAmount: r.remainingAmount,
        reserveAmount: r.reserveAmount ?? "0.00",
        spentAmount: r.spentAmount ?? "0.00",
        validUntil: r.validUntil ? r.validUntil.toISOString() : null,
        createdAt: r.createdAt ? r.createdAt.toISOString() : null,
        status: r.status,
    }));

    return {
        userId: validUserId,
        total: authorizations.length,
        authorizations,
    };
}

/**
 * Retrieves the single ACTIVE payment authorization mandate for a user.
 * In Arbell, a user can have at most one active mandate at a time.
 * If multiple active mandates exist due to legacy/inconsistent data, logs a warning and selects the latest active one.
 * Returns null if no active, non-expired mandate exists.
 */
export async function getActiveMandateForUser(
    userId: string
): Promise<PaymentAuthorizationResponse | null> {
    const validUserId = validateUUID(userId, "User ID");

    // 1. Verify user exists
    const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, validUserId));

    if (!user) {
        throw ApiError.notFound(`User with ID '${validUserId}' was not found.`);
    }

    // 2. Query active mandates ordered by creation date descending
    const activeMandates = await db
        .select()
        .from(paymentAuthorizations)
        .where(
            and(
                eq(paymentAuthorizations.userId, validUserId),
                eq(paymentAuthorizations.status, "active")
            )
        )
        .orderBy(desc(paymentAuthorizations.createdAt));

    if (activeMandates.length === 0) {
        return null;
    }

    if (activeMandates.length > 1) {
        console.warn(
            `[getActiveMandateForUser] Invariant warning: User '${validUserId}' has ${activeMandates.length} active mandates.`
        );
    }

    const latestActive = activeMandates[0];
    const now = Date.now();

    // Check expiration
    if (latestActive.validUntil && new Date(latestActive.validUntil).getTime() <= now) {
        return null;
    }

    return {
        id: latestActive.id,
        userId: latestActive.userId,
        authorizedAmount: latestActive.authorizedAmount,
        remainingAmount: latestActive.remainingAmount,
        reserveAmount: latestActive.reserveAmount,
        spentAmount: latestActive.spentAmount,
        validUntil: latestActive.validUntil ? latestActive.validUntil.toISOString() : null,
        status: latestActive.status,
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
        authorizedAmount: updated.authorizedAmount,
        remainingAmount: updated.remainingAmount,
        reserveAmount: updated.reserveAmount,
        spentAmount: updated.spentAmount,
        validUntil: updated.validUntil ? updated.validUntil.toISOString() : null,
        status: updated.status,
    };
}
