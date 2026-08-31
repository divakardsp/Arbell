"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
    Sidebar,
    SidebarContent,
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
import { Package, FileText, MessageSquare } from "lucide-react";

export type ActiveView = "chat" | "orders" | "mandates";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    activeView?: ActiveView;
    onSelectView?: (view: ActiveView) => void;
    onSelectChat?: (title: string) => void;
    onNewChat?: () => void;
}

const mockChats = [
    "MacBook for development",
    "Best headphones under ₹20k",
    "Birthday gift ideas",
    "Running shoes",
    "Gaming laptop",
];

export function AppSidebar({
    activeView = "chat",
    onSelectView,
    onSelectChat,
    onNewChat,
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

            <SidebarContent className="px-2 py-3">
                {/* 1. Orders & 2. Your Mandates */}
                <SidebarGroup className="p-0">
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

                {/* 3. Your Chats */}
                <SidebarGroup className="mt-4 p-0">
                    <SidebarGroupLabel className="px-3 text-xs font-medium tracking-wide text-muted">
                        Your Chats
                    </SidebarGroupLabel>
                    <SidebarGroupContent className="mt-1">
                        <SidebarMenu>
                            {mockChats.map((chatTitle, index) => (
                                <SidebarMenuItem key={index}>
                                    <SidebarMenuButton
                                        onClick={() => {
                                            onSelectView?.("chat");
                                            onSelectChat?.(chatTitle);
                                        }}
                                        className="group/chat-item flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground/90 transition-colors hover:bg-hover hover:text-foreground"
                                    >
                                        <MessageSquare className="size-3.5 shrink-0 text-muted group-hover/chat-item:text-foreground" />
                                        <span className="truncate">{chatTitle}</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarRail />
        </Sidebar>
    );
}
