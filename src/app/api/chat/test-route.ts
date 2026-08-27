import "dotenv/config";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { db } from "@/lib";
import { users } from "@/db/schema";

async function testChatRoute() {
    console.log("=== TESTING /api/agent/chat ROUTE HANDLER ===");

    const [user] = await db.select().from(users).limit(1);
    if (!user) throw new Error("No user found in DB");

    // 1. Initial Request (new session)
    console.log("\n1. Testing POST with new session...");
    const req1 = new NextRequest("http://localhost:3000/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            userId: user.id,
            message: "Show me a laptop under 50k",
        }),
    });

    const res1 = await POST(req1);
    const json1 = await res1.json();
    console.log("Status:", res1.status);
    console.log("Response JSON:", JSON.stringify(json1, null, 2));

    if (!json1.success || !json1.data.sessionId || !json1.data.runId) {
        throw new Error("Route test 1 failed");
    }

    const createdSessionId = json1.data.sessionId;

    // 2. Followup Request (existing session)
    console.log("\n2. Testing POST with existing session:", createdSessionId);
    const req2 = new NextRequest("http://localhost:3000/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            userId: user.id,
            sessionId: createdSessionId,
            message: "Does it have 8GB RAM?",
        }),
    });

    const res2 = await POST(req2);
    const json2 = await res2.json();
    console.log("Status:", res2.status);
    console.log("Response JSON:", JSON.stringify(json2, null, 2));

    if (!json2.success || json2.data.sessionId !== createdSessionId) {
        throw new Error("Route test 2 failed to preserve session");
    }

    console.log("\n=== ROUTE HANDLER TESTS PASSED! ===");
}

testChatRoute().catch((err) => {
    console.error("ROUTE TEST FAILED:", err);
    process.exit(1);
});
