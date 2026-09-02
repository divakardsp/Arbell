import { NextRequest } from "next/server";
import { getUserChatHistory, getUserChatMessagesHistory } from "@/services/chat-service";
import { handleApiError } from "@/utils/errorHandler";
import { ApiResponse } from "@/utils/ApiResponse";
import { requireCurrentUser } from "@/utils/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const currentUser = await requireCurrentUser();
        const searchParams = request.nextUrl.searchParams;
        const sessionIdParam = searchParams.get("sessionId");

        if (sessionIdParam) {
            const sessionHistory = await getUserChatMessagesHistory(
                currentUser.id,
                sessionIdParam
            );
            return ApiResponse.success(
                { chat: [sessionHistory] },
                "Chat session history retrieved successfully",
                200
            );
        }

        const chatHistory = await getUserChatHistory(currentUser.id);

        return ApiResponse.success(
            chatHistory,
            "User chat history retrieved successfully",
            200
        );
    } catch (error) {
        return handleApiError(error);
    }
}