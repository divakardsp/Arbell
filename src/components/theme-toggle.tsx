"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Button
                variant="ghost"
                size="icon-sm"
                className="h-8 w-8 rounded-lg border border-border bg-surface text-muted"
                aria-label="Toggle theme placeholder"
                disabled
            >
                <span className="size-4" />
            </Button>
        );
    }

    const isDark = resolvedTheme === "dark";

    return (
        <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="h-8 w-8 rounded-lg border border-border bg-surface text-foreground transition-colors hover:bg-hover hover:text-foreground"
            aria-label="Toggle theme"
        >
            {isDark ? (
                <Sun className="size-4 text-brand" />
            ) : (
                <Moon className="size-4 text-muted" />
            )}
        </Button>
    );
}
