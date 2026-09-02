"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { SignIn, useAuth } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    const { isLoaded, isSignedIn } = useAuth();
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            router.replace("/");
        }
    }, [isLoaded, isSignedIn, router]);

    const isDark = mounted && resolvedTheme === "dark";
    const logoSrc = isDark
        ? "/Arbell-Dark.png"
        : "/Arbell-Light.png";

    console.log("isLoaded:", isLoaded);
    console.log("isSignedIn:", isSignedIn);

    // Clerk is still checking the session
    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
            </div>
        );
    }

    // Already signed in
    if (isSignedIn) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <h3>You are Already Signed In. Redirecting.....</h3>
            </div>
        );
    }

    // Not signed in
    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            <div className="flex flex-col gap-4 p-6 md:p-10">
                <div className="flex justify-between gap-2">
                    <a
                        href="#"
                        className="flex items-center gap-2 font-medium"
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
                    </a>

                    <ThemeToggle />
                </div>

                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-sm">
                        <SignIn />
                    </div>
                </div>
            </div>

            <div className="relative hidden bg-main border-l-2 border-dashed lg:block">
                <div
                    className="
                        absolute
                        left-1/2
                        bottom-[18%]
                        -translate-x-1/2
                        w-[45%]
                        h-[8%]
                        rounded-[50%]
                        bg-black/25
                        blur-xl
                    "
                />

                <img
                    src="/ChatLogo.png"
                    alt="Image"
                    className="absolute logo-float inset-0 h-full w-full object-contain dark:brightness-[1] dark:grayscale"
                />
            </div>
        </div>
    );
}