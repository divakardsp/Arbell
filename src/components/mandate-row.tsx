"use client";

import { useState } from "react";
import { type MockMandate } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";

interface MandateRowProps {
    serialNumber: number;
    mandate: MockMandate;
    onRevoke?: (id: string) => void;
}

export function MandateRow({ serialNumber, mandate, onRevoke }: MandateRowProps) {
    const [revoked, setRevoked] = useState(false);

    const handleRevokeClick = () => {
        setRevoked(true);
        onRevoke?.(mandate.id);
    };

    return (
        <TableRow className="border-border/60 hover:bg-hover/40">
            {/* Serial Number */}
            <TableCell className="w-12 px-4 py-3.5 text-xs sm:text-sm font-medium text-foreground">
                {serialNumber}
            </TableCell>

            {/* Amount Authorized */}
            <TableCell className="px-4 py-3.5 text-xs sm:text-sm font-semibold text-foreground">
                {mandate.amountAuthorized}
            </TableCell>

            {/* Amount Remaining */}
            <TableCell className="px-4 py-3.5 text-xs sm:text-sm font-medium text-foreground/85">
                {mandate.amountRemaining}
            </TableCell>

            {/* Created On */}
            <TableCell className="px-4 py-3.5 text-xs sm:text-sm text-muted">
                {mandate.createdAt || "—"}
            </TableCell>

            {/* Valid Until */}
            <TableCell className="px-4 py-3.5 text-xs sm:text-sm text-muted">
                {mandate.validUntil || "—"}
            </TableCell>

            {/* Revoke Button */}
            <TableCell className="px-4 py-3.5 text-right">
                {revoked ? (
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
                        onClick={handleRevokeClick}
                        className="rounded-lg border border-border bg-surface text-xs font-medium text-error hover:bg-error/10 hover:border-error/30 hover:text-error transition-colors"
                    >
                        Revoke
                    </Button>
                )}
            </TableCell>
        </TableRow>
    );
}
