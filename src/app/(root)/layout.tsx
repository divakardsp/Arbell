import { onBoarduser } from "@/lib/onBoardUser";
import { auth } from "@clerk/nextjs/server";

export default async function RootGroupLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    await auth.protect()
    console.log("Called")
    await onBoarduser();
    return children;
}
