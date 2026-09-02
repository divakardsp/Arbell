import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib";
import { users } from "@/db/schema";
import { ApiError } from "@/utils/ApiError";

export interface CurrentUser {
    id: string;
    clerkId: string;
    name: string;
    email: string;
    contact?: string | null;
}

/**
 * Reusable server-side helper to authenticate the current request via Clerk
 * and map the Clerk user ID to the internal Arbell database user record (users.id).
 *
 * Enforces explicit authentication (rejects unauthenticated requests with 401 Unauthorized).
 *
 * If the user is authenticated in Clerk but does not yet exist in the database (e.g. first API hit),
 * it seamlessly provisions / syncs them via on-demand onboarding.
 */
export async function requireCurrentUser(): Promise<CurrentUser> {
    const authRes = await auth();
    const clerkId = authRes.userId;

    if (!authRes.isAuthenticated || !clerkId) {
        throw ApiError.unauthorized("Authentication required. Please sign in to continue.");
    }

    // 1. Look up user by clerkId
    const [existingUser] = await db
        .select({
            id: users.id,
            clerkId: users.clerkId,
            name: users.name,
            email: users.email,
            contact: users.contact,
        })
        .from(users)
        .where(eq(users.clerkId, clerkId))
        .limit(1);

    if (existingUser && existingUser.clerkId) {
        return existingUser as CurrentUser;
    }

    // 2. If not found in DB yet, provision from Clerk user context
    const clerkUser = await currentUser();
    if (!clerkUser) {
        throw ApiError.unauthorized("User profile not found in authentication provider.");
    }

    const email =
        clerkUser.primaryEmailAddress?.emailAddress ??
        clerkUser.emailAddresses[0]?.emailAddress ??
        null;

    const name =
        clerkUser.fullName ??
        ([clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
            "User");

    if (!email) {
        throw ApiError.badRequest("Authenticated user is missing an email address.");
    }

    const [upsertedUser] = await db
        .insert(users)
        .values({
            clerkId: clerkUser.id,
            email,
            name,
        })
        .onConflictDoUpdate({
            target: users.clerkId,
            set: {
                email,
                name,
                updatedAt: new Date(),
            },
        })
        .returning({
            id: users.id,
            clerkId: users.clerkId,
            name: users.name,
            email: users.email,
            contact: users.contact,
        });

    if (!upsertedUser) {
        throw ApiError.internal("Failed to retrieve or provision user profile.");
    }

    return upsertedUser as CurrentUser;
}
