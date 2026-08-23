import { eq, and, gte, lte, gt, count, SQL } from "drizzle-orm";
import { db } from "@/lib";
import { merchants, products, categoryEnum } from "@/db/schema";
import { ApiError } from "@/utils/ApiError";
import { validateUUID, parsePaginationParams } from "@/utils/validators";

export interface MerchantSummary {
    id: string;
    name: string;
    description: string | null;
}

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface GetAllMerchantsResponse {
    merchants: MerchantSummary[];
    pagination: PaginationInfo;
}

export interface ProductSummary {
    id: string;
    productName: string;
    description: string | null;
    category: (typeof categoryEnum.enumValues)[number];
    price: string;
    currency: string;
    attributes: Record<string, string | number | boolean>;
    inventoryStock: number;
}

export interface MerchantProductsFilterParams {
    category?: string | null;
    minPrice?: string | number | null;
    maxPrice?: string | number | null;
    inStock?: string | boolean | null;
    page?: string | number | null;
    limit?: string | number | null;
}

export interface GetMerchantProductsResponse {
    merchant: {
        id: string;
        name: string;
    };
    products: ProductSummary[];
    pagination: PaginationInfo;
}

/**
 * Retrieves all merchants with pagination support (default limit: 10).
 * Metadata timestamps are omitted.
 */
export async function getAllMerchants(
    rawPage?: string | number | null,
    rawLimit?: string | number | null
): Promise<GetAllMerchantsResponse> {
    const pageStr = rawPage !== undefined && rawPage !== null ? String(rawPage) : undefined;
    const limitStr = rawLimit !== undefined && rawLimit !== null ? String(rawLimit) : undefined;

    const { page, limit, offset } = parsePaginationParams(pageStr, limitStr, 10);

    // Get total merchant count
    const [{ total }] = await db
        .select({ total: count() })
        .from(merchants);

    const totalCount = Number(total);

    // Get paginated merchants
    const merchantList = await db
        .select({
            id: merchants.id,
            name: merchants.name,
            description: merchants.description,
        })
        .from(merchants)
        .limit(limit)
        .offset(offset)
        .orderBy(merchants.name);

    return {
        merchants: merchantList,
        pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: totalCount > 0 ? Math.ceil(totalCount / limit) : 0,
        },
    };
}

/**
 * Retrieves merchant details by merchantId.
 * Strips metadata like timestamps.
 */
export async function getMerchantById(merchantId: string): Promise<MerchantSummary> {
    const validMerchantId = validateUUID(merchantId, "Merchant ID");

    const [merchant] = await db
        .select({
            id: merchants.id,
            name: merchants.name,
            description: merchants.description,
        })
        .from(merchants)
        .where(eq(merchants.id, validMerchantId));

    if (!merchant) {
        throw ApiError.notFound(`Merchant with ID '${validMerchantId}' was not found.`);
    }

    return merchant;
}

/**
 * Retrieves paginated products for a particular merchant with optional filters:
 * - category: Filter by category enum value
 * - minPrice / maxPrice: Filter by price range
 * - inStock: Filter by stock availability (true/false)
 * - page & limit: Pagination (default limit: 10)
 */
export async function getMerchantProducts(
    merchantId: string,
    filters: MerchantProductsFilterParams = {}
): Promise<GetMerchantProductsResponse> {
    const validMerchantId = validateUUID(merchantId, "Merchant ID");

    // 1. Verify merchant exists
    const [merchant] = await db
        .select({
            id: merchants.id,
            name: merchants.name,
        })
        .from(merchants)
        .where(eq(merchants.id, validMerchantId));

    if (!merchant) {
        throw ApiError.notFound(`Merchant with ID '${validMerchantId}' was not found.`);
    }

    // 2. Parse pagination
    const pageStr = filters.page !== undefined && filters.page !== null ? String(filters.page) : undefined;
    const limitStr = filters.limit !== undefined && filters.limit !== null ? String(filters.limit) : undefined;
    const { page, limit, offset } = parsePaginationParams(pageStr, limitStr, 10);

    // 3. Build dynamic filter conditions
    const conditions: SQL[] = [eq(products.merchantId, validMerchantId)];

    // Category Filter
    if (filters.category !== undefined && filters.category !== null && String(filters.category).trim() !== "") {
        const categoryQuery = String(filters.category).trim();
        const matchedCategory = categoryEnum.enumValues.find(
            (c) => c.toLowerCase() === categoryQuery.toLowerCase()
        );

        if (!matchedCategory) {
            throw ApiError.badRequest(
                `Invalid category '${categoryQuery}'. Valid categories are: ${categoryEnum.enumValues.join(", ")}`
            );
        }

        conditions.push(eq(products.category, matchedCategory));
    }

    // Min Price Filter
    let parsedMinPrice: number | undefined;
    if (filters.minPrice !== undefined && filters.minPrice !== null && String(filters.minPrice).trim() !== "") {
        const num = Number(filters.minPrice);
        if (isNaN(num) || num < 0) {
            throw ApiError.badRequest("minPrice must be a valid non-negative number.");
        }
        parsedMinPrice = num;
        conditions.push(gte(products.price, parsedMinPrice.toFixed(2)));
    }

    // Max Price Filter
    let parsedMaxPrice: number | undefined;
    if (filters.maxPrice !== undefined && filters.maxPrice !== null && String(filters.maxPrice).trim() !== "") {
        const num = Number(filters.maxPrice);
        if (isNaN(num) || num < 0) {
            throw ApiError.badRequest("maxPrice must be a valid non-negative number.");
        }
        parsedMaxPrice = num;
        conditions.push(lte(products.price, parsedMaxPrice.toFixed(2)));
    }

    // Price range validation
    if (parsedMinPrice !== undefined && parsedMaxPrice !== undefined && parsedMinPrice > parsedMaxPrice) {
        throw ApiError.badRequest(
            `minPrice (${parsedMinPrice}) cannot be greater than maxPrice (${parsedMaxPrice}).`
        );
    }

    // In Stock Filter
    if (filters.inStock !== undefined && filters.inStock !== null && String(filters.inStock).trim() !== "") {
        const inStockStr = String(filters.inStock).trim().toLowerCase();
        if (inStockStr === "true" || inStockStr === "1") {
            conditions.push(gt(products.inventoryStock, 0));
        } else if (inStockStr === "false" || inStockStr === "0") {
            conditions.push(lte(products.inventoryStock, 0));
        } else {
            throw ApiError.badRequest("inStock filter must be 'true' or 'false'.");
        }
    }

    // 4. Query total count of matching products
    const [{ total }] = await db
        .select({ total: count() })
        .from(products)
        .where(and(...conditions));

    const totalCount = Number(total);

    // 5. Query paginated products
    const productList = await db
        .select({
            id: products.id,
            productName: products.productName,
            description: products.description,
            category: products.category,
            price: products.price,
            currency: products.currency,
            attributes: products.attributes,
            inventoryStock: products.inventoryStock,
        })
        .from(products)
        .where(and(...conditions))
        .limit(limit)
        .offset(offset)
        .orderBy(products.productName);

    return {
        merchant: {
            id: merchant.id,
            name: merchant.name,
        },
        products: productList,
        pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: totalCount > 0 ? Math.ceil(totalCount / limit) : 0,
        },
    };
}
