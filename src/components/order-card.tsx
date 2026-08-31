import { type MockOrder, type OrderStatus } from "@/lib/mock-data";

interface OrderCardProps {
    order: MockOrder;
}

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
    delivered: {
        label: "Delivered",
        className: "bg-success/15 text-success border-success/30",
    },
    returned: {
        label: "Returned",
        className: "bg-success/10 text-success border-success/20",
    },
    confirmed: {
        label: "Confirmed",
        className: "bg-info/15 text-info border-info/30",
    },
    processing: {
        label: "Processing",
        className: "bg-warning/15 text-warning border-warning/30",
    },
    in_transit: {
        label: "In Transit",
        className: "bg-warning/15 text-warning border-warning/30",
    },
    pending: {
        label: "Pending",
        className: "bg-warning/15 text-warning border-warning/30",
    },
    return_requested: {
        label: "Return Requested",
        className: "bg-warning/15 text-warning border-warning/30",
    },
    refunded: {
        label: "Refunded",
        className: "bg-info/15 text-info border-info/30",
    },
    cancelled: {
        label: "Cancelled",
        className: "bg-error/15 text-error border-error/30",
    },
    failed: {
        label: "Failed",
        className: "bg-error/15 text-error border-error/30",
    },
};

export function OrderCard({ order }: OrderCardProps) {
    const statusInfo = statusConfig[order.status] || {
        label: order.status,
        className: "bg-muted/15 text-muted border-border",
    };

    return (
        <div className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 transition-all duration-150 hover:border-border hover:shadow-xs">
            {/* Top Row: Product Name & Status Badge */}
            <div className="flex items-start justify-between gap-4">
                <h3 className="text-base font-medium text-foreground tracking-tight line-clamp-1">
                    {order.productName}
                </h3>
                <span
                    className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${statusInfo.className}`}
                >
                    {statusInfo.label}
                </span>
            </div>

            {/* Description */}
            <p className="mt-2 text-sm text-muted leading-relaxed line-clamp-2">
                {order.description}
            </p>

            {/* Bottom Row: Amount & Date */}
            <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                <span className="text-base font-semibold text-foreground">
                    {order.amount}
                </span>
                <span className="text-xs text-muted font-medium">
                    {order.date}
                </span>
            </div>
        </div>
    );
}
