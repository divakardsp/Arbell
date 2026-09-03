"use client";

import React from "react";
import { ProductCard } from "./product-card";
import type { ProductItemData } from "@/agent/core/events/agent-events";
import { ShoppingBag } from "lucide-react";

interface ProductGridProps {
    products: ProductItemData[];
}

export function ProductGrid({ products }: ProductGridProps) {
    if (!products || products.length === 0) {
        return null;
    }

    return (
        <div className="my-3 w-full animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
            {/* Header label */}
            <div className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                <ShoppingBag className="size-3.5 text-accent" />
                <span>Recommended Products ({products.length})</span>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    );
}
