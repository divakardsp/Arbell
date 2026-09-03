import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { searchProductsTool } from "./tools/product/search-product";
import { getProductTool } from "./tools/product/get-product";
import { getCategoriesTool } from "./tools/product/get-categories";
import { compareProductsTool } from "./tools/product/compare-products";
import { getMerchantTool } from "./tools/merchant/get-merchant";
import { getOrderTool } from "./tools/order/get-order";
import { getUserOrdersTool } from "./tools/order/get-user-orders";

export const mcpTools = [
    searchProductsTool,
    getProductTool,
    getCategoriesTool,
    compareProductsTool,
    getMerchantTool,
    getOrderTool,
    getUserOrdersTool,
];

/**
 * Creates and configures the Arbell MCP Server instance with all tools registered.
 */
export function createMcpServer(): McpServer {
    const server = new McpServer({
        name: "arbell-mcp-server",
        version: "1.0.0",
    });

    for (const tool of mcpTools) {
        server.registerTool(
            tool.name,
            {
                description: tool.description,
                inputSchema: tool.inputSchema,
            },
            tool.handler
        );
    }

    return server;
}