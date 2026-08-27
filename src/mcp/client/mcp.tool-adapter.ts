import type { FunctionTool } from "openai/resources/responses/responses";
import type { McpTool } from "./mcp.client";

/**
 * Converts an individual MCP Tool definition into OpenAI's Responses API function tool format.
 */
export function adaptMcpToolToOpenAI(tool: McpTool): FunctionTool {
    const rawSchema = tool.inputSchema || {};

    const parameters: Record<string, unknown> = {
        type: "object",
        properties: rawSchema.properties || {},
        additionalProperties: false,
    };

    if (Array.isArray(rawSchema.required) && rawSchema.required.length > 0) {
        parameters.required = rawSchema.required;
    }

    return {
        type: "function",
        name: tool.name,
        description: tool.description || "",
        parameters,
        strict: false,
    };
}

/**
 * Converts a list of MCP Tools into an array of OpenAI Responses API function tools.
 */
export function adaptMcpToolsToOpenAI(tools: McpTool[]): FunctionTool[] {
    return tools.map(adaptMcpToolToOpenAI);
}

