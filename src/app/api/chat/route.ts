import { NextRequest } from "next/server";
import { buyerAgent, AgentRunContext, createSseStream } from "@/agent";
import { createAgentSession, getAgentSessionForUser } from "@/services/agent-log-service";
import { handleApiError } from "@/utils/errorHandler";
import { validateUUID } from "@/utils/validators";
import { ApiError } from "@/utils/ApiError";
import { requireCurrentUser } from "@/utils/auth";

export async function POST(request: NextRequest) {
    try {
        const currentUser = await requireCurrentUser();
        const validUserId = currentUser.id;

        const body = await request.json();

        if (!body || typeof body !== "object") {
            throw ApiError.badRequest("Request body must be a valid JSON object.");
        }

        const { sessionId, message } = body;

        // 1. Validate message
        if (!message || typeof message !== "string" || message.trim() === "") {
            throw ApiError.badRequest("Message is required and must be a non-empty string.");
        }

        const trimmedMessage = message.trim();

        // 2. Handle Session
        let activeSessionId: string;

        if (!sessionId || String(sessionId).trim() === "") {
            // Case A: Create a new session for this authenticated user
            const newSession = await createAgentSession({
                userId: validUserId,
                title: trimmedMessage.slice(0, 100),
            });
            activeSessionId = newSession.id;
        } else {
            // Case B: Verify existing session ownership
            const validSessionId = validateUUID(String(sessionId), "Session ID");
            const existingSession = await getAgentSessionForUser({
                sessionId: validSessionId,
                userId: validUserId,
            });
            activeSessionId = existingSession.id;
        }

        // 3. Generate unique runId for this turn
        const runId = crypto.randomUUID();

        const context: AgentRunContext = {
            userId: validUserId,
            sessionId: activeSessionId,
            runId,
        };

        // 4. Create SSE Stream
        const { stream, sendEvent, close } = createSseStream();

        // 6. Execute AI Buyer Agent asynchronously inside the stream lifecycle
        (async () => {
            try {
                await buyerAgent.run(
                    {
                        message: trimmedMessage,
                        context,
                    },
                    {
                        onEvent: sendEvent,
                    }
                );
            } catch (execError: any) {
                console.error("Agent execution error in SSE stream:", execError);
                sendEvent({
                    type: "error",
                    runId,
                    message: execError.message || "Agent execution failed.",
                });
            } finally {
                close();
            }
        })();

        // 7. Return standard Server-Sent Events response
        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream; charset=utf-8",
                "Cache-Control": "no-cache, no-transform",
                Connection: "keep-alive",
            },
        });
    } catch (error) {
        return handleApiError(error);
    }
}

