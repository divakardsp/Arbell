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

    server.registerTool(
        searchProductsTool.name,
        {
            description: searchProductsTool.description,
            inputSchema: searchProductsTool.inputSchema,
        },
        searchProductsTool.handler
    );

    server.registerTool(
        getProductTool.name,
        {
            description: getProductTool.description,
            inputSchema: getProductTool.inputSchema,
        },
        getProductTool.handler
    );

    server.registerTool(
        getCategoriesTool.name,
        {
            description: getCategoriesTool.description,
            inputSchema: getCategoriesTool.inputSchema,
        },
        getCategoriesTool.handler
    );

    server.registerTool(
        compareProductsTool.name,
        {
            description: compareProductsTool.description,
            inputSchema: compareProductsTool.inputSchema,
        },
        compareProductsTool.handler
    );

    server.registerTool(
        getMerchantTool.name,
        {
            description: getMerchantTool.description,
            inputSchema: getMerchantTool.inputSchema,
        },
        getMerchantTool.handler
    );

    server.registerTool(
        getOrderTool.name,
        {
            description: getOrderTool.description,
            inputSchema: getOrderTool.inputSchema,
        },
        getOrderTool.handler
    );

    server.registerTool(
        getUserOrdersTool.name,
        {
            description: getUserOrdersTool.description,
            inputSchema: getUserOrdersTool.inputSchema,
        },
        getUserOrdersTool.handler
    );

    return server;
}