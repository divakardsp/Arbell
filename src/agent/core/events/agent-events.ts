/**
 * Strongly typed Agent Event definitions for runtime lifecycle & streaming.
 * These events decouple the agent execution runner from transport mechanisms (SSE, A2UI, WebSockets, etc.).
 */

export interface RunStartedEvent {
    type: "run_started";
    runId: string;
    sessionId?: string;
}

export interface StatusEvent {
    type: "status";
    runId: string;
    message: string;
}

export interface ToolStartedEvent {
    type: "tool_started";
    runId: string;
    toolName: string;
    message: string;
    args?: Record<string, unknown>;
}

export interface ToolCompletedEvent {
    type: "tool_completed";
    runId: string;
    toolName: string;
}

export interface ProductItemData {
    id: string;
    productName: string;
    description: string | null;
    category?: string;
    price: string | number;
    currency?: string;
    attributes?: Record<string, string | number | boolean | unknown>;
    availableStock?: number;
    brand?: string;
    rating?: number;
    image?: string;
    merchant?: {
        id: string;
        name: string | null;
    };
}

export interface UIProductGridEvent {
    type: "ui";
    runId: string;
    uiType: "product_grid";
    products: ProductItemData[];
}

export interface TextDeltaEvent {
    type: "text_delta";
    runId: string;
    delta: string;
}

export interface RunCompletedEvent {
    type: "run_completed";
    runId: string;
    response?: string;
    totalToolCalls?: number;
}

export interface ErrorEvent {
    type: "error";
    runId: string;
    message: string;
}

export type AgentEvent =
    | RunStartedEvent
    | StatusEvent
    | ToolStartedEvent
    | ToolCompletedEvent
    | TextDeltaEvent
    | UIProductGridEvent
    | RunCompletedEvent
    | ErrorEvent;

export type AgentEventCallback = (event: AgentEvent) => void;
