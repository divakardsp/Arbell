import Image from "next/image";
import { cn } from "@/lib/utils";

export interface ChatMessageItem {
    id: string;
    role: "user" | "assistant";
    content: string;
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

    return (
        <div className="flex w-full items-start gap-3 justify-start animate-in fade-in-50 slide-in-from-bottom-2 duration-200">
            {/* Assistant avatar/logo */}
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-surface shadow-xs">
                <Image
                    src="/ChatLogo.png"
                    alt="Arbell Assistant"
                    width={20}
                    height={20}
                    className="size-4 object-contain"
                />
            </div>

            <div className="flex max-w-[85%] flex-col gap-1 md:max-w-[75%]">
                
                <div className="rounded-2xl rounded-tl-sm border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-foreground shadow-xs">
                    <p className="whitespace-pre-wrap wrap-break-word text-foreground">
                        {message.content}
                    </p>
                </div>
            </div>
        </div>
    );
}
