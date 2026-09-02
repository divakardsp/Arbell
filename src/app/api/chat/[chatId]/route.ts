import { NextRequest } from "next/server";
import { getUserChatMessagesHistory } from "@/services/chat-service";
import { handleApiError } from "@/utils/errorHandler";
import { ApiResponse } from "@/utils/ApiResponse";
import { requireCurrentUser } from "@/utils/auth";

export const dynamic = "force-dynamic";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ chatId: string }> }
) {
    try {
        const currentUser = await requireCurrentUser();
        const { chatId } = await params;

        const sessionHistory = await getUserChatMessagesHistory(
            currentUser.id,
            chatId
        );

        return ApiResponse.success(
            sessionHistory,
            "Chat session messages retrieved successfully",
            200
        );
    } catch (error) {
        return handleApiError(error);
    }
}