import { OrderCard } from "@/components/order-card";
import { mockOrders } from "@/lib/mock-data";
import { Package } from "lucide-react";

export function OrdersView() {
    return (
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
            <div className="mx-auto max-w-4xl space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-border pb-4">
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

                {/* Orders Grid or Empty State */}
                {mockOrders.length === 0 ? (
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
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {mockOrders.map((order) => (
                            <OrderCard key={order.id} order={order} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
