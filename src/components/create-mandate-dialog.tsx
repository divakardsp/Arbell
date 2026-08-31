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

interface CreateMandateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreate: (data: { amount: string; validUntil: string }) => void;
}

export function CreateMandateDialog({
    open,
    onOpenChange,
    onCreate,
}: CreateMandateDialogProps) {
    const today = new Date();
    
    // Min 5 days from today
    const minDate = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);
    const minDateStr = minDate.toISOString().split("T")[0];

    // Max 30 days from today
    const maxDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const maxDateStr = maxDate.toISOString().split("T")[0];

    const [amount, setAmount] = useState<string>("5000");
    const [validUntil, setValidUntil] = useState<string>(minDateStr);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const amountNum = Number(amount);
        if (isNaN(amountNum) || amountNum < 500 || amountNum > 15000) {
            setError("Amount must be between ₹500 and ₹15,000 INR.");
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
            setError("Expiry date must be between 5 and 30 days from today.");
            return;
        }

        const formattedAmount = `₹${amountNum.toLocaleString("en-IN")}`;
        onCreate({ amount: formattedAmount, validUntil });
        onOpenChange(false);
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
                                Min: ₹500 · Max: ₹15,000
                            </span>
                        </div>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted font-medium">
                                ₹
                            </span>
                            <Input
                                id="mandate-amount"
                                type="number"
                                min={500}
                                max={15000}
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
                                5 to 30 days from today
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
                            className="rounded-xl bg-brand text-white hover:bg-brand/90 text-xs shadow-xs"
                        >
                            Authorize Mandate
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
