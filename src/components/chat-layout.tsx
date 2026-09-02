"use client";

import React, { useState, useRef, useEffect } from "react";
import { AppSidebar, type ActiveView } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { WelcomeScreen } from "@/components/welcome-screen";
import { ChatMessage, type ChatMessageItem } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
import { OrdersView } from "@/components/orders-view";

import { MandatesView } from "@/components/mandates-view";
import { ArrowDown } from "lucide-react";

export function ChatLayout() {
    const [activeView, setActiveView] = useState<ActiveView>("chat");
    const [messages, setMessages] = useState<ChatMessageItem[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [showScrollBottom, setShowScrollBottom] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 120;
        setShowScrollBottom(!isNearBottom);
    };

    useEffect(() => {
        if (activeView === "chat" && messages.length > 0) {
            scrollToBottom();
        }
    }, [messages, activeView]);

    const handleSendMessage = (textToSend?: string) => {
        const text = (textToSend !== undefined ? textToSend : inputValue).trim();
        if (!text) return;

        const userMsg: ChatMessageItem = {
            id: `user-${Date.now()}`,
            role: "user",
            content: text,
        };

        const mockAssistantMsg: ChatMessageItem = {
            id: `asst-${Date.now() + 1}`,
            role: "assistant",
            content: "Sure! I'll help you find the best options based on your requirements.",
        };

        setMessages((prev) => [...prev, userMsg, mockAssistantMsg]);
        setInputValue("");
        setActiveView("chat");
    };

    const handleSelectSuggestion = (suggestion: string) => {
        handleSendMessage(suggestion);
    };

    const handleSelectSidebarChat = (chatTitle: string) => {
        // Switch to a simulated mock conversation for the selected chat
        const userMsg: ChatMessageItem = {
            id: `user-${Date.now()}`,
            role: "user",
            content: chatTitle,
        };
        const assistantMsg: ChatMessageItem = {
            id: `asst-${Date.now() + 1}`,
            role: "assistant",
            content: `I've pulled up your search for "${chatTitle}". Let me know what specific filters or recommendations you'd like to explore!`,
        };
        setMessages([userMsg, assistantMsg]);
        setActiveView("chat");
    };

    return (
        <SidebarProvider defaultOpen={true}>
            <div className="flex h-screen w-full overflow-hidden bg-main text-foreground">
                {/* Vertical Sidebar */}
                <AppSidebar
                    activeView={activeView}
                    onSelectView={setActiveView}
                    onSelectChat={handleSelectSidebarChat}
                    onNewChat={() => {
                        setMessages([]);
                        setActiveView("chat");
                    }}
                />

                {/* Main Application Area */}
                <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden bg-main">
                    {/* Top Bar with Sidebar Trigger & Theme Toggle */}
                    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between px-4">
                        <div className="flex items-center gap-2">
                            <SidebarTrigger className="text-muted hover:text-foreground" />
                        </div>
                        <div className="flex items-center gap-2">
                            <ThemeToggle />

                        </div>
                    </header>

                    {/* View Switcher: Orders, Mandates, or Chat */}
                    {activeView === "orders" ? (
                        <OrdersView />
                    ) : activeView === "mandates" ? (
                        <MandatesView />
                    ) : (
                        /* Chat Body */
                        <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
                            {messages.length === 0 ? (
                                <div className="flex flex-1 flex-col overflow-y-auto">
                                    <WelcomeScreen onSelectSuggestion={handleSelectSuggestion} />
                                </div>
                            ) : (
                                <div
                                    ref={scrollContainerRef}
                                    onScroll={handleScroll}
                                    className="flex-1 overflow-y-auto px-4 pt-4 pb-36 scroll-smooth"
                                >
                                    <div className="mx-auto flex max-w-3xl flex-col space-y-6">
                                        {messages.map((msg) => (
                                            <ChatMessage key={msg.id} message={msg} />
                                        ))}
                                        <div ref={messagesEndRef} className="h-2" />
                                    </div>
                                </div>
                            )}

                            {/* Floating Scroll-To-Bottom Arrow Button */}
                            {showScrollBottom && messages.length > 0 && (
                                <button
                                    onClick={scrollToBottom}
                                    className="absolute bottom-28 left-1/2 -translate-x-1/2 z-40 flex size-8 items-center justify-center rounded-full border border-border bg-surface text-muted shadow-md transition-all hover:bg-hover hover:text-foreground"
                                    aria-label="Scroll to bottom"
                                >
                                    <ArrowDown className="size-4" />
                                </button>
                            )}

                            {/* Floating Floating Input Bar Floating Above Messages */}
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-main via-main/95 to-transparent pt-10 pb-4">
                                <div className="pointer-events-auto">
                                    <ChatInput
                                        value={inputValue}
                                        onChange={setInputValue}
                                        onSubmit={() => handleSendMessage()}
                                    />
                                </div>
                            </div>
                        </main>
                    )}
                </div>
            </div>
        </SidebarProvider>
    );
}
