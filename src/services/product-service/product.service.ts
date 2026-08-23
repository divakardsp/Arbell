import { eq, inArray, and, or, ilike, gte, lte, gt, count, SQL } from "drizzle-orm";
import { db } from "@/lib";
import { products, merchants, categoryEnum } from "@/db/schema";
import { ApiError } from "@/utils/ApiError";
import { validateUUID, parsePaginationParams } from "@/utils/validators";
import {
    buildJsonbAttributeFilters,
    getAllowedAttributesForCategory,
    CATEGORY_ATTRIBUTES_CONFIG,
} from "./category-attributes.config";

export interface ProductMerchantSummary {
    id: string;
    name: string | null;
}

export interface ProductDetail {
    id: string;
    productName: string;
    description: string | null;
    category: (typeof categoryEnum.enumValues)[number];
    price: string;
    currency: string;
    attributes: Record<string, string | number | boolean>;
    inventoryStock: number;
    merchant: ProductMerchantSummary;
}

export interface ProductCategoriesResponse {
    total: number;
    categories: (typeof categoryEnum.enumValues)[number][];
}

export interface ProductComparisonResponse {
    count: number;
    products: ProductDetail[];
}

export interface ProductSearchParams {
    search?: string | null;
    category?: string | null;
    merchantId?: string | null;
    minPrice?: string | number | null;
    maxPrice?: string | number | null;
    inStock?: string | boolean | null;
    page?: string | number | null;
    limit?: string | number | null;
    attributes?: Record<string, string>;
}

export interface SearchProductsResponse {
    products: ProductDetail[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

/**
 * Searches and filters products dynamically.
 *
 * Flow:
 * Category -> Determine allowed attributes -> Build filters dynamically -> Query JSONB attributes
 * Omits metadata timestamps.
 */
export async function searchProducts(
    params: ProductSearchParams = {}
): Promise<SearchProductsResponse> {
    const pageStr = params.page !== undefined && params.page !== null ? String(params.page) : undefined;
    const limitStr = params.limit !== undefined && params.limit !== null ? String(params.limit) : undefined;
    const { page, limit, offset } = parsePaginationParams(pageStr, limitStr, 10);

    const conditions: SQL[] = [];

    // 1. Category validation and dynamic JSONB attributes
    let matchedCategory: (typeof categoryEnum.enumValues)[number] | undefined;

    if (params.category !== undefined && params.category !== null && String(params.category).trim() !== "") {
        const categoryQuery = String(params.category).trim();
        matchedCategory = categoryEnum.enumValues.find(
            (c) => c.toLowerCase() === categoryQuery.toLowerCase()
        );

        if (!matchedCategory) {
            throw ApiError.badRequest(`Invalid category: '${categoryQuery}'.`);
        }

        conditions.push(eq(products.category, matchedCategory));

        // Dynamically build JSONB filters using category configuration
        if (params.attributes && Object.keys(params.attributes).length > 0) {
            const jsonbConditions = buildJsonbAttributeFilters(
                matchedCategory,
                params.attributes
            );
            conditions.push(...jsonbConditions);
        }
    }

    // 2. Keyword Search (productName, description)
    if (params.search !== undefined && params.search !== null && String(params.search).trim() !== "") {
        const searchKeyword = `%${String(params.search).trim()}%`;
        const searchCondition = or(
            ilike(products.productName, searchKeyword),
            ilike(products.description, searchKeyword)
        );
        if (searchCondition) {
            conditions.push(searchCondition);
        }
    }

    // 3. Merchant filter
    if (params.merchantId !== undefined && params.merchantId !== null && String(params.merchantId).trim() !== "") {
        const validMerchantId = validateUUID(String(params.merchantId), "Merchant ID");
        conditions.push(eq(products.merchantId, validMerchantId));
    }

    // 4. Min Price filter
    let parsedMinPrice: number | undefined;
    if (params.minPrice !== undefined && params.minPrice !== null && String(params.minPrice).trim() !== "") {
        const num = Number(params.minPrice);
        if (isNaN(num) || num < 0) {
            throw ApiError.badRequest("minPrice must be a valid non-negative number.");
        }
        parsedMinPrice = num;
        conditions.push(gte(products.price, parsedMinPrice.toFixed(2)));
    }

    // 5. Max Price filter
    let parsedMaxPrice: number | undefined;
    if (params.maxPrice !== undefined && params.maxPrice !== null && String(params.maxPrice).trim() !== "") {
        const num = Number(params.maxPrice);
        if (isNaN(num) || num < 0) {
            throw ApiError.badRequest("maxPrice must be a valid non-negative number.");
        }
        parsedMaxPrice = num;
        conditions.push(lte(products.price, parsedMaxPrice.toFixed(2)));
    }

    // 6. Price range consistency validation
    if (parsedMinPrice !== undefined && parsedMaxPrice !== undefined && parsedMinPrice > parsedMaxPrice) {
        throw ApiError.badRequest(
            `minPrice (${parsedMinPrice}) cannot be greater than maxPrice (${parsedMaxPrice}).`
        );
    }

    // 7. In Stock filter
    if (params.inStock !== undefined && params.inStock !== null && String(params.inStock).trim() !== "") {
        const inStockStr = String(params.inStock).trim().toLowerCase();
        if (inStockStr === "true" || inStockStr === "1") {
            conditions.push(gt(products.inventoryStock, 0));
        } else if (inStockStr === "false" || inStockStr === "0") {
            conditions.push(lte(products.inventoryStock, 0));
        } else {
            throw ApiError.badRequest("inStock filter must be 'true' or 'false'.");
        }
    }

    // 8. Count matching products
    const countQuery = db
        .select({ total: count() })
        .from(products);

    const [{ total }] = conditions.length > 0
        ? await countQuery.where(and(...conditions))
        : await countQuery;

    const totalCount = Number(total);

    // 9. Query paginated products with merchant join
    const productQuery = db
        .select({
            id: products.id,
            productName: products.productName,
            description: products.description,
            category: products.category,
            price: products.price,
            currency: products.currency,
            attributes: products.attributes,
            inventoryStock: products.inventoryStock,
            merchantId: products.merchantId,
            merchantName: merchants.name,
        })
        .from(products)
        .leftJoin(merchants, eq(products.merchantId, merchants.id));

    const productList = conditions.length > 0
        ? await productQuery.where(and(...conditions)).limit(limit).offset(offset).orderBy(products.productName)
        : await productQuery.limit(limit).offset(offset).orderBy(products.productName);

    return {
        products: productList.map((p) => ({
            id: p.id,
            productName: p.productName,
            description: p.description,
            category: p.category,
            price: p.price,
            currency: p.currency,
            attributes: p.attributes,
            inventoryStock: p.inventoryStock,
            merchant: {
                id: p.merchantId,
                name: p.merchantName,
            },
        })),
        pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: totalCount > 0 ? Math.ceil(totalCount / limit) : 0,
        },
    };
}

/**
 * Retrieves full details for a specific product by ID, joined with merchant info.
 * Omits metadata timestamps.
 */
export async function getProductById(productId: string): Promise<ProductDetail> {
    const validProductId = validateUUID(productId, "Product ID");

    const [product] = await db
        .select({
            id: products.id,
            productName: products.productName,
            description: products.description,
            category: products.category,
            price: products.price,
            currency: products.currency,
            attributes: products.attributes,
            inventoryStock: products.inventoryStock,
            merchantId: products.merchantId,
            merchantName: merchants.name,
        })
        .from(products)
        .leftJoin(merchants, eq(products.merchantId, merchants.id))
        .where(eq(products.id, validProductId));

    if (!product) {
        throw ApiError.notFound(`Product with ID '${validProductId}' was not found.`);
    }

    return {
        id: product.id,
        productName: product.productName,
        description: product.description,
        category: product.category,
        price: product.price,
        currency: product.currency,
        attributes: product.attributes,
        inventoryStock: product.inventoryStock,
        merchant: {
            id: product.merchantId,
            name: product.merchantName,
        },
    };
}

/**
 * Retrieves the full list of available product categories from schema enum.
 */
export async function getProductCategories(): Promise<ProductCategoriesResponse> {
    const categories = [...categoryEnum.enumValues];
    return {
        total: categories.length,
        categories,
    };
}

/**
 * Compares two or more products by ID, returning their attributes, pricing, descriptions,
 * and merchant details for LLM comparison.
 */
export async function compareProducts(
    rawProductIds: string[]
): Promise<ProductComparisonResponse> {
    if (!rawProductIds || !Array.isArray(rawProductIds) || rawProductIds.length === 0) {
        throw ApiError.badRequest("A list of product IDs is required for comparison.");
    }

    // Validate each ID and deduplicate
    const validProductIds: string[] = [];
    for (const rawId of rawProductIds) {
        const validId = validateUUID(rawId, "Product ID");
        if (!validProductIds.includes(validId)) {
            validProductIds.push(validId);
        }
    }

    if (validProductIds.length < 2) {
        throw ApiError.badRequest(
            "At least 2 distinct valid product IDs are required for comparison."
        );
    }

    if (validProductIds.length > 10) {
        throw ApiError.badRequest(
            "Cannot compare more than 10 products simultaneously."
        );
    }

    // Query all requested products with merchant information
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
            merchantId: products.merchantId,
            merchantName: merchants.name,
        })
        .from(products)
        .leftJoin(merchants, eq(products.merchantId, merchants.id))
        .where(inArray(products.id, validProductIds));

    // Verify all requested products were found
    const foundIds = new Set(productList.map((p) => p.id));
    const missingIds = validProductIds.filter((id) => !foundIds.has(id));

    if (missingIds.length > 0) {
        throw ApiError.notFound(
            `The following product(s) were not found: ${missingIds.join(", ")}`
        );
    }

    // Map into comparison format
    const formattedProducts: ProductDetail[] = productList.map((p) => ({
        id: p.id,
        productName: p.productName,
        description: p.description,
        category: p.category,
        price: p.price,
        currency: p.currency,
        attributes: p.attributes,
        inventoryStock: p.inventoryStock,
        merchant: {
            id: p.merchantId,
            name: p.merchantName,
        },
    }));

    return {
        count: formattedProducts.length,
        products: formattedProducts,
    };
}

export {
    getAllowedAttributesForCategory,
    CATEGORY_ATTRIBUTES_CONFIG,
};
