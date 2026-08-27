import { eq, and, asc } from "drizzle-orm";
import { db } from "@/lib";
import { agentEvents, agentSessions, agentEventTypeEnum, agentEventStatusEnum } from "@/db/schema";
import { ApiError } from "@/utils/ApiError";
import { validateUUID } from "@/utils/validators";

export type AgentEvent = typeof agentEvents.$inferSelect;
export type AgentEventType = (typeof agentEventTypeEnum.enumValues)[number];
export type AgentEventStatus = (typeof agentEventStatusEnum.enumValues)[number];

export interface CreateAgentEventInput {
    sessionId: string;
    runId: string;
    eventType: AgentEventType;
    status?: AgentEventStatus;
    toolName?: string | null;
    inputData?: unknown;
    outputData?: unknown;
}

export interface GetAgentEventsByRunInput {
    sessionId: string;
    runId: string;
}

/**
 * Creates and persists a new agent event.
 * Validates session existence and lets the database generate event UUID and createdAt.
 */
export async function createAgentEvent(
    input: CreateAgentEventInput
): Promise<AgentEvent> {
    if (!input || typeof input !== "object") {
        throw ApiError.badRequest("Request payload must be an object.");
    }

    const validSessionId = validateUUID(input.sessionId, "Session ID");
    const validRunId = validateUUID(input.runId, "Run ID");

    // Validate eventType
    const allowedEventTypes = agentEventTypeEnum.enumValues;
    if (!input.eventType || !allowedEventTypes.includes(input.eventType)) {
        throw ApiError.badRequest(
            `Invalid or missing eventType: '${input.eventType}'.`
        );
    }

    // Validate status if provided
    let statusValue: AgentEventStatus | undefined = undefined;
    if (input.status !== undefined) {
        const allowedStatuses = agentEventStatusEnum.enumValues;
        if (!allowedStatuses.includes(input.status)) {
            throw ApiError.badRequest(
                `Invalid status: '${input.status}'.`
            );
        }
        statusValue = input.status;
    }

    // Validate toolName length if provided
    let toolNameValue: string | null = null;
    if (input.toolName !== undefined && input.toolName !== null) {
        if (typeof input.toolName !== "string") {
            throw ApiError.badRequest("toolName must be a string.");
        }
        const trimmedToolName = input.toolName.trim();
        if (trimmedToolName.length > 255) {
            throw ApiError.badRequest("toolName cannot exceed 255 characters.");
        }
        toolNameValue = trimmedToolName;
    }

    // Verify parent session exists
    const [session] = await db
        .select({ id: agentSessions.id })
        .from(agentSessions)
        .where(eq(agentSessions.id, validSessionId));

    if (!session) {
        throw ApiError.notFound(`Agent session with ID '${validSessionId}' was not found.`);
    }

    // Insert new agent event row
    const [event] = await db
        .insert(agentEvents)
        .values({
            sessionId: validSessionId,
            runId: validRunId,
            eventType: input.eventType,
            status: statusValue ?? "pending",
            toolName: toolNameValue,
            inputData: input.inputData ?? null,
            outputData: input.outputData ?? null,
        })
        .returning();

    return event;
}

/**
 * Retrieves all events belonging to a session in chronological order (createdAt ASC).
 * Throws 404 ApiError if the session does not exist.
 */
export async function getAgentEventsBySession(
    sessionId: string
): Promise<AgentEvent[]> {
    const validSessionId = validateUUID(sessionId, "Session ID");

    // Verify session exists
    const [session] = await db
        .select({ id: agentSessions.id })
        .from(agentSessions)
        .where(eq(agentSessions.id, validSessionId));

    if (!session) {
        throw ApiError.notFound(`Agent session with ID '${validSessionId}' was not found.`);
    }

    const events = await db
        .select()
        .from(agentEvents)
        .where(eq(agentEvents.sessionId, validSessionId))
        .orderBy(asc(agentEvents.createdAt));

    return events;
}

/**
 * Retrieves all events belonging to a specific run inside a session in chronological order (createdAt ASC).
 * Throws 404 ApiError if the session does not exist.
 */
export async function getAgentEventsByRun(
    input: GetAgentEventsByRunInput
): Promise<AgentEvent[]> {
    if (!input || typeof input !== "object") {
        throw ApiError.badRequest("Request payload must be an object.");
    }

    const validSessionId = validateUUID(input.sessionId, "Session ID");
    const validRunId = validateUUID(input.runId, "Run ID");

    // Verify session exists
    const [session] = await db
        .select({ id: agentSessions.id })
        .from(agentSessions)
        .where(eq(agentSessions.id, validSessionId));

    if (!session) {
        throw ApiError.notFound(`Agent session with ID '${validSessionId}' was not found.`);
    }

    const events = await db
        .select()
        .from(agentEvents)
        .where(
            and(
                eq(agentEvents.sessionId, validSessionId),
                eq(agentEvents.runId, validRunId)
            )
        )
        .orderBy(asc(agentEvents.createdAt));

    return events;
}
