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

import { sendChatMessage } from "@/lib/sse-chat-client";
import type { ChatSidebarItem } from "@/components/app-sidebar";

export function ChatLayout() {
    const [activeView, setActiveView] = useState<ActiveView>("chat");
    const [messages, setMessages] = useState<ChatMessageItem[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [showScrollBottom, setShowScrollBottom] = useState(false);
    const [chatList, setChatList] = useState<ChatSidebarItem[]>([]);
    const [isLoadingChats, setIsLoadingChats] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const currentSessionIdRef = useRef<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const fetchChatList = async () => {
        try {
            setIsLoadingChats(true);
            const res = await fetch("/api/chat");
            if (res.ok) {
                const json = await res.json();
                if (json.success && json.data?.chat) {
                    setChatList(json.data.chat);
                }
            }
        } catch (err) {
            console.error("Failed to fetch chat list:", err);
        } finally {
            setIsLoadingChats(false);
        }
    };

    useEffect(() => {
        fetchChatList();
    }, []);

    useEffect(() => {
        currentSessionIdRef.current = sessionId;
    }, [sessionId]);

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

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

    const handleSendMessage = async (textToSend?: string) => {
        const text = (textToSend !== undefined ? textToSend : inputValue).trim();
        if (!text || isStreaming) return;

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        const userMsgId = `user-${Date.now()}`;
        const assistantMsgId = `asst-${Date.now() + 1}`;

        const userMsg: ChatMessageItem = {
            id: userMsgId,
            role: "user",
            content: text,
        };

        const assistantMsg: ChatMessageItem = {
            id: assistantMsgId,
            role: "assistant",
            content: "",
            status: "Thinking...",
            isStreaming: true,
        };

        setMessages((prev) => [...prev, userMsg, assistantMsg]);
        setInputValue("");
        setIsStreaming(true);
        setActiveView("chat");

        try {
            await sendChatMessage({
                message: text,
                sessionId: currentSessionIdRef.current,
                signal: abortController.signal,
                onEvent: (event) => {
                    switch (event.type) {
                        case "run_started": {
                            if (event.sessionId) {
                                setSessionId(event.sessionId);
                                currentSessionIdRef.current = event.sessionId;
                            }
                            break;
                        }
                        case "status": {
                            setMessages((prev) =>
                                prev.map((msg) =>
                                    msg.id === assistantMsgId
                                        ? { ...msg, status: event.message }
                                        : msg
                                )
                            );
                            break;
                        }
                        case "tool_started": {
                            setMessages((prev) =>
                                prev.map((msg) =>
                                    msg.id === assistantMsgId
                                        ? {
                                              ...msg,
                                              status:
                                                  event.message ||
                                                  `Executing ${event.toolName}...`,
                                          }
                                        : msg
                                )
                            );
                            break;
                        }
                        case "tool_completed": {
                            break;
                        }
                        case "text_delta": {
                            setMessages((prev) =>
                                prev.map((msg) =>
                                    msg.id === assistantMsgId
                                        ? {
                                              ...msg,
                                              content: msg.content + event.delta,
                                              status: undefined,
                                          }
                                        : msg
                                )
                            );
                            break;
                        }
                        case "run_completed": {
                            setMessages((prev) =>
                                prev.map((msg) =>
                                    msg.id === assistantMsgId
                                        ? {
                                              ...msg,
                                              content: event.response || msg.content,
                                              status: undefined,
                                              isStreaming: false,
                                          }
                                        : msg
                                )
                            );
                            fetchChatList();
                            break;
                        }
                        case "error": {
                            setMessages((prev) =>
                                prev.map((msg) =>
                                    msg.id === assistantMsgId
                                        ? {
                                              ...msg,
                                              content:
                                                  msg.content.trim() !== ""
                                                      ? `${msg.content}\n\n⚠️ ${event.message}`
                                                      : `⚠️ ${event.message}`,
                                              status: undefined,
                                              isStreaming: false,
                                          }
                                        : msg
                                )
                            );
                            fetchChatList();
                            break;
                        }
                    }
                },
            });
        } catch (err: any) {
            if (err.name === "AbortError") {
                return;
            }
            console.error("[ChatLayout] Error executing chat turn:", err);
            const errorMessage =
                err?.message ||
                "Failed to communicate with assistant. Please try again.";
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === assistantMsgId
                        ? {
                              ...msg,
                              content:
                                  msg.content.trim() !== ""
                                      ? `${msg.content}\n\n⚠️ ${errorMessage}`
                                      : `⚠️ ${errorMessage}`,
                              status: undefined,
                              isStreaming: false,
                          }
                        : msg
                )
            );
        } finally {
            setIsStreaming(false);
            if (abortControllerRef.current === abortController) {
                abortControllerRef.current = null;
            }
        }
    };

    const handleSelectSuggestion = (suggestion: string) => {
        handleSendMessage(suggestion);
    };

    const handleSelectSidebarChat = async (selectedSessionId: string) => {
        if (selectedSessionId === sessionId && messages.length > 0) return;

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsStreaming(false);
        setSessionId(selectedSessionId);
        currentSessionIdRef.current = selectedSessionId;
        setActiveView("chat");
        setIsLoadingMessages(true);

        try {
            const res = await fetch(`/api/chat/${selectedSessionId}`);
            if (res.ok) {
                const json = await res.json();
                if (json.success && json.data?.messages) {
                    const mapped: ChatMessageItem[] = json.data.messages.map(
                        (
                            m: { role: "user" | "assistant"; content: string },
                            index: number
                        ) => ({
                            id: `${m.role}-${index}-${selectedSessionId}`,
                            role: m.role,
                            content: m.content,
                        })
                    );
                    setMessages(mapped);
                } else {
                    setMessages([]);
                }
            }
        } catch (err) {
            console.error("Failed to load session messages:", err);
        } finally {
            setIsLoadingMessages(false);
        }
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
                        if (abortControllerRef.current) {
                            abortControllerRef.current.abort();
                            abortControllerRef.current = null;
                        }
                        setSessionId(null);
                        currentSessionIdRef.current = null;
                        setIsStreaming(false);
                        setIsLoadingMessages(false);
                        setMessages([]);
                        setActiveView("chat");
                    }}
                    activeSessionId={sessionId}
                    chats={chatList}
                    isLoadingChats={isLoadingChats}
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
                            {isLoadingMessages ? (
                                <div className="flex flex-1 items-center justify-center">
                                    <div className="flex flex-col items-center gap-2.5 text-muted">
                                        <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                                        <p className="text-xs text-muted">Loading conversation...</p>
                                    </div>
                                </div>
                            ) : messages.length === 0 ? (
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
                            {showScrollBottom && messages.length > 0 && !isLoadingMessages && (
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
                                        disabled={isStreaming}
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
