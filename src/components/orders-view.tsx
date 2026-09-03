"use client";

import { useEffect, useState } from "react";
import { OrderCard, type DisplayOrder } from "@/components/order-card";
import { Package, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OrdersView() {
    const [orders, setOrders] = useState<DisplayOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrders = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const res = await fetch("/api/users/me/orders");
            if (!res.ok) {
                throw new Error(`Failed to load orders: HTTP ${res.status}`);
            }
            const json = await res.json();
            if (json.success && json.data?.orders) {
                const mapped: DisplayOrder[] = json.data.orders.map((o: any) => {
                    const firstItemName =
                        o.items?.[0]?.productName || "Order Item";
                    const itemsDesc =
                        o.items && o.items.length > 0
                            ? o.items
                                  .map((i: any) => `${i.productName} (x${i.quantity})`)
                                  .join(", ")
                            : o.merchant?.name
                            ? `Purchased from ${o.merchant.name}`
                            : "Order details";
                    const amountFormatted = `₹${Number(o.amount || 0).toLocaleString("en-IN")}`;
                    const formattedDate = o.createdAt
                        ? new Date(o.createdAt).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                          })
                        : `Order #${o.id.slice(0, 8)}`;
                    return {
                        id: o.id,
                        productName: firstItemName,
                        description: itemsDesc,
                        amount: amountFormatted,
                        status: o.status || "confirmed",
                        date: formattedDate,
                    };
                });
                setOrders(mapped);
            } else {
                setOrders([]);
            }
        } catch (err: any) {
            console.error("Error fetching orders:", err);
            setError(err.message || "Failed to load orders");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    return (
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
            <div className="mx-auto max-w-4xl space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-surface text-brand">
                            <Package className="size-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                                Your Orders
                            </h1>
                            <p className="text-xs text-muted sm:text-sm">
                                Manage and track your recent purchases with Arbell
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchOrders}
                        disabled={isLoading}
                        className="gap-2 rounded-lg border border-border text-xs text-muted hover:text-foreground"
                    >
                        <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
                        <span>Refresh</span>
                    </Button>
                </div>

                {/* Loading Skeletons */}
                {isLoading ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {[1, 2, 3, 4].map((n) => (
                            <div
                                key={n}
                                className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 h-36 animate-pulse"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="h-5 w-40 rounded bg-border/60" />
                                    <div className="h-5 w-20 rounded-full bg-border/40" />
                                </div>
                                <div className="h-4 w-3/4 rounded bg-border/40" />
                                <div className="flex items-center justify-between pt-3 border-t border-border/40">
                                    <div className="h-5 w-24 rounded bg-border/60" />
                                    <div className="h-3 w-16 rounded bg-border/40" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-error/40 bg-error/5 px-6 py-12 text-center">
                        <p className="text-sm font-medium text-error">{error}</p>
                        <Button
                            onClick={fetchOrders}
                            size="sm"
                            className="mt-4 rounded-xl bg-brand text-white hover:bg-brand/90 text-xs"
                        >
                            Retry
                        </Button>
                    </div>
                ) : orders.length === 0 ? (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
                        <div className="flex size-12 items-center justify-center rounded-2xl border border-border bg-surface text-muted shadow-xs">
                            <Package className="size-6 text-muted" />
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-foreground">
                            You have not ordered anything yet.
                        </h3>
                        <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-muted leading-relaxed">
                            When you place orders through Arbell, their status and tracking details will appear here.
                        </p>
                    </div>
                ) : (
                    /* Orders Grid */
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {orders.map((order) => (
                            <OrderCard key={order.id} order={order} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
