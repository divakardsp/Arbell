import Image from "next/image";
import { ProductGrid } from "./product-grid";
import type { ProductItemData } from "@/agent/core/events/agent-events";

export interface ChatMessageItem {
    id: string;
    role: "user" | "assistant";
    content: string;
    status?: string;
    isStreaming?: boolean;
    products?: ProductItemData[];
}

interface ChatMessageProps {
    message: ChatMessageItem;
}

export function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.role === "user";

    if (isUser) {
        return (
            <div className="flex w-full justify-end animate-in fade-in-50 slide-in-from-bottom-2 duration-800">
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-accent px-4 py-2.5 text-sm leading-relaxed text-white shadow-xs md:max-w-[70%]">
                    <p className="whitespace-pre-wrap wrap-break-word">{message.content}</p>
                </div>
            </div>
        );
    }

    const hasProducts = message.products && message.products.length > 0;

    return (
        <div className="flex w-full items-start gap-0 sm:gap-3 justify-start animate-in fade-in-50 slide-in-from-bottom-2 duration-200">
            {/* Assistant avatar/logo: hidden on mobile to prevent left-side offset, visible on sm+ desktop */}
            <div className="hidden sm:flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-surface shadow-xs">
                <Image
                    src="/ChatLogo.png"
                    alt="Arbell Assistant"
                    width={20}
                    height={20}
                    className="size-4 object-contain"
                />
            </div>

            <div className={`flex flex-col gap-2 ${hasProducts ? "w-full max-w-full" : "max-w-[85%] sm:max-w-[85%] lg:max-w-[80%]"}`}>
                {/* Text Message Bubble */}
                {(message.content || !hasProducts) && (
                    <div className="rounded-2xl rounded-tl-sm border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-foreground shadow-xs">
                        {message.content ? (
                            <p className="whitespace-pre-wrap wrap-break-word text-foreground">
                                {message.content}
                                {message.isStreaming && (
                                    <span className="inline-block size-1.5 ml-1 animate-pulse rounded-full bg-accent" />
                                )}
                            </p>
                        ) : (
                            <div className="flex items-center gap-2 text-xs text-muted">
                                <div className="size-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                                <span>{message.status || "Thinking..."}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Structured Product Grid UI Event */}
                {hasProducts && (
                    <ProductGrid products={message.products!} />
                )}
            </div>
        </div>
    );
}

