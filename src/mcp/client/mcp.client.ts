import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
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
    private transport: StreamableHTTPClientTransport | null = null;
    private isConnected = false;

    constructor(
        private readonly serverUrl: string = process.env.MCP_SERVER_URL || "http://localhost:3000/api/mcp",
        private readonly authToken: string = process.env.MCP_AUTH_TOKEN || ""
    ) {
        this.client = new Client({
            name: "arbell-ai-buyer-client",
            version: "1.0.0",
        });
    }

    /**
     * Connects to the Arbell MCP server via Streamable HTTP transport.
     */
    async connect(): Promise<void> {
        if (this.isConnected) return;

        const endpoint = this.serverUrl;
        const token = this.authToken || process.env.MCP_AUTH_TOKEN;

        if (!endpoint || endpoint.trim() === "") {
            throw new McpClientError("MCP_SERVER_URL is not configured.");
        }

        if (!token || token.trim() === "") {
            throw new McpClientError("MCP_AUTH_TOKEN is not configured.");
        }

        let parsedUrl: URL;
        try {
            parsedUrl = new URL(endpoint);
        } catch (urlErr) {
            throw new McpClientError(`Invalid MCP_SERVER_URL '${endpoint}'`, urlErr);
        }

        try {
            this.transport = new StreamableHTTPClientTransport(parsedUrl, {
                requestInit: {
                    headers: {
                        Authorization: `Bearer ${token.trim()}`,
                    },
                },
            });

            await this.client.connect(this.transport);
            this.isConnected = true;
        } catch (error) {
            throw new McpClientError("Failed to connect to Arbell MCP Server via Streamable HTTP", error);
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
     * Closes the MCP connection and cleans up transport resources.
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

