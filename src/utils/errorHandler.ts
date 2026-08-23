import { NextResponse } from "next/server";
import { ApiError } from "./ApiError";

export function handleApiError(error: unknown) {
    if (error instanceof ApiError) {
        return NextResponse.json(
            {
                success: false,
                statusCode: error.statusCode,
                message: error.message,
            },
            { status: error.statusCode }
        );
    }

    console.error("Unhandled API Error:", error);

    const errorMessage =
        error instanceof Error ? error.message : "Internal Server Error";

    return NextResponse.json(
        {
            success: false,
            statusCode: 500,
            message: errorMessage,
        },
        { status: 500 }
    );
}
