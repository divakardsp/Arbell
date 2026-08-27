import { NextRequest } from "next/server";
import { buyerAgent, AgentRunContext } from "@/agent";
import { createAgentSession, getAgentSessionForUser } from "@/services/agent-log-service";
import { ApiResponse } from "@/utils/ApiResponse";
import { ApiError } from "@/utils/ApiError";
import { handleApiError } from "@/utils/errorHandler";
import { validateUUID } from "@/utils/validators";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body || typeof body !== "object") {
            throw ApiError.badRequest("Request body must be a valid JSON object.");
        }

        const { userId, sessionId, message } = body;

        // 1. Validate userId
        const validUserId = validateUUID(userId, "User ID");

        // 2. Validate message
        if (!message || typeof message !== "string" || message.trim() === "") {
            throw ApiError.badRequest("Message is required and must be a non-empty string.");
        }

        const trimmedMessage = message.trim();

        // 3. Handle Session
        let activeSessionId: string;

        if (!sessionId || String(sessionId).trim() === "") {
            // Case A: Create a new session for this user
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

        // 4. Generate unique runId for this turn
        const runId = crypto.randomUUID();

        const context: AgentRunContext = {
            userId: validUserId,
            sessionId: activeSessionId,
            runId,
        };

        // 5. Execute AI Buyer Agent
        const result = await buyerAgent.run({
            message: trimmedMessage,
            context,
        });

        return ApiResponse.success(
            {
                sessionId: activeSessionId,
                runId,
                response: result.response,
            },
            "Agent response generated successfully"
        );
    } catch (error) {
        return handleApiError(error);
    }
}
