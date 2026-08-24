import { eq, and } from "drizzle-orm";
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
    validUntil: string | null;
    status: string;
}

export interface UserAuthorizationsResponse {
    userId: string;
    total: number;
    authorizations: UserAuthorizationItem[];
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

    // 2. Validate Amount
    const amountNum = Number(input.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
        throw ApiError.badRequest("Amount must be a valid positive number.");
    }

    // 3. Validate validUntil
    if (!input.validUntil) {
        throw ApiError.badRequest("validUntil date is required.");
    }
    const validUntilDate = new Date(input.validUntil);
    if (isNaN(validUntilDate.getTime())) {
        throw ApiError.badRequest("validUntil must be a valid ISO date timestamp.");
    }
    if (validUntilDate.getTime() <= Date.now()) {
        throw ApiError.badRequest("validUntil must be a timestamp in the future.");
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

    // 6. Insert pending authorization row
    const [inserted] = await db
        .insert(paymentAuthorizations)
        .values({
            userId: validUserId,
            merchantId: validMerchantId,
            authorizedAmount: amountNum.toFixed(2),
            remainingAmount: amountNum.toFixed(2),
            validUntil: validUntilDate,
            status: "pending",
        })
        .returning({
            id: paymentAuthorizations.id,
            userId: paymentAuthorizations.userId,
            merchantId: paymentAuthorizations.merchantId,
            authorizedAmount: paymentAuthorizations.authorizedAmount,
            remainingAmount: paymentAuthorizations.remainingAmount,
            validUntil: paymentAuthorizations.validUntil,
            status: paymentAuthorizations.status,
        });

    return {
        id: inserted.id,
        userId: inserted.userId,
        merchantId: inserted.merchantId,
        authorizedAmount: inserted.authorizedAmount,
        remainingAmount: inserted.remainingAmount,
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
            validUntil: paymentAuthorizations.validUntil,
            status: paymentAuthorizations.status,
        });

    return {
        id: updated.id,
        userId: updated.userId,
        merchantId: updated.merchantId,
        authorizedAmount: updated.authorizedAmount,
        remainingAmount: updated.remainingAmount,
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
            validUntil: paymentAuthorizations.validUntil,
            status: paymentAuthorizations.status,
        });

    return {
        id: updated.id,
        userId: updated.userId,
        merchantId: updated.merchantId,
        authorizedAmount: updated.authorizedAmount,
        remainingAmount: updated.remainingAmount,
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
        validUntil: r.validUntil ? r.validUntil.toISOString() : null,
        status: r.status,
    }));

    return {
        userId: validUserId,
        total: authorizations.length,
        authorizations,
    };
}
