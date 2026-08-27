export interface BuyerAgentConfig {
    model: string;
    maxIterations: number;
    temperature?: number;
}

export const buyerConfig: BuyerAgentConfig = {
    model: process.env.OPENAI_MODEL || "gpt-5",
    maxIterations: 8,
    temperature: 1,
};
