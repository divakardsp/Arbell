"use client";

import React, { useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    disabled?: boolean;
    placeholder?: string;
}

export function ChatInput({
    value,
    onChange,
    onSubmit,
    disabled = false,
    placeholder = "Tell me I`ll Find the best Product for you?",
}: ChatInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isSendDisabled = disabled || !value.trim();

    // Auto-resize textarea based on content
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
        }
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!isSendDisabled) {
                onSubmit();
            }
        }
    };

    return (
        <div className="relative mx-auto w-full max-w-3xl px-4">
            <div className="relative flex items-end rounded-2xl border border-border bg-surface/95 backdrop-blur-md p-2 shadow-lg transition-all focus-within:border-border">
                <textarea
                    ref={textareaRef}
                    value={value}
                    rows={1}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="max-h-40 min-h-[2.5rem] flex-1 bg-transparent resize-none px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted"
                />

                <Button
                    type="button"
                    size="icon-sm"
                    disabled={isSendDisabled}
                    onClick={onSubmit}
                    className={`ml-2 mb-0.5 size-8 shrink-0 rounded-xl transition-all duration-150 ${
                        isSendDisabled
                            ? "bg-hover text-muted cursor-not-allowed opacity-60"
                            : "bg-brand text-white hover:bg-brand/90 shadow-xs"
                    }`}
                    aria-label="Send message"
                >
                    <ArrowUp className="size-4 stroke-[2.5]" />
                </Button>
            </div>
            <p className="mt-2 text-center text-[11px] text-muted">
                Arbell is your end to end shopping assistant.
            </p>
        </div>
    );
}
