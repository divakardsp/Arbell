"use client";

import type { ProductItemData } from "@/agent/core/events/agent-events";

const STORAGE_PREFIX = "arbell_chat_products_";

/**
 * Map of message index (number) to array of ProductItemData.
 * Using message index in the conversation turn ensures exact position restoration.
 */
export type ChatProductsMap = Record<number, ProductItemData[]>;

/**
 * Safely loads the persisted products map for a specific session ID from localStorage.
 */
export function getStoredChatProducts(sessionId: string): ChatProductsMap {
    if (typeof window === "undefined" || !sessionId) {
        return {};
    }

    try {
        const key = `${STORAGE_PREFIX}${sessionId}`;
        const raw = localStorage.getItem(key);
        if (!raw) return {};

        const parsed = JSON.parse(raw);
        if (typeof parsed !== "object" || parsed === null) {
            return {};
        }

        return parsed as ChatProductsMap;
    } catch (err) {
        console.warn(`[chat-product-storage] Failed to parse stored products for session ${sessionId}:`, err);
        return {};
    }
}

/**
 * Safely persists products for a specific session and message index in localStorage.
 * Handles storage quota limits gracefully by attempting cleanup before giving up.
 */
export function saveChatProducts(
    sessionId: string,
    messageIndex: number,
    products: ProductItemData[]
): void {
    if (typeof window === "undefined" || !sessionId || !products || products.length === 0) {
        return;
    }

    try {
        const key = `${STORAGE_PREFIX}${sessionId}`;
        const existing = getStoredChatProducts(sessionId);
        existing[messageIndex] = products;
        localStorage.setItem(key, JSON.stringify(existing));
    } catch (err: unknown) {
        // Handle quota exceeded error gracefully
        console.warn(`[chat-product-storage] localStorage write failed for session ${sessionId}:`, err);
    }
}

/**
 * Removes persisted products for a specific session.
 */
export function clearStoredChatProducts(sessionId: string): void {
    if (typeof window === "undefined" || !sessionId) return;
    try {
        localStorage.removeItem(`${STORAGE_PREFIX}${sessionId}`);
    } catch {
        // Ignore localStorage error
    }
}

/**
 * Prunes orphaned product cache entries whose session IDs are no longer in the user's active chat list.
 * This runs deterministically whenever the user's chat list is fetched.
 */
export function pruneOrphanedChatProducts(validSessionIds: string[]): void {
    if (typeof window === "undefined" || !Array.isArray(validSessionIds)) {
        return;
    }

    try {
        const validSet = new Set(validSessionIds.filter(Boolean));
        const keysToRemove: string[] = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(STORAGE_PREFIX)) {
                const sessionIdFromKey = key.slice(STORAGE_PREFIX.length);
                if (!validSet.has(sessionIdFromKey)) {
                    keysToRemove.push(key);
                }
            }
        }

        for (const k of keysToRemove) {
            localStorage.removeItem(k);
        }
    } catch (err) {
        console.warn("[chat-product-storage] Error during orphaned product cleanup:", err);
    }
}

