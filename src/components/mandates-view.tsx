"use client";

import { useState } from "react";
import { Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MandateRow } from "@/components/mandate-row";
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { CreateMandateDialog } from "@/components/create-mandate-dialog";
import { mockMandates as initialMandates } from "@/lib/mock-data";

export function MandatesView() {
    const [mandates, setMandates] = useState(initialMandates);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

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

        const newMandate = {
            id: `man-${Date.now()}`,
            amountAuthorized: data.amount,
            amountRemaining: data.amount,
            merchantName: "Arbell AutoPay",
            createdAt: todayFormatted,
            validUntil: validUntilFormatted,
        };
        setMandates((prev) => [newMandate, ...prev]);
    };

    return (
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
            <div className="mx-auto max-w-4xl space-y-6">
                {/* Header with Title & Create Mandate Button */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-surface text-brand">
                            <ShieldCheck className="size-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                                Your Mandates
                            </h1>
                            <p className="text-xs text-muted sm:text-sm">
                                Pre-authorized recurring limits for 1-click autonomous purchasing
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={() => setIsDialogOpen(true)}
                        className="flex items-center gap-2 rounded-xl bg-brand text-white hover:bg-brand/90 shadow-xs"
                    >
                        <Plus className="size-4" />
                        <span>Create Mandate</span>
                    </Button>
                </div>

                {/* Mandates List or Empty State */}
                {mandates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
                        <div className="flex size-12 items-center justify-center rounded-2xl border border-border bg-surface text-muted shadow-xs">
                            <ShieldCheck className="size-6 text-muted" />
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-foreground">
                            No mandates registered
                        </h3>
                        <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-muted leading-relaxed">
                            You currently have 0 active payment mandates. Create a mandate to enable seamless 1-click autonomous purchases.
                        </p>
                        <Button
                            onClick={() => setIsDialogOpen(true)}
                            className="mt-6 flex items-center gap-2 rounded-xl bg-brand text-white hover:bg-brand/90 text-xs shadow-xs"
                        >
                            <Plus className="size-3.5" />
                            <span>Create Your First Mandate</span>
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-border bg-hover/30 hover:bg-hover/30">
                                    <TableHead className="w-12 px-4 text-xs font-semibold uppercase tracking-wider text-muted">
                                        S.No
                                    </TableHead>
                                    <TableHead className="px-4 text-xs font-semibold uppercase tracking-wider text-muted">
                                        Amount Authorized
                                    </TableHead>
                                    <TableHead className="px-4 text-xs font-semibold uppercase tracking-wider text-muted">
                                        Amount Remaining
                                    </TableHead>
                                    <TableHead className="px-4 text-xs font-semibold uppercase tracking-wider text-muted">
                                        Created On
                                    </TableHead>
                                    <TableHead className="px-4 text-xs font-semibold uppercase tracking-wider text-muted">
                                        Valid Until
                                    </TableHead>
                                    <TableHead className="px-4 text-right text-xs font-semibold uppercase tracking-wider text-muted">
                                        Revoke
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mandates.map((mandate, index) => (
                                    <MandateRow
                                        key={mandate.id}
                                        serialNumber={index + 1}
                                        mandate={mandate}
                                    />
                                ))}
                            </TableBody>
                        </Table>
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
