import { NextResponse } from "next/server";

export class ApiResponse<T = unknown> {
    public readonly statusCode: number;
    public readonly success: boolean;
    public readonly message: string;
    public readonly data: T;

    constructor(
        statusCode: number,
        data: T,
        message: string = "Success",
    ) {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode >= 200 && statusCode < 400;
    }

    static success<T>(
        data: T,
        message: string = "Success",
        statusCode: number = 200,
    ) {
        const response = new ApiResponse(
            statusCode,
            data,
            message,
        );

        return NextResponse.json(
            {
                success: response.success,
                message: response.message,
                data: response.data,
            },
            {
                status: response.statusCode,
            },
        );
    }
}

export default ApiResponse;