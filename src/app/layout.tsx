import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Arbell",
  description: "AI-powered shopping assistant",
  icons: {
    icon: "/ChatLogo.png",
    apple: "/ChatLogo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="scroll-smooth"
      suppressHydrationWarning
    >
      <body className={inter.className}>
        <ThemeProvider>
            {children}
        </ThemeProvider>
      </body>
    </html>
  );
}