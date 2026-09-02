"use client";

import { useEffect, useState } from "react";
import {
    Plus,
    ShieldCheck,
    CheckCircle2,
    AlertCircle,
    Calendar,
    Wallet,
    ArrowUpRight,
    RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateMandateDialog } from "@/components/create-mandate-dialog";

export interface MandateItem {
    id: string;
    amountAuthorized: string;
    amountRemaining: string;
    createdAt?: string;
    validUntil?: string;
    status: "active" | "revoked" | "exhausted" | "expired" | string;
}

export function MandatesView() {
    const [mandates, setMandates] = useState<MandateItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRevoking, setIsRevoking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const fetchMandates = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const res = await fetch("/api/users/me/payment-authorizations");
            if (!res.ok) {
                throw new Error(`Failed to load payment authorizations: HTTP ${res.status}`);
            }
            const json = await res.json();
            if (json.success && json.data?.authorizations) {
                const mapped: MandateItem[] = json.data.authorizations.map((a: any) => {
                    const authorizedFormatted = `₹${Number(a.authorizedAmount || 0).toLocaleString("en-IN")}`;
                    const remainingFormatted = `₹${Number(a.remainingAmount || 0).toLocaleString("en-IN")}`;
                    const validUntilFormatted = a.validUntil
                        ? new Date(a.validUntil).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                          })
                        : "—";
                    const createdAtFormatted = a.createdAt
                        ? new Date(a.createdAt).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                          })
                        : "—";
                    return {
                        id: a.id,
                        amountAuthorized: authorizedFormatted,
                        amountRemaining: remainingFormatted,
                        createdAt: createdAtFormatted,
                        validUntil: validUntilFormatted,
                        status: a.status || "active",
                    };
                });
                setMandates(mapped);
            } else {
                setMandates([]);
            }
        } catch (err: any) {
            console.error("Error fetching mandates:", err);
            setError(err.message || "Failed to load payment authorizations");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMandates();
    }, []);

    // Single mandate model: prioritize the latest active mandate, or the latest mandate
    const activeMandate =
        mandates.find((m) => m.status === "active") || (mandates.length > 0 ? mandates[0] : null);
    const isRevoked = activeMandate?.status === "revoked";
    const hasActiveMandate = !!activeMandate && activeMandate.status === "active";

    const handleCreateMandate = async (data: { amount: number; validUntil: string }) => {
        const res = await fetch("/api/payment-authorizations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                amount: data.amount,
                validUntil: data.validUntil,
            }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
            throw new Error(json.error || json.message || "Failed to create mandate.");
        }

        await fetchMandates();
    };

    const handleRevoke = async () => {
        if (!activeMandate || isRevoking) return;
        try {
            setIsRevoking(true);
            const res = await fetch(`/api/payment-authorizations/${activeMandate.id}/revoke`, {
                method: "POST",
            });
            const json = await res.json();
            if (!res.ok || !json.success) {
                throw new Error(json.error || json.message || "Failed to revoke mandate.");
            }
            await fetchMandates();
        } catch (err: any) {
            console.error("Error revoking mandate:", err);
            setError(err.message || "Failed to revoke mandate");
        } finally {
            setIsRevoking(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
            <div className="mx-auto max-w-3xl space-y-6">
                {/* Header with Title & Create Mandate Button */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-surface text-brand">
                            <ShieldCheck className="size-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                                Your Mandate
                            </h1>
                            <p className="text-xs text-muted sm:text-sm">
                                Pre-authorized recurring limit for 1-click autonomous purchasing
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={fetchMandates}
                            disabled={isLoading}
                            className="gap-2 rounded-lg border border-border text-xs text-muted hover:text-foreground"
                        >
                            <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
                            <span>Refresh</span>
                        </Button>

                        <Button
                            onClick={() => setIsDialogOpen(true)}
                            disabled={hasActiveMandate || isLoading}
                            className={`flex items-center gap-2 rounded-xl shadow-xs transition-all ${
                                hasActiveMandate
                                    ? "bg-hover text-muted cursor-not-allowed opacity-60 border border-border"
                                    : "bg-brand text-white hover:bg-brand/90 cursor-pointer"
                            }`}
                        >
                            <Plus className="size-4" />
                            <span>Create Mandate</span>
                        </Button>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="flex items-center justify-between rounded-xl border border-error/30 bg-error/10 p-3 text-xs text-error">
                        <span>{error}</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setError(null)}
                            className="h-6 px-2 text-xs text-error hover:bg-error/20"
                        >
                            Dismiss
                        </Button>
                    </div>
                )}

                {/* Loading Skeleton */}
                {isLoading ? (
                    <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs animate-pulse space-y-6">
                        <div className="flex items-center justify-between border-b border-border/60 pb-5">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-xl bg-border/50" />
                                <div className="space-y-2">
                                    <div className="h-5 w-48 rounded bg-border/50" />
                                    <div className="h-3 w-32 rounded bg-border/30" />
                                </div>
                            </div>
                            <div className="h-8 w-28 rounded-lg bg-border/40" />
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-20 rounded-xl border border-border/50 bg-main/40 p-4" />
                            ))}
                        </div>
                    </div>
                ) : !activeMandate ? (
                    /* Empty State: No mandate ever created */
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
                        <div className="flex size-12 items-center justify-center rounded-2xl border border-border bg-surface text-muted shadow-xs">
                            <ShieldCheck className="size-6 text-muted" />
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-foreground">
                            No active mandate registered
                        </h3>
                        <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-muted leading-relaxed">
                            You currently have no active payment mandate. Authorize a mandate once to enable seamless 1-click autonomous purchases across all products.
                        </p>
                        <Button
                            onClick={() => setIsDialogOpen(true)}
                            className="mt-6 flex items-center gap-2 rounded-xl bg-brand text-white hover:bg-brand/90 text-xs shadow-xs"
                        >
                            <Plus className="size-3.5" />
                            <span>Create Your Mandate</span>
                        </Button>
                    </div>
                ) : (
                    /* Single Mandate Card UI */
                    <div className="space-y-4">
                        <div
                            className={`overflow-hidden rounded-2xl border bg-surface p-6 shadow-xs transition-all ${
                                isRevoked ? "border-border/60 opacity-80" : "border-border"
                            }`}
                        >
                            {/* Card Top Row */}
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`flex size-10 items-center justify-center rounded-xl border ${
                                            isRevoked
                                                ? "border-border bg-hover/50 text-muted"
                                                : "border-success/30 bg-success/10 text-success"
                                        }`}
                                    >
                                        {isRevoked ? (
                                            <AlertCircle className="size-5 text-muted" />
                                        ) : (
                                            <CheckCircle2 className="size-5" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-base font-semibold text-foreground">
                                                Universal Purchase Mandate
                                            </h2>
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                                                    isRevoked
                                                        ? "bg-hover text-muted border border-border"
                                                        : "bg-success/15 text-success border border-success/20"
                                                }`}
                                            >
                                                {activeMandate.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted">
                                            Valid for autonomous 1-click checkouts
                                        </p>
                                    </div>
                                </div>

                                {/* Action: Revoke Button */}
                                <div>
                                    {isRevoked ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled
                                            className="rounded-lg border border-border bg-hover/50 text-xs font-medium text-muted cursor-not-allowed opacity-70"
                                        >
                                            Revoked
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleRevoke}
                                            disabled={isRevoking}
                                            className="rounded-lg border border-border bg-surface text-xs font-medium text-error hover:bg-error/10 hover:border-error/30 hover:text-error transition-colors"
                                        >
                                            {isRevoking ? "Revoking..." : "Revoke Mandate"}
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Mandate Metrics Grid */}
                            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="rounded-xl border border-border/50 bg-main/40 p-4">
                                    <div className="flex items-center gap-2 text-xs font-medium text-muted">
                                        <Wallet className="size-3.5" />
                                        <span>Authorized Limit</span>
                                    </div>
                                    <p className="mt-1.5 text-lg font-bold tracking-tight text-foreground">
                                        {activeMandate.amountAuthorized}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-border/50 bg-main/40 p-4">
                                    <div className="flex items-center gap-2 text-xs font-medium text-muted">
                                        <ArrowUpRight className="size-3.5 text-brand" />
                                        <span>Remaining Balance</span>
                                    </div>
                                    <p className="mt-1.5 text-lg font-bold tracking-tight text-brand">
                                        {activeMandate.amountRemaining}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-border/50 bg-main/40 p-4">
                                    <div className="flex items-center gap-2 text-xs font-medium text-muted">
                                        <Calendar className="size-3.5" />
                                        <span>Created On</span>
                                    </div>
                                    <p className="mt-1.5 text-sm font-semibold text-foreground">
                                        {activeMandate.createdAt || "—"}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-border/50 bg-main/40 p-4">
                                    <div className="flex items-center gap-2 text-xs font-medium text-muted">
                                        <Calendar className="size-3.5" />
                                        <span>Valid Until</span>
                                    </div>
                                    <p className="mt-1.5 text-sm font-semibold text-foreground">
                                        {activeMandate.validUntil || "—"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* If revoked, encourage creating a new mandate */}
                        {isRevoked && (
                            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-surface/70 p-4 text-xs">
                                <p className="text-muted">
                                    This mandate was revoked. You can create a new mandate anytime to resume 1-click purchases.
                                </p>
                                <Button
                                    size="sm"
                                    onClick={() => setIsDialogOpen(true)}
                                    className="shrink-0 rounded-lg bg-brand text-white hover:bg-brand/90 text-xs shadow-xs"
                                >
                                    Create New Mandate
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create Mandate Dialog Popup */}
            <CreateMandateDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onCreate={handleCreateMandate}
            />
        </div>
    );
}


