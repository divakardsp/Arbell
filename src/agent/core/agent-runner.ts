import type { ResponseFunctionToolCall } from "openai/resources/responses/responses";
import { openai } from "@/lib/openai";
import { McpClient } from "@/mcp/client/mcp.client";
import { adaptMcpToolsToOpenAI } from "@/mcp/client/mcp.tool-adapter";
import { createAgentEvent } from "@/services/agent-log-service";
import { BUYER_AGENT_SYSTEM_PROMPT } from "../prompts/buyer-agent.prompt";
import { AgentRequest, AgentResponse, RunAgentOptions } from "../buyer/buyer.types";
import { BuyerAgentConfig, buyerConfig as defaultBuyerConfig } from "../buyer/buyer.config";
import { MaxIterationsReachedError } from "./agent-errors";
import { AgentEvent } from "./events/agent-events";
import { getToolDisplayMessage } from "./events/tool-event-message";
import { checkDomainGuardrail, GUARDRAIL_REJECTION_MESSAGE } from "../guardrail/domain-guardrail";

/**
 * Core agent execution runner using OpenAI's Responses API with streaming.
 * Emits generic application lifecycle events (run_started, status, tool_started, text_delta, tool_completed, run_completed, error)
 * and maintains database persistence through agent_events.
 */
export async function runAgent(
    request: AgentRequest,
    config: BuyerAgentConfig = defaultBuyerConfig,
    options?: RunAgentOptions
): Promise<AgentResponse> {
    const { userId, sessionId, runId } = request.context;
    const emit = options?.onEvent ?? (() => {});
    const mcpClient = new McpClient();
    let totalToolCalls = 0;

    // 1. Emit & Record run_started event
    emit({
        type: "run_started",
        runId,
        sessionId,
    });

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

    // 2. Execute Domain Guardrail check BEFORE connecting to MCP or entering agent loop
    const guardrailDecision = await checkDomainGuardrail(request.message, config.model);

    if (!guardrailDecision.allowed) {
        console.warn(`[runAgent] Request rejected by domain guardrail:`, {
            runId,
            sessionId,
            message: request.message,
            reason: guardrailDecision.reason,
        });

        // Emit error event to client via SSE
        emit({
            type: "error",
            runId,
            message: GUARDRAIL_REJECTION_MESSAGE,
        });

        // Record run_failed audit event in database
        await createAgentEvent({
            sessionId,
            runId,
            eventType: "run_failed",
            status: "failed",
            outputData: {
                error: GUARDRAIL_REJECTION_MESSAGE,
                guardrailReason: guardrailDecision.reason,
            },
        });

        // Terminate execution safely without proceeding to MCP tools or main agent loop
        return {
            sessionId,
            runId,
            response: GUARDRAIL_REJECTION_MESSAGE,
            toolCallsCount: 0,
        };
    }

    try {
        // 3. Discover MCP tools and adapt for OpenAI Responses API
        emit({
            type: "status",
            runId,
            message: "Preparing tools...",
        });

        await mcpClient.connect();
        const mcpTools = await mcpClient.listTools();
        const openAITools = adaptMcpToolsToOpenAI(mcpTools);

        let previousResponseId: string | undefined = undefined;
        let nextInput: any = request.message;
        let completeResponseText = "";

        // 3. Iterative LLM Tool Calling Loop with Streaming
        let iterations = 0;
        while (iterations < config.maxIterations) {
            iterations++;

            const stream = await openai.responses.create({
                model: config.model,
                instructions: previousResponseId ? undefined : BUYER_AGENT_SYSTEM_PROMPT,
                input: nextInput,
                previous_response_id: previousResponseId,
                tools: openAITools.length > 0 ? openAITools : undefined,
                temperature: config.temperature,
                stream: true,
            });

            let currentResponseId = "";
            let iterationOutputText = "";
            const functionCallsMap = new Map<
                string,
                { callId: string; name: string; arguments: string }
            >();

            // Consume OpenAI Response Stream Events
            for await (const event of stream) {
                // Track response ID from any event that provides it
                if ((event as any).response?.id) {
                    currentResponseId = (event as any).response.id;
                }

                // A. Streamed Text Delta
                if (event.type === "response.output_text.delta") {
                    const delta = event.delta || "";
                    iterationOutputText += delta;
                    completeResponseText += delta;

                    emit({
                        type: "text_delta",
                        runId,
                        delta,
                    });
                }

                // B. Streamed Function Call Start
                if (event.type === "response.output_item.added") {
                    const item = event.item;
                    if (item && item.type === "function_call") {
                        functionCallsMap.set(item.call_id, {
                            callId: item.call_id,
                            name: item.name,
                            arguments: item.arguments || "",
                        });
                    }
                }

                // C. Streamed Function Call Arguments Delta
                if (event.type === "response.function_call_arguments.delta") {
                    const anyEvt = event as any;
                    const callId = anyEvt.call_id || anyEvt.item_id;
                    const delta = anyEvt.delta || "";
                    if (callId && functionCallsMap.has(callId)) {
                        const existing = functionCallsMap.get(callId)!;
                        existing.arguments += delta;
                    } else if (functionCallsMap.size > 0) {
                        // Append to the active/last function call
                        const keys = Array.from(functionCallsMap.keys());
                        const lastKey = keys[keys.length - 1];
                        const existing = functionCallsMap.get(lastKey)!;
                        existing.arguments += delta;
                    }
                }

                // D. Response Output Item Done (final item state from OpenAI)
                if (event.type === "response.output_item.done") {
                    const item = event.item;
                    if (item && item.type === "function_call") {
                        functionCallsMap.set(item.call_id, {
                            callId: item.call_id,
                            name: item.name,
                            arguments: item.arguments || "",
                        });
                    }
                }

                // E. Response Completed
                if (event.type === "response.completed") {
                    if (event.response?.id) {
                        currentResponseId = event.response.id;
                    }
                }
            }

            previousResponseId = currentResponseId || previousResponseId;
            const collectedFunctionCalls = Array.from(functionCallsMap.values());

            // 4. Handle Function / Tool Calls if present
            if (collectedFunctionCalls.length > 0) {
                const toolOutputs: Array<{
                    type: "function_call_output";
                    call_id: string;
                    output: string;
                }> = [];

                for (const toolCall of collectedFunctionCalls) {
                    totalToolCalls++;
                    const toolName = toolCall.name;
                    let toolArgs: Record<string, unknown> = {};

                    try {
                        toolArgs = JSON.parse(toolCall.arguments || "{}");
                    } catch {
                        toolArgs = { raw: toolCall.arguments };
                    }

                    // Emit tool_started event to frontend
                    emit({
                        type: "tool_started",
                        runId,
                        toolName,
                        message: getToolDisplayMessage(toolName),
                        args: toolArgs,
                    });

                    // Record tool_called event in DB
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

                    // Emit tool_completed event to frontend
                    emit({
                        type: "tool_completed",
                        runId,
                        toolName,
                    });

                    // Record tool_completed event in DB
                    await createAgentEvent({
                        sessionId,
                        runId,
                        eventType: "tool_completed",
                        status: "completed",
                        toolName,
                        outputData: parsedOutputData,
                    });

                    // Collect tool output for next OpenAI iteration
                    toolOutputs.push({
                        type: "function_call_output",
                        call_id: toolCall.callId,
                        output: toolOutputText,
                    });
                }

                // Prepare next input for subsequent iteration
                nextInput = toolOutputs;
            } else {
                // No further tool calls — final response completed
                const finalText =
                    completeResponseText ||
                    iterationOutputText ||
                    "I have completed processing your request.";

                // Emit run_completed event
                emit({
                    type: "run_completed",
                    runId,
                    response: finalText,
                    totalToolCalls,
                });

                // Record run_completed in DB
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
        const safeErrorMessage =
            error.message || "Agent execution encountered an unexpected error.";

        // Emit error event
        emit({
            type: "error",
            runId,
            message: safeErrorMessage,
        });

        // Record run_failed event in DB
        await createAgentEvent({
            sessionId,
            runId,
            eventType: "run_failed",
            status: "failed",
            outputData: {
                error: safeErrorMessage,
            },
        });

        throw error;
    } finally {
        await mcpClient.close();
    }
}


