import { ChatLayout } from "@/components/chat-layout";
import { onBoarduser } from "@/lib/onBoardUser";
import { auth } from "@clerk/nextjs/server";


export default async function Home() {

    await auth.protect()
    return <ChatLayout />;
}