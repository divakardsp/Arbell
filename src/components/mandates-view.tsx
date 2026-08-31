"use client";

import { useState } from "react";
import { Plus, ShieldCheck, CheckCircle2, AlertCircle, Calendar, Wallet, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateMandateDialog } from "@/components/create-mandate-dialog";
import { mockMandates as initialMandates, type MockMandate } from "@/lib/mock-data";

export function MandatesView() {
    const [mandates, setMandates] = useState<MockMandate[]>(initialMandates);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Single mandate model: find the latest mandate
    const activeMandate = mandates.length > 0 ? mandates[0] : null;
    const isRevoked = activeMandate?.status === "revoked";
    const hasActiveMandate = !!activeMandate && !isRevoked;

    const handleCreateMandate = (data: { amount: string; validUntil: string }) => {
        const todayFormatted = new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
        const validUntilFormatted = new Date(data.validUntil).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });

        const newMandate: MockMandate = {
            id: `man-${Date.now()}`,
            amountAuthorized: data.amount,
            amountRemaining: data.amount,
            createdAt: todayFormatted,
            validUntil: validUntilFormatted,
            status: "active",
        };
        // Replace with new active mandate
        setMandates([newMandate]);
    };

    const handleRevoke = () => {
        if (!activeMandate) return;
        setMandates((prev) =>
            prev.map((m) =>
                m.id === activeMandate.id ? { ...m, status: "revoked" as const } : m
            )
        );
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

                    <Button
                        onClick={() => setIsDialogOpen(true)}
                        disabled={hasActiveMandate}
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

                {/* Mandate View Content */}
                {!activeMandate ? (
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
                        <div className={`overflow-hidden rounded-2xl border bg-surface p-6 shadow-xs transition-all ${
                            isRevoked ? "border-border/60 opacity-80" : "border-border"
                        }`}>
                            {/* Card Top Row */}
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
                                <div className="flex items-center gap-3">
                                    <div className={`flex size-10 items-center justify-center rounded-xl border ${
                                        isRevoked
                                            ? "border-border bg-hover/50 text-muted"
                                            : "border-success/30 bg-success/10 text-success"
                                    }`}>
                                        {isRevoked ? <AlertCircle className="size-5 text-muted" /> : <CheckCircle2 className="size-5" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-base font-semibold text-foreground">
                                                Universal Purchase Mandate
                                            </h2>
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                                isRevoked
                                                    ? "bg-hover text-muted border border-border"
                                                    : "bg-success/15 text-success border border-success/20"
                                            }`}>
                                                {isRevoked ? "Revoked" : "Active"}
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
                                            className="rounded-lg border border-border bg-surface text-xs font-medium text-error hover:bg-error/10 hover:border-error/30 hover:text-error transition-colors"
                                        >
                                            Revoke Mandate
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

