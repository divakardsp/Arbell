import { AgentEvent } from "../../core/events/agent-events";
import { formatAgentEventToSse } from "./sse-event-formatter";

export interface CreateSseStreamResult {
    stream: ReadableStream<Uint8Array>;
    sendEvent: (event: AgentEvent) => void;
    close: () => void;
}

/**
 * Creates a standard WHATWG ReadableStream configured for Server-Sent Events.
 * Returns safe sendEvent and close helper methods.
 */
export function createSseStream(): CreateSseStreamResult {
    let controllerRef: ReadableStreamDefaultController<Uint8Array> | null = null;
    let isClosed = false;
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
        start(controller) { //starts run when the strea is created
            controllerRef = controller;
        },
        cancel() {  //cancel runs when the stream is closed from the client end
            isClosed = true;
            controllerRef = null;
        },
    });

    const sendEvent = (event: AgentEvent) => {
        if (isClosed || !controllerRef) return;
        try {
            const formatted = formatAgentEventToSse(event);
            controllerRef.enqueue(encoder.encode(formatted));
        } catch (err) {
            console.error("Error enqueueing SSE event:", err);
        }
    };

    const close = () => {
        if (isClosed) return;
        isClosed = true;
        if (controllerRef) {
            try {
                controllerRef.close();
            } catch (err) {
                // Controller already closed
            }
            controllerRef = null;
        }
    };

    return {
        stream,
        sendEvent,
        close,
    };
}
