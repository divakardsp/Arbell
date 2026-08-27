import type { ResponseFunctionToolCall } from "openai/resources/responses/responses";
import { openai } from "@/lib/openai";
import { McpClient } from "@/mcp/client/mcp.client";
import { adaptMcpToolsToOpenAI } from "@/mcp/client/mcp.tool-adapter";
import { createAgentEvent } from "@/services/agent-log-service";
import { BUYER_AGENT_SYSTEM_PROMPT } from "../prompts/buyer-agent.prompt";
import { AgentRequest, AgentResponse } from "../buyer/buyer.types";
import { BuyerAgentConfig, buyerConfig as defaultBuyerConfig } from "../buyer/buyer.config";
import { MaxIterationsReachedError } from "./agent-errors";

/**
 * Core agent execution runner using OpenAI's Responses API.
 * Handles the full lifecycle: run_started -> tool loop (via previous_response_id) -> run_completed / run_failed.
 */
export async function runAgent(
    request: AgentRequest,
    config: BuyerAgentConfig = defaultBuyerConfig
): Promise<AgentResponse> {
    const { userId, sessionId, runId } = request.context;
    const mcpClient = new McpClient();
    let totalToolCalls = 0;

    // 1. Record run_started event
    await createAgentEvent({
        sessionId,
        runId,
        eventType: "run_started",
        status: "running",
        inputData: {
            userId,
            message: request.message,
        },
    });

    try {
        // 2. Discover MCP tools and adapt for OpenAI Responses API
        await mcpClient.connect();
        const mcpTools = await mcpClient.listTools();
        const openAITools = adaptMcpToolsToOpenAI(mcpTools);

        // 3. Initial invocation with Responses API
        let response = await openai.responses.create({
            model: config.model,
            instructions: BUYER_AGENT_SYSTEM_PROMPT,
            input: request.message,
            tools: openAITools.length > 0 ? openAITools : undefined,
            temperature: config.temperature,
        });

        // 4. Iterative LLM Tool Calling Loop
        let iterations = 0;
        while (iterations < config.maxIterations) {
            iterations++;

            // Detect any function tool calls requested by the model
            const functionCalls = (response.output?.filter(
                (item): item is ResponseFunctionToolCall => item.type === "function_call"
            ) || []) as ResponseFunctionToolCall[];

            if (functionCalls.length > 0) {
                const toolOutputs: Array<{
                    type: "function_call_output";
                    call_id: string;
                    output: string;
                }> = [];

                for (const toolCall of functionCalls) {
                    totalToolCalls++;
                    const toolName = toolCall.name;
                    let toolArgs: Record<string, unknown> = {};

                    try {
                        toolArgs = JSON.parse(toolCall.arguments || "{}");
                    } catch {
                        toolArgs = { raw: toolCall.arguments };
                    }

                    // Record tool_called event
                    await createAgentEvent({
                        sessionId,
                        runId,
                        eventType: "tool_called",
                        status: "running",
                        toolName,
                        inputData: toolArgs,
                    });

                    // Execute tool via MCP
                    let toolOutputText: string;
                    let parsedOutputData: unknown;

                    try {
                        const toolResult = await mcpClient.callTool(toolName, toolArgs);
                        toolOutputText =
                            toolResult.content?.map((c) => c.text).join("\n") ||
                            JSON.stringify({ status: "success", content: [] });

                        try {
                            parsedOutputData = JSON.parse(toolOutputText);
                        } catch {
                            parsedOutputData = toolOutputText;
                        }
                    } catch (toolError: any) {
                        toolOutputText = JSON.stringify({
                            error: toolError.message || "Failed to execute tool",
                        });
                        parsedOutputData = { error: toolError.message };
                    }

                    // Record tool_completed event
                    await createAgentEvent({
                        sessionId,
                        runId,
                        eventType: "tool_completed",
                        status: "completed",
                        toolName,
                        outputData: parsedOutputData,
                    });

                    // Collect tool output for next turn
                    toolOutputs.push({
                        type: "function_call_output",
                        call_id: toolCall.call_id,
                        output: toolOutputText,
                    });
                }

                // Send tool results back to OpenAI using previous_response_id
                response = await openai.responses.create({
                    model: config.model,
                    previous_response_id: response.id,
                    input: toolOutputs as any,
                    tools: openAITools.length > 0 ? openAITools : undefined,
                    temperature: config.temperature,
                });
            } else {
                // Final answer produced
                const finalText =
                    response.output_text || "I have completed processing your request.";

                // Record run_completed event
                await createAgentEvent({
                    sessionId,
                    runId,
                    eventType: "run_completed",
                    status: "completed",
                    outputData: {
                        response: finalText,
                        totalToolCalls,
                        iterations,
                    },
                });

                return {
                    sessionId,
                    runId,
                    response: finalText,
                    toolCallsCount: totalToolCalls,
                };
            }
        }

        // Max iterations reached without completing
        throw new MaxIterationsReachedError(config.maxIterations);
    } catch (error: any) {
        // Record run_failed event
        await createAgentEvent({
            sessionId,
            runId,
            eventType: "run_failed",
            status: "failed",
            outputData: {
                error: error.message || "Agent execution encountered an error",
            },
        });

        throw error;
    } finally {
        await mcpClient.close();
    }
}

