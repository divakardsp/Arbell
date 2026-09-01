import { AgentEvent } from "../../core/events/agent-events";

/**
 * Formats a typed AgentEvent into the SSE wire format string:
 * 
 * event: <eventType>
 * data: <JSON string>
 * \n\n
 */
export function formatAgentEventToSse(event: AgentEvent): string {
    const eventType = event.type;
    const jsonPayload = JSON.stringify(event);
    return `event: ${eventType}\ndata: ${jsonPayload}\n\n`;
}
