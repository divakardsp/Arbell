import { runAgent } from "../core/agent-runner";
import { AgentRequest, AgentResponse, RunAgentOptions } from "./buyer.types";
import { BuyerAgentConfig, buyerConfig as defaultBuyerConfig } from "./buyer.config";

/**
 * Public Buyer Agent interface.
 * Decouples agent orchestration and execution from HTTP routes.
 */
export class BuyerAgent {
    constructor(private readonly config: BuyerAgentConfig = defaultBuyerConfig) {}

    /**
     * Executes the buyer agent loop for a given user request and execution context.
     */
    async run(
        request: AgentRequest,
        options?: RunAgentOptions
    ): Promise<AgentResponse> {
        return runAgent(request, this.config, options);
    }
}

export const buyerAgent = new BuyerAgent();

