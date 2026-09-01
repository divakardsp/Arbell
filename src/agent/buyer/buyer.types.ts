import { AgentEvent } from "../core/events/agent-events";

export interface AgentRunContext {
    userId: string;
    sessionId: string;
    runId: string;
}

export interface AgentRequest {
    message: string;
    context: AgentRunContext;
}

export interface RunAgentOptions {
    onEvent?: (event: AgentEvent) => void;
}

export interface AgentResponse {
    sessionId: string;
    runId: string;
    response: string;
    toolCallsCount: number;
}

