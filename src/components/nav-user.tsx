"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
    LogOut,
    ChevronsUpDown,
    User as UserIcon,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavUser() {
    const { user, isLoaded } = useUser();
    const { signOut } = useClerk();
    const router = useRouter();

    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Clerk is still loading the current user
    if (!isLoaded) {
        return (
            <SidebarMenu>
                <SidebarMenuItem>
                    <div className="flex h-12 items-center gap-3 rounded-lg px-2 py-1.5 animate-pulse">
                        <div className="size-8 rounded-full bg-border/60" />

                        <div className="flex flex-1 flex-col gap-1.5">
                            <div className="h-3 w-20 rounded bg-border/60" />
                            <div className="h-2.5 w-28 rounded bg-border/40" />
                        </div>
                    </div>
                </SidebarMenuItem>
            </SidebarMenu>
        );
    }

    // No authenticated user
    if (!user) {
        return null;
    }

    // Determine the user's display name
    const displayName =
        user.fullName ||
        [user.firstName, user.lastName]
            .filter(Boolean)
            .join(" ") ||
        user.username ||
        "User";

    // Determine the user's email
    const email =
        user.primaryEmailAddress?.emailAddress ||
        user.emailAddresses[0]?.emailAddress ||
        "";

    // Generate initials for the avatar fallback
    const initials =
        displayName
            .split(" ")
            .map((part) => part[0])
            .filter(Boolean)
            .slice(0, 2)
            .join("")
            .toUpperCase() || "U";

    // Logout handler
    const handleSignOut = async () => {
        if (isLoggingOut) return;

        setIsLoggingOut(true);

        try {
            await signOut({
                redirectUrl: "/sign-in",
            });
        } catch (error) {
            console.error("Sign out error:", error);

            // Fallback navigation
            router.push("/sign-in");
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    {/* Profile button */}
                    <DropdownMenuTrigger
                        render={
                            <SidebarMenuButton
                                size="lg"
                                className="w-full gap-3 rounded-lg px-2 py-1.5 text-left text-sm font-normal transition-colors hover:bg-hover hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring"
                                aria-label="Open user profile menu"
                            />
                        }
                    >
                        {/* Avatar */}
                        <Avatar className="size-8 rounded-full border border-border">
                            {user.imageUrl ? (
                                <AvatarImage
                                    src={user.imageUrl}
                                    alt={displayName}
                                />
                            ) : null}

                            <AvatarFallback className="rounded-full bg-surface text-xs font-medium text-foreground">
                                {initials || (
                                    <UserIcon className="size-3.5 text-muted" />
                                )}
                            </AvatarFallback>
                        </Avatar>

                        {/* Name + email */}
                        <div className="grid flex-1 text-left text-xs leading-tight">
                            <span className="truncate font-medium text-foreground">
                                {displayName}
                            </span>

                            {email && (
                                <span className="truncate text-[11px] text-muted">
                                    {email}
                                </span>
                            )}
                        </div>

                        {/* Chevron */}
                        <ChevronsUpDown className="ml-auto size-4 shrink-0 text-muted" />
                    </DropdownMenuTrigger>

                    {/* Dropdown */}
                    <DropdownMenuContent
                        className="w-56 rounded-lg p-1.5 shadow-lg"
                        side="top"
                        align="start"
                        sideOffset={8}
                    >
                        {/* User information */}
                        <div className="flex items-center gap-2.5 px-2 py-1.5 text-left">
                            <Avatar className="size-8 rounded-full border border-border">
                                {user.imageUrl ? (
                                    <AvatarImage
                                        src={user.imageUrl}
                                        alt={displayName}
                                    />
                                ) : null}

                                <AvatarFallback className="rounded-full bg-surface text-xs font-medium text-foreground">
                                    {initials || (
                                        <UserIcon className="size-3.5 text-muted" />
                                    )}
                                </AvatarFallback>
                            </Avatar>

                            <div className="grid flex-1 text-left text-xs leading-tight">
                                <span className="truncate font-semibold text-foreground">
                                    {displayName}
                                </span>

                                {email && (
                                    <span className="truncate text-[11px] text-muted">
                                        {email}
                                    </span>
                                )}
                            </div>
                        </div>

                        <DropdownMenuSeparator className="my-1 bg-border" />

                        {/* Logout */}
                        <DropdownMenuItem
                            onClick={handleSignOut}
                            disabled={isLoggingOut}
                            className="cursor-pointer gap-2 rounded-md px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive"
                            aria-label="Log out of Arbell"
                        >
                            <LogOut className="size-3.5 text-destructive" />

                            <span>
                                {isLoggingOut
                                    ? "Signing out..."
                                    : "Sign out"}
                            </span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}