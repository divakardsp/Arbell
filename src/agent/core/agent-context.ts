import type { AgentRunContext } from "../buyer/buyer.types";

export type { AgentRunContext };

export function createAgentRunContext(
    userId: string,
    sessionId: string,
    runId?: string
): AgentRunContext {
    return {
        userId,
        sessionId,
        runId: runId || crypto.randomUUID(),
    };
}
