import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { searchProductsTool } from "./tools/product/search-product";
import { getProductTool } from "./tools/product/get-product";
import { getCategoriesTool } from "./tools/product/get-categories";
import { compareProductsTool } from "./tools/product/compare-products";
import { getMerchantTool } from "./tools/merchant/get-merchant";
import { getOrderTool } from "./tools/order/get-order";
import { getUserOrdersTool } from "./tools/order/get-user-orders";

const server = new McpServer({
    name: "arbell-mcp-server",
    version: "1.0.0",
});

const tools = [
    searchProductsTool,
    getProductTool,
    getCategoriesTool,
    compareProductsTool,
    getMerchantTool,
    getOrderTool,
    getUserOrdersTool,
];

for (const tool of tools) {
    server.registerTool(
        tool.name,
        {
            description: tool.description,
            inputSchema: tool.inputSchema,
        },
        tool.handler
    );
}

async function main() {
    const transport = new StdioServerTransport();

    await server.connect(transport);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});