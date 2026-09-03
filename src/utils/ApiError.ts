export class ApiError extends Error {
    statusCode: number;
    code?: string;
    details?: Record<string, unknown>;
    isOperational: boolean;

    constructor(
        statusCode: number,
        message: string,
        code?: string,
        details?: Record<string, unknown>
    ) {
        super(message);

        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message = "Bad request", code?: string, details?: Record<string, unknown>) {
        return new ApiError(400, message, code, details);
    }

    static unauthorized(message = "Unauthorized", code?: string) {
        return new ApiError(401, message, code);
    }

    static forbidden(message = "Forbidden", code?: string) {
        return new ApiError(403, message, code);
    }

    static notFound(message = "Not found", code?: string) {
        return new ApiError(404, message, code);
    }

    static conflict(message = "Conflict", code?: string) {
        return new ApiError(409, message, code);
    }

    static internal(message = "Internal server error", code?: string) {
        return new ApiError(500, message, code);
    }
}

export default ApiError;