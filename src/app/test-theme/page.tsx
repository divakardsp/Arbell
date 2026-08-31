"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export default function DesignSystemPage() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <main className="min-h-screen bg-main text-foreground">
            {/* =====================================================
                HEADER
            ====================================================== */}

            <header className="sticky top-0 z-50 border-b border-border bg-main/90 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Arbell Design System
                        </h1>

                        <p className="mt-1 text-sm text-muted">
                            Light / Dark theme preview
                        </p>
                    </div>


                    {/* Theme Toggle */}

                    {mounted ? (
                        <button
                            type="button"
                            onClick={() =>
                                setTheme(
                                    theme === "dark"
                                        ? "light"
                                        : "dark"
                                )
                            }
                            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-hover"
                        >
                            <span className="text-base">
                                {theme === "dark" ? "☀️" : "🌙"}
                            </span>

                            <span>
                                {theme === "dark"
                                    ? "Light"
                                    : "Dark"}
                            </span>
                        </button>
                    ) : (
                        <div className="h-10 w-24 rounded-lg border border-border bg-surface" />
                    )}

                </div>
            </header>


            {/* =====================================================
                CONTENT
            ====================================================== */}

            <div className="mx-auto max-w-7xl space-y-16 px-6 py-10">

                {/* =====================================================
                    BRAND
                ====================================================== */}

                <section>

                    <SectionTitle
                        title="Brand"
                        description="Arbell brand colors."
                    />

                    <div className="grid gap-4 md:grid-cols-2">

                        <ColorCard
                            name="Brand"
                            variable="--brand"
                            className="bg-brand"
                            textClassName="text-white"
                        />

                        <ColorCard
                            name="Brand Cream"
                            variable="--brand-cream"
                            className="bg-brand-cream"
                            textClassName="text-foreground"
                            border
                        />

                    </div>

                </section>


                {/* =====================================================
                    BACKGROUNDS
                ====================================================== */}

                <section>

                    <SectionTitle
                        title="Backgrounds"
                        description="Primary application backgrounds and surfaces."
                    />

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                        <ColorCard
                            name="Main"
                            variable="--main"
                            className="bg-main"
                            border
                        />

                        <ColorCard
                            name="Sidebar"
                            variable="--sidebar"
                            className="bg-sidebar"
                            border
                        />

                        <ColorCard
                            name="Surface"
                            variable="--surface"
                            className="bg-surface"
                            border
                        />

                        <ColorCard
                            name="Input"
                            variable="--input"
                            className="bg-input"
                            border
                        />

                        <ColorCard
                            name="Hover"
                            variable="--hover"
                            className="bg-hover"
                            border
                        />

                        <ColorCard
                            name="Active"
                            variable="--active"
                            className="bg-active"
                            border
                        />

                    </div>

                </section>


                {/* =====================================================
                    TEXT
                ====================================================== */}

                <section>

                    <SectionTitle
                        title="Typography Colors"
                        description="Text hierarchy used throughout Arbell."
                    />

                    <div className="space-y-4">

                        <div className="rounded-xl border border-border bg-surface p-6">

                            <p className="text-xs uppercase tracking-wider text-muted">
                                Foreground
                            </p>

                            <p className="mt-3 text-3xl font-semibold text-foreground">
                                Primary foreground text
                            </p>

                            <p className="mt-2 font-mono text-sm text-muted">
                                var(--foreground)
                            </p>

                        </div>


                        <div className="rounded-xl border border-border bg-surface p-6">

                            <p className="text-xs uppercase tracking-wider text-muted">
                                Muted
                            </p>

                            <p className="mt-3 text-lg text-muted">
                                Secondary and supporting text
                            </p>

                            <p className="mt-2 font-mono text-sm text-muted">
                                var(--muted)
                            </p>

                        </div>

                    </div>

                </section>


                {/* =====================================================
                    BORDER
                ====================================================== */}

                <section>

                    <SectionTitle
                        title="Borders"
                        description="Border colors used across the interface."
                    />

                    <div className="grid gap-4 md:grid-cols-2">

                        <div className="rounded-xl border-2 border-border bg-surface p-6">

                            <p className="font-medium">
                                Default Border
                            </p>

                            <p className="mt-2 font-mono text-sm text-muted">
                                var(--border)
                            </p>

                        </div>


                        <div className="rounded-xl border-2 border-accent bg-surface p-6">

                            <p className="font-medium">
                                Accent Border
                            </p>

                            <p className="mt-2 font-mono text-sm text-muted">
                                var(--accent)
                            </p>

                        </div>

                    </div>

                </section>


                {/* =====================================================
                    ACCENT
                ====================================================== */}

                <section>

                    <SectionTitle
                        title="Accent & CTA"
                        description="Arbell's primary action colors."
                    />

                    <div className="grid gap-4 md:grid-cols-2">

                        <ColorCard
                            name="Accent"
                            variable="--accent"
                            className="bg-accent"
                            textClassName="text-white"
                        />

                        <ColorCard
                            name="CTA"
                            variable="--cta"
                            className="bg-cta"
                            textClassName="text-foreground"
                            border
                        />

                    </div>

                </section>


                {/* =====================================================
                    SEMANTIC COLORS
                ====================================================== */}

                <section>

                    <SectionTitle
                        title="Semantic Colors"
                        description="Colors representing application states."
                    />

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                        <SemanticCard
                            name="Success"
                            variable="--success"
                            className="bg-success"
                        />

                        <SemanticCard
                            name="Warning"
                            variable="--warning"
                            className="bg-warning"
                        />

                        <SemanticCard
                            name="Error"
                            variable="--error"
                            className="bg-error"
                        />

                        <SemanticCard
                            name="Info"
                            variable="--info"
                            className="bg-info"
                        />

                    </div>

                </section>


                {/* =====================================================
                    BUTTONS
                ====================================================== */}

                <section>

                    <SectionTitle
                        title="Buttons"
                        description="Basic button treatments."
                    />

                    <div className="flex flex-wrap gap-3">

                        <button className="rounded-lg bg-accent px-5 py-2.5 font-medium text-white transition-colors hover:opacity-90">
                            Primary
                        </button>

                        <button className="rounded-lg border border-border bg-surface px-5 py-2.5 font-medium text-foreground transition-colors hover:bg-hover">
                            Secondary
                        </button>

                        <button className="rounded-lg px-5 py-2.5 font-medium text-foreground transition-colors hover:bg-hover">
                            Ghost
                        </button>

                        <button className="rounded-lg bg-success px-5 py-2.5 font-medium text-white">
                            Success
                        </button>

                        <button className="rounded-lg bg-warning px-5 py-2.5 font-medium text-white">
                            Warning
                        </button>

                        <button className="rounded-lg bg-error px-5 py-2.5 font-medium text-white">
                            Error
                        </button>

                    </div>

                </section>


                {/* =====================================================
                    INPUTS
                ====================================================== */}

                <section>

                    <SectionTitle
                        title="Inputs"
                        description="Inputs using the Arbell theme."
                    />

                    <div className="max-w-xl space-y-4">

                        <input
                            type="text"
                            placeholder="What are you looking for?"
                            className="w-full rounded-xl border border-border bg-input px-4 py-3 text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
                        />

                        <textarea
                            placeholder="Tell Arbell what you need..."
                            rows={4}
                            className="w-full resize-none rounded-xl border border-border bg-input px-4 py-3 text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
                        />

                    </div>

                </section>


                {/* =====================================================
                    CHAT
                ====================================================== */}

                <section>

                    <SectionTitle
                        title="Chat"
                        description="Example of Arbell's conversation interface."
                    />

                    <div className="rounded-2xl border border-border bg-surface p-6">

                        {/* User */}

                        <div className="flex justify-end">

                            <div className="max-w-md rounded-2xl rounded-br-md bg-accent px-5 py-3 text-white">
                                Find me a MacBook under ₹1 lakh.
                            </div>

                        </div>


                        {/* Assistant */}

                        <div className="mt-6 max-w-xl">

                            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
                                Arbell
                            </p>

                            <p className="leading-7 text-foreground">
                                I found several MacBook options under your
                                budget. I'm checking availability and comparing
                                the specifications now.
                            </p>

                        </div>


                        {/* Agent Events */}

                        <div className="mt-6 rounded-xl border border-border bg-main p-4">

                            <p className="mb-3 text-sm font-medium">
                                Arbell is working
                            </p>

                            <div className="space-y-2 text-sm">

                                <div className="flex items-center gap-2 text-success">
                                    <span>✓</span>
                                    <span>
                                        Searching products
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 text-success">
                                    <span>✓</span>
                                    <span>
                                        Filtering by price
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 text-accent">
                                    <span>●</span>
                                    <span>
                                        Checking availability...
                                    </span>
                                </div>

                            </div>

                        </div>

                    </div>

                </section>


                {/* =====================================================
                    SIDEBAR
                ====================================================== */}

                <section>

                    <SectionTitle
                        title="Sidebar"
                        description="Preview of the Arbell application sidebar."
                    />

                    <div className="max-w-sm overflow-hidden rounded-2xl border border-border bg-sidebar">

                        {/* Logo */}

                        <div className="border-b border-border p-5">
                            <div className="flex items-center">
                                <img
                                    src="/Arbell-Dark.png"
                                    alt="Arbell"
                                    className="h-10 w-auto object-contain"
                                />
                            </div>
                        </div>


                        {/* Navigation */}

                        <div className="p-3">

                            <button className="flex w-full items-center gap-3 rounded-lg bg-active px-3 py-2.5 text-sm font-medium text-accent">
                                <span>🛍</span>
                                Orders
                            </button>

                            <button className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-hover">
                                <span>＋</span>
                                New Chat
                            </button>

                        </div>


                        {/* Chats */}

                        <div className="px-3 pb-4">

                            <p className="px-3 py-2 text-xs font-medium tracking-wider text-muted">
                                CHATS
                            </p>

                            <button className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-hover">
                                MacBook for work
                            </button>

                            <button className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-hover">
                                Birthday gift
                            </button>

                            <button className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-hover">
                                Running shoes
                            </button>

                        </div>


                        {/* Profile */}

                        <div className="border-t border-border p-3">

                            <div className="flex items-center justify-between rounded-lg p-3 hover:bg-hover">

                                <div>

                                    <p className="text-sm font-medium">
                                        Divakar
                                    </p>

                                    <p className="text-xs text-muted">
                                        Profile
                                    </p>

                                </div>

                                <span className="text-muted">
                                    ⋮
                                </span>

                            </div>

                        </div>

                    </div>

                </section>


                {/* =====================================================
                    ORDERS
                ====================================================== */}

                <section>

                    <SectionTitle
                        title="Order Status"
                        description="Semantic colors inside an Arbell order."
                    />

                    <div className="grid gap-4 md:grid-cols-2">

                        <OrderCard
                            title="MacBook Air M4"
                            status="Preparing for shipment"
                            statusClass="bg-warning/15 text-warning"
                        />

                        <OrderCard
                            title="Sony WH-1000XM6"
                            status="Delivered"
                            statusClass="bg-success/15 text-success"
                        />

                        <OrderCard
                            title="Mechanical Keyboard"
                            status="Payment failed"
                            statusClass="bg-error/15 text-error"
                        />

                        <OrderCard
                            title="iPhone Case"
                            status="Order confirmed"
                            statusClass="bg-info/15 text-info"
                        />

                    </div>

                </section>


                {/* =====================================================
                    PALETTE SUMMARY
                ====================================================== */}

                <section className="pb-20">

                    <SectionTitle
                        title="Core Arbell Palette"
                        description="The colors you will use most frequently."
                    />

                    <div className="overflow-hidden rounded-xl border border-border">

                        <ColorRow
                            name="Main"
                            variable="--main"
                            className="bg-main"
                        />

                        <ColorRow
                            name="Sidebar"
                            variable="--sidebar"
                            className="bg-sidebar"
                        />

                        <ColorRow
                            name="Surface"
                            variable="--surface"
                            className="bg-surface"
                        />

                        <ColorRow
                            name="Foreground"
                            variable="--foreground"
                            className="bg-foreground"
                            textClassName="text-background"
                        />

                        <ColorRow
                            name="Muted"
                            variable="--muted"
                            className="bg-muted"
                            textClassName="text-white"
                        />

                        <ColorRow
                            name="Border"
                            variable="--border"
                            className="bg-border"
                        />

                        <ColorRow
                            name="Accent"
                            variable="--accent"
                            className="bg-accent"
                            textClassName="text-white"
                        />

                        <ColorRow
                            name="CTA"
                            variable="--cta"
                            className="bg-cta"
                        />

                    </div>

                </section>

            </div>
        </main>
    );
}


/* =========================================================
   HELPER COMPONENTS
   ====================================================== */

function SectionTitle({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="mb-6">

            <h2 className="text-xl font-semibold tracking-tight">
                {title}
            </h2>

            <p className="mt-1 text-sm text-muted">
                {description}
            </p>

        </div>
    );
}


function ColorCard({
    name,
    variable,
    className,
    textClassName = "text-foreground",
    border = false,
}: {
    name: string;
    variable: string;
    className: string;
    textClassName?: string;
    border?: boolean;
}) {
    return (
        <div
            className={[
                "min-h-36 rounded-xl p-5",
                className,
                border ? "border border-border" : "",
            ].join(" ")}
        >

            <p className={`font-semibold ${textClassName}`}>
                {name}
            </p>

            <p className={`mt-2 font-mono text-sm opacity-80 ${textClassName}`}>
                {variable}
            </p>

        </div>
    );
}


function SemanticCard({
    name,
    variable,
    className,
}: {
    name: string;
    variable: string;
    className: string;
}) {
    return (
        <div className={`rounded-xl p-6 text-white ${className}`}>

            <p className="font-semibold">
                {name}
            </p>

            <p className="mt-2 font-mono text-sm opacity-80">
                {variable}
            </p>

        </div>
    );
}


function ColorRow({
    name,
    variable,
    className,
    textClassName = "text-foreground",
}: {
    name: string;
    variable: string;
    className: string;
    textClassName?: string;
}) {
    return (
        <div
            className={[
                "flex items-center justify-between px-5 py-4",
                className,
            ].join(" ")}
        >

            <span className={`font-medium ${textClassName}`}>
                {name}
            </span>

            <span className={`font-mono text-sm opacity-80 ${textClassName}`}>
                {variable}
            </span>

        </div>
    );
}


function OrderCard({
    title,
    status,
    statusClass,
}: {
    title: string;
    status: string;
    statusClass: string;
}) {
    return (
        <div className="rounded-xl border border-border bg-surface p-5">

            <div className="flex items-center justify-between gap-4">

                <div>

                    <p className="font-medium">
                        {title}
                    </p>

                    <p className="mt-1 font-mono text-xs text-muted">
                        Order #ARB-10294
                    </p>

                </div>

                <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass}`}
                >
                    {status}
                </span>

            </div>

        </div>
    );
}