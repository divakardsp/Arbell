"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarSeparator,
} from "@/components/ui/sidebar";
import { Package, FileText, MessageSquare, Plus } from "lucide-react";
import { NavUser } from "@/components/nav-user";

export type ActiveView = "chat" | "orders" | "mandates";

export interface ChatSidebarItem {
    sessionId: string;
    title: string;
    createdAt?: Date | string;
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    activeView?: ActiveView;
    onSelectView?: (view: ActiveView) => void;
    onSelectChat?: (sessionId: string) => void;
    onNewChat?: () => void;
    activeSessionId?: string | null;
    chats?: ChatSidebarItem[];
    isLoadingChats?: boolean;
}

export function AppSidebar({
    activeView = "chat",
    onSelectView,
    onSelectChat,
    onNewChat,
    activeSessionId,
    chats = [],
    isLoadingChats = false,
    ...props
}: AppSidebarProps) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Select logo based on theme; fallback gracefully prior to hydration
    const isDark = mounted && resolvedTheme === "dark";
    const logoSrc = isDark ? "/Arbell-Dark.png" : "/Arbell-Light.png";

    return (
        <Sidebar className="border-r border-border bg-sidebar" {...props}>
            {/* Top Logo */}
            <SidebarHeader className="px-4 py-4">
                <div
                    onClick={() => {
                        onSelectView?.("chat");
                        onNewChat?.();
                    }}
                    className="flex h-9 items-center cursor-pointer"
                >
                    {mounted ? (
                        <img
                            src={logoSrc}
                            alt="Arbell"
                            width={110}
                            height={32}
                            className="h-8 w-auto object-contain"
                        />
                    ) : (
                        <div className="h-8 w-24 animate-pulse rounded bg-border/40" />
                    )}
                </div>
            </SidebarHeader>

            <SidebarSeparator className="mx-3 h-px bg-border" />

            <SidebarContent className="flex flex-1 flex-col overflow-hidden px-2 py-3">
                {/* 1. Orders & 2. Your Mandates (Fixed) */}
                <SidebarGroup className="shrink-0 p-0">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    isActive={activeView === "orders"}
                                    onClick={() => onSelectView?.("orders")}
                                    className={`gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${activeView === "orders"
                                            ? "bg-active text-accent font-semibold"
                                            : "text-foreground hover:bg-hover hover:text-foreground"
                                        }`}
                                >
                                    <Package className={`size-4 ${activeView === "orders" ? "text-accent" : "text-muted"}`} />
                                    <span>Orders</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    isActive={activeView === "mandates"}
                                    onClick={() => onSelectView?.("mandates")}
                                    className={`gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${activeView === "mandates"
                                            ? "bg-active text-accent font-semibold"
                                            : "text-foreground hover:bg-hover hover:text-foreground"
                                        }`}
                                >
                                    <FileText className={`size-4 ${activeView === "mandates" ? "text-accent" : "text-muted"}`} />
                                    <span>Your Mandate</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* New Chat Button (Fixed) */}
                <SidebarGroup className="shrink-0 mt-3 p-0">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    onClick={() => {
                                        onSelectView?.("chat");
                                        onNewChat?.();
                                    }}
                                    className="gap-2.5 rounded-lg border border-border/80 bg-surface/80 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-hover hover:text-foreground cursor-pointer shadow-xs"
                                >
                                    <Plus className="size-4 text-muted" />
                                    <span>New Chat</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* 3. Your Chats (Only this section scrolls vertically) */}
                <SidebarGroup className="flex flex-1 min-h-0 flex-col mt-3 p-0">
                    <SidebarGroupLabel className="shrink-0 px-3 text-xs font-medium tracking-wide text-muted">
                        Your Chats
                    </SidebarGroupLabel>
                    <SidebarGroupContent className="mt-1 flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1 scroll-smooth">
                        {isLoadingChats ? (
                            <div className="flex flex-col gap-1.5 px-2 py-1">
                                <div className="h-7 w-full animate-pulse rounded-lg bg-border/60" />
                                <div className="h-7 w-full animate-pulse rounded-lg bg-border/50" />
                                <div className="h-7 w-full animate-pulse rounded-lg bg-border/40" />
                                <div className="h-7 w-full animate-pulse rounded-lg bg-border/35" />
                                <div className="h-7 w-full animate-pulse rounded-lg bg-border/30" />
                                <div className="h-7 w-full animate-pulse rounded-lg bg-border/25" />
                                <div className="h-7 w-full animate-pulse rounded-lg bg-border/20" />
                                <div className="h-7 w-full animate-pulse rounded-lg bg-border/15" />
                                <div className="h-7 w-full animate-pulse rounded-lg bg-border/5" />
                            </div>
                        ) : chats.length === 0 ? (
                            <p className="px-3 py-2 text-xs text-muted">No chats yet</p>
                        ) : (
                            <SidebarMenu>
                                {chats.map((chat) => {
                                    const isSelected = activeSessionId === chat.sessionId;
                                    return (
                                        <SidebarMenuItem key={chat.sessionId}>
                                            <SidebarMenuButton
                                                isActive={isSelected}
                                                onClick={() => {
                                                    onSelectView?.("chat");
                                                    onSelectChat?.(chat.sessionId);
                                                }}
                                                className={`group/chat-item flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                                                    isSelected
                                                        ? "bg-active text-accent font-semibold"
                                                        : "text-foreground/90 hover:bg-hover hover:text-foreground"
                                                }`}
                                            >
                                                <MessageSquare
                                                    className={`size-3.5 shrink-0 ${
                                                        isSelected
                                                            ? "text-accent"
                                                            : "text-muted group-hover/chat-item:text-foreground"
                                                    }`}
                                                />
                                                <span className="truncate">{chat.title || "New Chat"}</span>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        )}
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarSeparator className="mx-3 h-px bg-border" />

            {/* Bottom Profile / Logout Section */}
            <SidebarFooter className="p-2">
                <NavUser />
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}
