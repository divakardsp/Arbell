import { NextRequest, NextResponse } from "next/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createMcpServer } from "@/mcp/server";
import { handleApiError } from "@/utils/errorHandler";
import { ApiError } from "@/utils/ApiError";

/**
 * Validates the Authorization header against MCP_AUTH_TOKEN.
 * Throws 401 ApiError if authentication fails.
 */
function authenticateMcpRequest(request: NextRequest): void {
    const expectedToken = process.env.MCP_AUTH_TOKEN;

    if (!expectedToken || expectedToken.trim() === "") {
        throw ApiError.internal("MCP_AUTH_TOKEN environment variable is not configured on the server.");
    }

    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw ApiError.unauthorized("Missing or malformed Authorization header. Expected 'Bearer <token>'.");
    }

    const token = authHeader.slice(7).trim();

    if (token !== expectedToken) {
        throw ApiError.unauthorized("Invalid MCP authorization token.");
    }
}

/**
 * Handles MCP Streamable HTTP requests (POST for JSON-RPC messages, GET for SSE streams, DELETE for session closure).
 */
async function handleMcpProtocol(request: NextRequest): Promise<Response> {
    try {
        // 1. Authenticate request using Bearer MCP_AUTH_TOKEN
        authenticateMcpRequest(request);

        // 2. Initialize MCP server and stateless Web Standard Streamable HTTP transport
        const server = createMcpServer();
        const transport = new WebStandardStreamableHTTPServerTransport({
            sessionIdGenerator: undefined, // Stateless mode for serverless compatibility
        });

        // 3. Connect server to transport
        await server.connect(transport);

        // 4. Delegate protocol handling to MCP transport
        return await transport.handleRequest(request);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function POST(request: NextRequest) {

    return handleMcpProtocol(request);
}

export async function GET(request: NextRequest) {

    return handleMcpProtocol(request);
}

export async function DELETE(request: NextRequest) {
  
    return handleMcpProtocol(request);
}
