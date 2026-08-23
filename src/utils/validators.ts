import { ApiError } from "./ApiError";

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates whether a given string is a valid UUID format.
 * Throws a 400 Bad Request ApiError if invalid or missing.
 *
 * @param id - The ID string to validate
 * @param fieldName - Custom label for the ID field in error messages (default: "ID")
 * @returns The trimmed valid UUID string
 */
export function validateUUID(id: string, fieldName = "ID"): string {
    if (!id || typeof id !== "string" || id.trim() === "") {
        throw ApiError.badRequest(`${fieldName} is required and must be a non-empty string.`);
    }

    const trimmedId = id.trim();
    if (!UUID_REGEX.test(trimmedId)) {
        throw ApiError.badRequest(
            `Invalid ${fieldName} format: '${id}'. Expected a valid UUID (e.g. 123e4567-e89b-12d3-a456-426614174000).`
        );
    }

    return trimmedId;
}

export interface PaginationParams {
    page: number;
    limit: number;
    offset: number;
}

/**
 * Parses and validates page and limit query parameters.
 * Defaults: page = 1, limit = 10. Max limit: 100.
 */
export function parsePaginationParams(
    rawPage?: string | null,
    rawLimit?: string | null,
    defaultLimit = 10,
    maxLimit = 100
): PaginationParams {
    let page = 1;
    let limit = defaultLimit;

    if (rawPage !== undefined && rawPage !== null && rawPage.trim() !== "") {
        const parsedPage = Number(rawPage);
        if (!Number.isInteger(parsedPage) || parsedPage < 1) {
            throw ApiError.badRequest("Page parameter must be a positive integer greater than or equal to 1.");
        }
        page = parsedPage;
    }

    if (rawLimit !== undefined && rawLimit !== null && rawLimit.trim() !== "") {
        const parsedLimit = Number(rawLimit);
        if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
            throw ApiError.badRequest("Limit parameter must be a positive integer greater than or equal to 1.");
        }
        if (parsedLimit > maxLimit) {
            throw ApiError.badRequest(`Limit parameter cannot exceed maximum of ${maxLimit}.`);
        }
        limit = parsedLimit;
    }

    const offset = (page - 1) * limit;

    return { page, limit, offset };
}
