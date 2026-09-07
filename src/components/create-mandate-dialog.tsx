"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    MANDATE_MIN_AMOUNT,
    MANDATE_MAX_AMOUNT,
    MANDATE_MIN_VALIDITY_DAYS,
    MANDATE_MAX_VALIDITY_DAYS,
} from "@/services/payment-authorization-service/constants";

interface CreateMandateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreate: (data: { amount: number; validUntil: string }) => Promise<void> | void;
}

export function CreateMandateDialog({
    open,
    onOpenChange,
    onCreate,
}: CreateMandateDialogProps) {
    const today = new Date();
    
    // Min 5 days from today
    const minDate = new Date(today.getTime() + MANDATE_MIN_VALIDITY_DAYS * 24 * 60 * 60 * 1000);
    const minDateStr = minDate.toISOString().split("T")[0];

    // Max 90 days from today
    const maxDate = new Date(today.getTime() + MANDATE_MAX_VALIDITY_DAYS * 24 * 60 * 60 * 1000);
    const maxDateStr = maxDate.toISOString().split("T")[0];

    const [amount, setAmount] = useState<string>("5000");
    const [validUntil, setValidUntil] = useState<string>(minDateStr);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const amountNum = Number(amount);
        if (isNaN(amountNum) || amountNum < MANDATE_MIN_AMOUNT || amountNum > MANDATE_MAX_AMOUNT) {
            setError(`Amount must be between ₹${MANDATE_MIN_AMOUNT} and ₹${MANDATE_MAX_AMOUNT.toLocaleString("en-IN")} INR.`);
            return;
        }

        if (!validUntil) {
            setError("Please select a valid expiry date.");
            return;
        }

        const selectedDate = new Date(validUntil);
        const minTime = new Date(minDateStr).getTime();
        const maxTime = new Date(maxDateStr).getTime();
        const selTime = selectedDate.getTime();

        if (selTime < minTime || selTime > maxTime) {
            setError(`Expiry date must be between ${MANDATE_MIN_VALIDITY_DAYS} and ${MANDATE_MAX_VALIDITY_DAYS} days from today.`);
            return;
        }

        try {
            setIsSubmitting(true);
            await onCreate({ amount: amountNum, validUntil });
            onOpenChange(false);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to create mandate";
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="border border-border bg-surface text-foreground sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
                        Create Payment Mandate
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted">
                        Authorize recurring purchases within safe budget and validity limits.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    {/* Amount Input */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="mandate-amount" className="text-xs font-medium text-foreground">
                                Authorization Amount (₹)
                            </Label>
                            <span className="text-[11px] text-muted">
                                Min: ₹{MANDATE_MIN_AMOUNT} · Max: ₹{MANDATE_MAX_AMOUNT.toLocaleString("en-IN")}
                            </span>
                        </div>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted font-medium">
                                ₹
                            </span>
                            <Input
                                id="mandate-amount"
                                type="number"
                                min={MANDATE_MIN_AMOUNT}
                                max={MANDATE_MAX_AMOUNT}
                                step={100}
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="pl-7 bg-surface border-border text-foreground focus-visible:border-accent"
                                placeholder="5000"
                            />
                        </div>
                    </div>

                    {/* Valid Until Input */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="mandate-date" className="text-xs font-medium text-foreground">
                                Valid Until
                            </Label>
                            <span className="text-[11px] text-muted">
                                {MANDATE_MIN_VALIDITY_DAYS} to {MANDATE_MAX_VALIDITY_DAYS} days from today
                            </span>
                        </div>
                        <Input
                            id="mandate-date"
                            type="date"
                            min={minDateStr}
                            max={maxDateStr}
                            required
                            value={validUntil}
                            onChange={(e) => setValidUntil(e.target.value)}
                            className="bg-surface border-border text-foreground"
                        />
                    </div>

                    {/* Error Notice */}
                    {error && (
                        <div className="rounded-lg border border-error/30 bg-error/10 p-2.5 text-xs text-error">
                            {error}
                        </div>
                    )}

                    <DialogFooter className="pt-2 gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl border border-border text-xs text-foreground hover:bg-hover"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-xl bg-brand text-white hover:bg-brand/90 text-xs shadow-xs"
                        >
                            {isSubmitting ? "Authorizing..." : "Authorize Mandate"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
