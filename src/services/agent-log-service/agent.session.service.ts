import { eq, and } from "drizzle-orm";
import { db } from "@/lib";
import { users, agentSessions, agentSessionStatusEnum } from "@/db/schema";
import { ApiError } from "@/utils/ApiError";
import { validateUUID } from "@/utils/validators";

export type AgentSession = typeof agentSessions.$inferSelect;
export type AgentSessionStatus = (typeof agentSessionStatusEnum.enumValues)[number];

export interface CreateAgentSessionInput {
    userId: string;
    title: string;
}

export interface GetAgentSessionForUserInput {
    sessionId: string;
    userId: string;
}

export interface UpdateAgentSessionInput {
    title?: string;
    status?: AgentSessionStatus;
    endedAt?: Date | null;
}

/**
 * Creates a new agent session for a user.
 * Lets PostgreSQL/Drizzle handle UUID generation and default timestamps/status.
 */
export async function createAgentSession(
    input: CreateAgentSessionInput
): Promise<AgentSession> {
    if (!input || typeof input !== "object") {
        throw ApiError.badRequest("Request payload must be an object.");
    }

    const validUserId = validateUUID(input.userId, "User ID");

    if (!input.title || typeof input.title !== "string" || input.title.trim() === "") {
        throw ApiError.badRequest("Title is required and must be a non-empty string.");
    }

    const trimmedTitle = input.title.trim();
    if (trimmedTitle.length > 255) {
        throw ApiError.badRequest("Title cannot exceed 255 characters.");
    }

    // Verify user exists
    const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, validUserId));

    if (!user) {
        throw ApiError.notFound(`User with ID '${validUserId}' was not found.`);
    }

    // Insert new agent session row
    const [session] = await db
        .insert(agentSessions)
        .values({
            userId: validUserId,
            title: trimmedTitle,
        })
        .returning();

    return session;
}

/**
 * Retrieves an agent session by its primary ID.
 * Throws 404 ApiError if not found.
 */
export async function getAgentSessionById(
    sessionId: string
): Promise<AgentSession> {
    const validSessionId = validateUUID(sessionId, "Session ID");

    const [session] = await db
        .select()
        .from(agentSessions)
        .where(eq(agentSessions.id, validSessionId));

    if (!session) {
        throw ApiError.notFound(`Agent session with ID '${validSessionId}' was not found.`);
    }

    return session;
}

/**
 * Retrieves an agent session validating that it belongs to the specified user.
 * Queries using both sessionId AND userId to enforce strict ownership.
 * Throws 404 ApiError if the session does not exist or does not belong to the user.
 */
export async function getAgentSessionForUser(
    input: GetAgentSessionForUserInput
): Promise<AgentSession> {
    if (!input || typeof input !== "object") {
        throw ApiError.badRequest("Request payload must be an object.");
    }

    const validSessionId = validateUUID(input.sessionId, "Session ID");
    const validUserId = validateUUID(input.userId, "User ID");

    const [session] = await db
        .select()
        .from(agentSessions)
        .where(
            and(
                eq(agentSessions.id, validSessionId),
                eq(agentSessions.userId, validUserId)
            )
        );

    if (!session) {
        throw ApiError.notFound(
            `Agent session with ID '${validSessionId}' was not found for user '${validUserId}'.`
        );
    }

    return session;
}

/**
 * Updates controlled fields (title, status, endedAt) of an agent session.
 * Disallows arbitrary field modifications.
 */
export async function updateAgentSession(
    sessionId: string,
    input: UpdateAgentSessionInput
): Promise<AgentSession> {
    const validSessionId = validateUUID(sessionId, "Session ID");

    if (!input || typeof input !== "object") {
        throw ApiError.badRequest("Update payload must be an object.");
    }

    // Ensure session exists
    const [existingSession] = await db
        .select()
        .from(agentSessions)
        .where(eq(agentSessions.id, validSessionId));

    if (!existingSession) {
        throw ApiError.notFound(`Agent session with ID '${validSessionId}' was not found.`);
    }

    const fieldsToUpdate: Partial<typeof agentSessions.$inferInsert> = {
        updatedAt: new Date(),
    };

    if (input.title !== undefined) {
        if (typeof input.title !== "string" || input.title.trim() === "") {
            throw ApiError.badRequest("Title must be a non-empty string.");
        }
        const trimmedTitle = input.title.trim();
        if (trimmedTitle.length > 255) {
            throw ApiError.badRequest("Title cannot exceed 255 characters.");
        }
        fieldsToUpdate.title = trimmedTitle;
    }

    if (input.status !== undefined) {
        const allowedStatuses = agentSessionStatusEnum.enumValues;
        if (!allowedStatuses.includes(input.status)) {
            throw ApiError.badRequest(
                `Invalid session status: '${input.status}'. Allowed values are: ${allowedStatuses.join(", ")}.`
            );
        }
        fieldsToUpdate.status = input.status;
    }

    if (input.endedAt !== undefined) {
        if (input.endedAt === null) {
            fieldsToUpdate.endedAt = null;
        } else {
            const date = new Date(input.endedAt);
            if (isNaN(date.getTime())) {
                throw ApiError.badRequest("endedAt must be a valid date timestamp.");
            }
            fieldsToUpdate.endedAt = date;
        }
    }

    const [updatedSession] = await db
        .update(agentSessions)
        .set(fieldsToUpdate)
        .where(eq(agentSessions.id, validSessionId))
        .returning();

    return updatedSession;
}
