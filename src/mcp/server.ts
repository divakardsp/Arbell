import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { searchProductsTool } from "./tools/product/search-product";

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

async function main() {
    const transport = new StdioServerTransport();

    await server.connect(transport);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});