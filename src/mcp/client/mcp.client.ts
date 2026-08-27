import path from "path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { McpClientError } from "@/agent/core/agent-errors";

export interface McpTool {
    name: string;
    description?: string;
    inputSchema: {
        type?: string;
        properties?: Record<string, unknown>;
        required?: string[];
        [key: string]: unknown;
    };
}

export interface McpToolResult {
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
}

export class McpClient {
    private client: Client;
    private transport: StdioClientTransport | null = null;
    private isConnected = false;

    constructor(
        private readonly serverPath: string = path.resolve(process.cwd(), "src/mcp/server.ts")
    ) {
        this.client = new Client({
            name: "arbell-ai-buyer-client",
            version: "1.0.0",
        });
    }

    /**
     * Connects to the Arbell MCP server via Stdio transport.
     */
    async connect(): Promise<void> {
        if (this.isConnected) return;

        try {
            this.transport = new StdioClientTransport({
                command: "bun",
                args: ["run", this.serverPath],
            });

            await this.client.connect(this.transport);
            this.isConnected = true;
        } catch (error) {
            throw new McpClientError("Failed to connect to Arbell MCP Server", error);
        }
    }

    /**
     * Discovers all available tools registered with the MCP server.
     */
    async listTools(): Promise<McpTool[]> {
        if (!this.isConnected) {
            await this.connect();
        }

        try {
            const result = await this.client.listTools();
            return (result.tools as unknown as McpTool[]) || [];
        } catch (error) {
            throw new McpClientError("Failed to list MCP tools", error);
        }
    }

    /**
     * Calls a specific MCP tool with arguments.
     */
    async callTool(name: string, args: Record<string, unknown> = {}): Promise<McpToolResult> {
        if (!this.isConnected) {
            await this.connect();
        }

        try {
            const result = await this.client.callTool({
                name,
                arguments: args,
            });

            return result as unknown as McpToolResult;
        } catch (error) {
            throw new McpClientError(`Failed to execute MCP tool '${name}'`, error);
        }
    }

    /**
     * Closes the MCP connection and cleans up transport child processes.
     */
    async close(): Promise<void> {
        if (!this.isConnected) return;

        try {
            await this.client.close();
        } catch {
            // Ignore close errors during cleanup
        } finally {
            this.isConnected = false;
            this.transport = null;
        }
    }
}
