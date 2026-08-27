export class AgentError extends Error {
    constructor(message: string, public readonly originalError?: unknown) {
        super(message);
        this.name = "AgentError";
    }
}

export class McpClientError extends AgentError {
    constructor(message: string, originalError?: unknown) {
        super(message, originalError);
        this.name = "McpClientError";
    }
}

export class MaxIterationsReachedError extends AgentError {
    constructor(maxIterations: number) {
        super(`Agent reached maximum iteration limit of ${maxIterations} without completion.`);
        this.name = "MaxIterationsReachedError";
    }
}
