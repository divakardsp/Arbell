import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib";
import { products, merchants, categoryEnum } from "@/db/schema";
import { ApiError } from "@/utils/ApiError";
import { validateUUID } from "@/utils/validators";

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
