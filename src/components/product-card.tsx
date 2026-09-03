"use client";

import React, { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { ShoppingBag, Loader2, Star, CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProductItemData } from "@/agent/core/events/agent-events";

interface RazorpayHandlerResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

interface RazorpayInstance {
    open: () => void;
    on: (event: string, callback: (response: { error?: { description?: string } }) => void) => void;
}

interface ProductCardProps {
    product: ProductItemData;
}

export function ProductCard({ product }: ProductCardProps) {
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [isPurchased, setIsPurchased] = useState(false);

    // Format price safely
    const numPrice = typeof product.price === "number" ? product.price : parseFloat(String(product.price || "0")) || 0;
    const formattedPrice = `₹${numPrice.toLocaleString("en-IN")}`;

    // Resolve brand & rating
    const brand =
        product.brand ||
        (product.attributes?.brand ? String(product.attributes.brand) : undefined) ||
        (product.merchant?.name ? product.merchant.name : "Arbell Partner");

    const rating =
        product.rating ??
        (product.attributes?.rating ? Number(product.attributes.rating) : 4.5);

    // Stock
    const isOutOfStock = product.availableStock !== undefined && product.availableStock <= 0;

    const handleBuyClick = async () => {
        if (isPurchasing || isPurchased || isOutOfStock) return;

        setIsPurchasing(true);

        try {
            // 1. Call POST /api/payments with the exact InitiateSbmdPaymentInput contract
            const response = await fetch("/api/payments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    items: [
                        {
                            productId: product.id,
                            quantity: 1,
                        },
                    ],
                    amount: numPrice,
                    currency: product.currency || "INR",
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                // Check if this is the specific INSUFFICIENT_MANDATE_AMOUNT business error
                if (data?.code === "INSUFFICIENT_MANDATE_AMOUNT") {
                    const availableStr = data?.data?.availableAmount ? `₹${Number(data.data.availableAmount).toLocaleString("en-IN")}` : "";
                    const requestedStr = data?.data?.requestedAmount ? `₹${Number(data.data.requestedAmount).toLocaleString("en-IN")}` : formattedPrice;
                    const desc = availableStr
                        ? `Insufficient mandate amount. Available: ${availableStr}, required: ${requestedStr}.`
                        : data.message || "Your mandate does not have enough available amount for this purchase.";

                    toast.error("Insufficient Mandate Balance", {
                        description: desc,
                        icon: <ShieldAlert className="size-4 text-destructive" />,
                        duration: 6000,
                    });
                    return;
                }

                const errorMessage =
                    data?.error?.message ||
                    data?.error ||
                    data?.message ||
                    `Payment initiation failed (HTTP ${response.status})`;
                toast.error("Purchase Failed", {
                    description: errorMessage,
                });
                return;
            }

            const paymentResult = data.data;

            // -------------------------------------------------------------
            // CASE A: MANDATE / RESERVE REQUIRED ("requires_reserve")
            // -------------------------------------------------------------
            if (paymentResult.status === "requires_reserve") {
                toast.warning("Mandate Required", {
                    description:
                        "Please create a payment UPM (Universal Purchase Mandate) first before placing an order. Go to the Mandates tab in the sidebar.",
                    icon: <ShieldAlert className="size-4 text-warning" />,
                    duration: 6000,
                });
                return;
            }

            // -------------------------------------------------------------
            // CASE B: RAZORPAY SBMD MANDATE CHECKOUT REQUIRED ("mandate_required")
            // -------------------------------------------------------------
            if (paymentResult.status === "mandate_required") {
                const globalWindow = typeof window !== "undefined" ? (window as unknown as { Razorpay?: new (opts: unknown) => RazorpayInstance }) : undefined;
                if (!globalWindow?.Razorpay) {
                    toast.error("Razorpay SDK Unavailable", {
                        description: "Payment gateway is loading. Please refresh and try again.",
                    });
                    return;
                }

                toast.info("Authorizing Mandate", {
                    description: "Opening Razorpay checkout for UPI mandate authorization...",
                });

                const razorpayOptions = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                    order_id: paymentResult.razorpayOrderId,
                    customer_id: paymentResult.razorpayCustomerId,
                    recurring: "1",
                    name: "Arbell Commerce",
                    description: `Mandate authorization for ${product.productName}`,
                    handler: async function (rzpResponse: RazorpayHandlerResponse) {
                        try {
                            // Verify mandate server-side
                            const verifyRes = await fetch("/api/payments/verify", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                    orderId: paymentResult.orderId,
                                    paymentId: paymentResult.paymentId,
                                    razorpayOrderId: rzpResponse.razorpay_order_id,
                                    razorpayPaymentId: rzpResponse.razorpay_payment_id,
                                    razorpaySignature: rzpResponse.razorpay_signature,
                                    authorizationId: paymentResult.authorizationId,
                                }),
                            });

                            const verifyData = await verifyRes.json();
                            if (verifyRes.ok && verifyData.success) {
                                setIsPurchased(true);
                                toast.success("Order Created Successfully", {
                                    description:
                                        "Order created successfully.",
                                    icon: <CheckCircle2 className="size-4 text-success" />,
                                    duration: 8000,
                                });
                            } else {
                                toast.error("Mandate Verification Failed", {
                                    description:
                                        verifyData?.error?.message ||
                                        verifyData?.message ||
                                        "Payment mandate authorization could not be verified.",
                                });
                            }
                        } catch (verifyErr: unknown) {
                            const errMessage = verifyErr instanceof Error ? verifyErr.message : "Failed to verify mandate payment.";
                            toast.error("Verification Error", {
                                description: errMessage,
                            });
                        }
                    },
                    modal: {
                        ondismiss: function () {
                            toast.info("Payment Cancelled", {
                                description: "Razorpay mandate authorization checkout was closed.",
                            });
                        },
                    },
                    theme: {
                        color: "#0F172A",
                    },
                };

                const rzp = new globalWindow.Razorpay(razorpayOptions);
                rzp.on("payment.failed", function (failResponse) {
                    toast.error("Payment Failed", {
                        description: failResponse?.error?.description || "Razorpay mandate authorization failed.",
                    });
                });
                rzp.open();
                return;
            }

            // -------------------------------------------------------------
            // CASE C: SUCCESS / DEBIT SCHEDULED ("debit_scheduled")
            // -------------------------------------------------------------
            if (paymentResult.status === "debit_scheduled") {
                setIsPurchased(true);
                toast.success("Order Created Successfully", {
                    description:
                        "Order created successfully. We will confirm it within 25–26 hours.",
                    icon: <CheckCircle2 className="size-4 text-success" />,
                    duration: 8000,
                });
                return;
            }

            // Generic success fallback
            toast.success("Order Initiated", {
                description: paymentResult.message || "Order created successfully.",
            });
        } catch (err: unknown) {
            const errMessage = err instanceof Error ? err.message : "Network error. Please check your connection and try again.";
            console.error("[ProductCard] Purchase error:", err);
            toast.error("Purchase Error", {
                description: errMessage,
            });
        } finally {
            setIsPurchasing(false);
        }
    };

    return (
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-xs transition-all duration-200 hover:border-border hover:shadow-md">
            {/* Top: Generic Logo / Product Visual Area */}
            <div className="relative flex h-36 w-full items-center justify-center border-b border-border/30 bg-muted/10">
                <div className="flex size-16 items-center justify-center rounded-2xl border border-border/40 bg-surface/90 shadow-xs transition-transform duration-300 group-hover:scale-105">
                    <Image
                        src="/ChatLogo.png"
                        alt="Arbell Product"
                        width={36}
                        height={36}
                        className="size-9 object-contain"
                    />
                </div>

                {/* Category Badge */}
                {product.category && (
                    <span className="absolute top-3 left-3 text-xs font-medium text-foreground/90 tracking-tight">
                        {product.category}
                    </span>
                )}

                {/* Stock Status Badge */}
                {isOutOfStock ? (
                    <span className="absolute top-3 right-3 rounded-md bg-destructive/20 border border-destructive/30 px-2 py-0.5 text-[11px] font-medium tracking-wide text-destructive shadow-xs">
                        Out of Stock
                    </span>
                ) : (
                    <span className="absolute top-3 right-3 rounded-md bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 text-[11px] font-medium tracking-wide text-emerald-400 shadow-xs">
                        In Stock
                    </span>
                )}
            </div>

            {/* Middle: Details */}
            <div className="flex flex-1 flex-col pt-4 px-4 pb-1">
                {/* Brand & Rating Row */}
                <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted line-clamp-1">
                        {brand}
                    </span>
                    <div className="flex items-center gap-1 text-xs font-semibold text-amber-400">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        <span>{rating.toFixed(1)}</span>
                    </div>
                </div>

                {/* Title */}
                <h4 className="mt-2 text-sm font-semibold text-foreground tracking-tight line-clamp-2 min-h-[2.5rem] leading-snug">
                    {product.productName}
                </h4>
            </div>

            {/* Bottom Row: Clear Full Price on left, Flush Coral/Red Buy Now Button on right */}
            <div className="mt-3 flex items-center justify-between border-t border-border/40 pl-4 pr-0 py-0 min-h-[52px]">
                {/* Price Section: Guaranteed 100% Visible & Never Truncated */}
                <div className="flex shrink-0 flex-col justify-center py-1.5 pr-3">
                    <span className="text-[11px] uppercase font-bold tracking-wider text-muted/80">
                        PRICE
                    </span>
                    <span className="text-base font-extrabold text-foreground tracking-tight whitespace-nowrap leading-tight">
                        {formattedPrice}
                    </span>
                </div>

                {/* Buy Button: Flush with right & bottom edge */}
                <Button
                    size="sm"
                    disabled={isPurchasing || isPurchased || isOutOfStock}
                    onClick={handleBuyClick}
                    className={`h-[52px] shrink-0 rounded-none rounded-tl-2xl px-4 sm:px-5 gap-2 text-xs sm:text-sm font-semibold shadow-none transition-all ${
                        isPurchased
                            ? "bg-success/20 text-success border-l border-t border-success/30 hover:bg-success/20 cursor-default"
                            : "bg-[#FF5C39] hover:bg-[#E84D2B] text-white"
                    }`}
                >
                    {isPurchasing ? (
                        <>
                            <Loader2 className="size-4 animate-spin" />
                            <span className="whitespace-nowrap">Processing</span>
                        </>
                    ) : isPurchased ? (
                        <>
                            <CheckCircle2 className="size-4" />
                            <span className="whitespace-nowrap">Ordered</span>
                        </>
                    ) : isOutOfStock ? (
                        <span className="whitespace-nowrap">Unavailable</span>
                    ) : (
                        <>
                            <ShoppingBag className="size-4 shrink-0" />
                            <span className="whitespace-nowrap">Buy Now</span>
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
