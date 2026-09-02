import type { AgentEvent } from "@/agent/core/events/agent-events";

export interface SendChatMessageOptions {
    message: string;
    sessionId?: string | null;
    signal?: AbortSignal;
    onEvent: (event: AgentEvent) => void;
}

/**
 * Parses a single SSE block (separated by \n\n or \r\n\r\n) into a strongly-typed AgentEvent.
 */
function parseSseBlock(block: string): AgentEvent | null {
    const lines = block.split(/\r?\n/);
    let eventType = "";
    let dataStr = "";

    for (const line of lines) {
        if (line.startsWith("event:")) {
            eventType = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
            const dataPart = line.slice(5).trim();
            dataStr = dataStr ? `${dataStr}\n${dataPart}` : dataPart;
        }
    }

    if (!dataStr) return null;

    try {
        const parsed = JSON.parse(dataStr);
        // If type is not explicitly on payload, use the SSE event header if available
        if (!parsed.type && eventType) {
            parsed.type = eventType;
        }
        return parsed as AgentEvent;
    } catch (err) {
        console.warn("[sse-chat-client] Failed to parse SSE JSON payload:", dataStr, err);
        return null;
    }
}

/**
 * Initiates an authenticated streaming request to `/api/chat` and processes incoming SSE events.
 * Handles partial chunks, multi-event frames, network boundaries, and error scenarios.
 */
export async function sendChatMessage({
    message,
    sessionId,
    signal,
    onEvent,
}: SendChatMessageOptions): Promise<void> {
    const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
        },
        body: JSON.stringify({
            message: message.trim(),
            sessionId: sessionId || undefined,
        }),
        signal,
    });

    if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
            const errJson = await response.json();
            errorMessage =
                errJson?.error?.message ||
                errJson?.message ||
                errorMessage;
        } catch {
            // Non-JSON error body fallback
        }
        throw new Error(errorMessage);
    }

    if (!response.body) {
        throw new Error("No readable response body received from chat stream.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Split on double newlines to process full SSE message blocks
            const blocks = buffer.split(/\r?\n\r?\n/);
            // Retain any incomplete chunk at the end of the buffer
            buffer = blocks.pop() ?? "";

            for (const block of blocks) {
                if (!block.trim()) continue;
                const event = parseSseBlock(block);
                if (event) {
                    onEvent(event);
                }
            }
        }

        // Process any remaining bytes left in the buffer after stream ends
        if (buffer.trim()) {
            const event = parseSseBlock(buffer);
            if (event) {
                onEvent(event);
            }
        }
    } finally {
        reader.releaseLock();
    }
}
