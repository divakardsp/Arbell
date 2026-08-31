"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface WelcomeScreenProps {
    onSelectSuggestion: (text: string) => void;
}

const suggestions = [
    "Find me a MacBook under ₹1 lakh",
    "Best noise cancelling headphones",
    "Running shoes for daily marathon training",
    "Birthday gift ideas under ₹5,000",
];

export function WelcomeScreen({ onSelectSuggestion }: WelcomeScreenProps) {
    return (
        <div className="flex flex-1 flex-col items-center justify-center px-4 pt-8 pb-32 text-center animate-in fade-in-50 duration-300">
            {/* Center Logo */}
            <div className="mb-6 flex items-center justify-center">
                <Image
                    src="/ChatLogo.png"
                    alt="Arbell"
                    width={72}
                    height={72}
                    priority
                    className="size-16 md:size-20 object-contain drop-shadow-md"
                />
            </div>

            {/* Casual / Greeting Message */}
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                How are you?
            </h1>
            <p className="mt-2 text-base text-muted sm:text-lg">
                What are you looking to buy today?
            </p>

            {/* Quick Suggestion Chips */}
            <div className="mt-8 flex w-full max-w-xl flex-col gap-2 sm:grid sm:grid-cols-2">
                {suggestions.map((item, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={() => onSelectSuggestion(item)}
                        className="group flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-left text-sm text-foreground transition-all duration-150 hover:border-accent/40 hover:bg-hover hover:shadow-xs"
                    >
                        <span className="truncate pr-2">{item}</span>
                        <ArrowRight className="size-3.5 shrink-0 text-muted opacity-0 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-accent group-hover:opacity-100" />
                    </button>
                ))}
            </div>
        </div>
    );
}
