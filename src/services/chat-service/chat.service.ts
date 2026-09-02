import { eq, and, inArray, asc, desc } from "drizzle-orm";
import { db } from "@/lib";
import { agentSessions, agentEvents } from "@/db/schema";
import { ApiError } from "@/utils/ApiError";
import { validateUUID } from "@/utils/validators";

export interface ChatMessageHistory {
    role: "user" | "assistant";
    content: string;
}

export interface ChatHistory {
    sessionId: string;
    title: string;
    createdAt: Date;
}

export interface ChatHistoryResponse {
    chat: ChatHistory[];
}

export interface ChatMessagesHistoryResponse {
    sessionId: string,
    title: string,
    createdAt: Date,
    messages: ChatMessageHistory[]
}

/**
 * Transforms raw agent database events into user-facing conversational messages.
 * Only extracts the original user prompt (from 'run_started') and final agent response
 * (from 'run_completed' or 'run_failed').
 *
 * Excludes internal events such as tool calls, tool results, payment events, and intermediate logs.
 */
function extractConversationMessages(
    events: Array<{
        eventType: string;
        inputData: unknown;
        outputData: unknown;
    }>
): ChatMessageHistory[] {
    const messages: ChatMessageHistory[] = [];

    for (const event of events) {
        if (event.eventType === "run_started") {
            const input = event.inputData as { message?: string; query?: string } | null;
            const text = input?.message || input?.query;
            if (text && typeof text === "string" && text.trim() !== "") {
                messages.push({
                    role: "user",
                    content: text.trim(),
                });
            }
        } else if (event.eventType === "run_completed") {
            const output = event.outputData as { response?: string } | null;
            if (output && typeof output.response === "string" && output.response.trim() !== "") {
                messages.push({
                    role: "assistant",
                    content: output.response.trim(),
                });
            }
        } else if (event.eventType === "run_failed") {
            const output = event.outputData as { error?: string; response?: string } | null;
            const errorText = output?.error || output?.response;
            if (errorText && typeof errorText === "string" && errorText.trim() !== "") {
                messages.push({
                    role: "assistant",
                    content: errorText.trim(),
                });
            }
        }
    }

    return messages;
}

/**
 * Retrieves the complete chat history for an authenticated user.
 * Fetches all user sessions and their conversation events in 2 efficient batch queries,
 * eliminating N+1 database queries.
 */
export async function getUserChatHistory(
    userId: string
): Promise<ChatHistoryResponse> {
    const validUserId = validateUUID(userId, "User ID");

    // 1. Fetch all agent sessions belonging to this user
    const sessions = await db
        .select({
            id: agentSessions.id,
            title: agentSessions.title,
            createdAt: agentSessions.createdAt,
            updatedAt: agentSessions.updatedAt,
        })
        .from(agentSessions)
        .where(eq(agentSessions.userId, validUserId))
        .orderBy(desc(agentSessions.createdAt));

    if (sessions.length === 0) {
        return { chat: [] };
    }

    const sessionIds = sessions.map((s) => s.id);


    // 4. Map sessions to clean conversational structure
    const chat: ChatHistory[] = sessions.map((session) => ({
        sessionId: session.id,
        title: session.title,
        createdAt: session.createdAt,
    }));

    return { chat };
}

/**
 * Retrieves the chat history for a single specific session, verifying user ownership.
 */
export async function getUserChatMessagesHistory(
    userId: string,
    sessionId: string
): Promise<ChatMessagesHistoryResponse> {
    const validUserId = validateUUID(userId, "User ID");
    const validSessionId = validateUUID(sessionId, "Session ID");

    // 1. Fetch the session enforcing user ownership
    const [session] = await db
        .select({
            id: agentSessions.id,
            title: agentSessions.title,
            createdAt: agentSessions.createdAt,
            updatedAt: agentSessions.updatedAt,
        })
        .from(agentSessions)
        .where(
            and(
                eq(agentSessions.id, validSessionId),
                eq(agentSessions.userId, validUserId)
            )
        );

    if (!session) {
        throw ApiError.notFound(
            `Chat session with ID '${validSessionId}' was not found for this user.`
        );
    }

    // 2. Fetch conversation events for this session in chronological order
    const events = await db
        .select({
            id: agentEvents.id,
            sessionId: agentEvents.sessionId,
            runId: agentEvents.runId,
            eventType: agentEvents.eventType,
            inputData: agentEvents.inputData,
            outputData: agentEvents.outputData,
            createdAt: agentEvents.createdAt,
        })
        .from(agentEvents)
        .where(
            and(
                eq(agentEvents.sessionId, validSessionId),
                inArray(agentEvents.eventType, ["run_started", "run_completed", "run_failed"])
            )
        )
        .orderBy(asc(agentEvents.createdAt));

    return {
        sessionId: session.id,
        title: session.title,
        createdAt: session.createdAt,
        messages: extractConversationMessages(events),
    };
}
