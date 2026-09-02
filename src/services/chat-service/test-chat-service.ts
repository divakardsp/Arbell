import "dotenv/config";
import { db } from "@/lib";
import { users, agentSessions, agentEvents } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getUserChatHistory, getUserChatSessionHistory } from "./chat.service";

async function runTests() {
    console.log("=== STARTING CHAT HISTORY SERVICE TESTS ===\n");

    // 1. Create two test users to verify user isolation
    const testClerkIdA = `test_clerk_${Date.now()}_A`;
    const testClerkIdB = `test_clerk_${Date.now()}_B`;

    const [userA] = await db
        .insert(users)
        .values({
            clerkId: testClerkIdA,
            name: "Test User A",
            email: `user_a_${Date.now()}@example.com`,
        })
        .returning();

    const [userB] = await db
        .insert(users)
        .values({
            clerkId: testClerkIdB,
            name: "Test User B",
            email: `user_b_${Date.now()}@example.com`,
        })
        .returning();

    console.log(`Created test users: User A (${userA.id}), User B (${userB.id})`);

    try {
        // TEST 1: User with no sessions
        console.log("\n--- TEST 1: User with no sessions ---");
        const emptyHistory = await getUserChatHistory(userA.id);
        console.log("Empty history response:", JSON.stringify(emptyHistory, null, 2));
        if (!Array.isArray(emptyHistory.chat) || emptyHistory.chat.length !== 0) {
            throw new Error("TEST 1 FAILED: Expected empty chat array");
        }
        console.log("✓ TEST 1 PASSED: Empty state returns { chat: [] }");

        // TEST 2: Create Session 1 for User A with Multi-Turn Conversation & Tool Calls
        console.log("\n--- TEST 2: Session with multiple turns & intermediate tool calls ---");
        const [session1] = await db
            .insert(agentSessions)
            .values({
                userId: userA.id,
                title: "Find running shoes",
            })
            .returning();

        // Turn 1 Events:
        const runId1 = crypto.randomUUID();
        const baseTime = Date.now();

        // 1. User message in run_started
        await db.insert(agentEvents).values({
            sessionId: session1.id,
            runId: runId1,
            eventType: "run_started",
            status: "running",
            inputData: { userId: userA.id, message: "Find me Nike running shoes" },
            createdAt: new Date(baseTime),
        });

        // 2. Intermediate tool call (SHOULD BE EXCLUDED)
        await db.insert(agentEvents).values({
            sessionId: session1.id,
            runId: runId1,
            eventType: "tool_called",
            status: "running",
            toolName: "search_products",
            inputData: { category: "Footwear", search: "Nike" },
            createdAt: new Date(baseTime + 100),
        });

        // 3. Intermediate tool result (SHOULD BE EXCLUDED)
        await db.insert(agentEvents).values({
            sessionId: session1.id,
            runId: runId1,
            eventType: "tool_completed",
            status: "completed",
            toolName: "search_products",
            outputData: { status: "success", itemsCount: 5 },
            createdAt: new Date(baseTime + 200),
        });

        // 4. Final agent response in run_completed
        await db.insert(agentEvents).values({
            sessionId: session1.id,
            runId: runId1,
            eventType: "run_completed",
            status: "completed",
            outputData: { response: "I found 5 Nike running shoes starting from ₹4,999." },
            createdAt: new Date(baseTime + 300),
        });

        // Turn 2 Events:
        const runId2 = crypto.randomUUID();

        // 5. Follow-up user message in run_started
        await db.insert(agentEvents).values({
            sessionId: session1.id,
            runId: runId2,
            eventType: "run_started",
            status: "running",
            inputData: { userId: userA.id, message: "Show me options under ₹4,000" },
            createdAt: new Date(baseTime + 1000),
        });

        // 6. Final agent response for turn 2 in run_completed
        await db.insert(agentEvents).values({
            sessionId: session1.id,
            runId: runId2,
            eventType: "run_completed",
            status: "completed",
            outputData: { response: "Here are the Nike options under ₹4,000..." },
            createdAt: new Date(baseTime + 1300),
        });

        // TEST 3: Create Session 2 for User A (Single Turn with Guardrail Rejection / Failure)
        console.log("\n--- TEST 3: Second session for User A with guardrail rejection ---");
        const [session2] = await db
            .insert(agentSessions)
            .values({
                userId: userA.id,
                title: "Write Python code",
            })
            .returning();

        const runId3 = crypto.randomUUID();
        await db.insert(agentEvents).values({
            sessionId: session2.id,
            runId: runId3,
            eventType: "run_started",
            status: "running",
            inputData: { userId: userA.id, message: "Write me a python script" },
            createdAt: new Date(baseTime + 2000),
        });

        await db.insert(agentEvents).values({
            sessionId: session2.id,
            runId: runId3,
            eventType: "run_failed",
            status: "failed",
            outputData: { error: "Arbell is a shopping platform. I can only help with shopping." },
            createdAt: new Date(baseTime + 2100),
        });

        // TEST 4: Create Session for User B (User Isolation check)
        console.log("\n--- TEST 4: Session for User B ---");
        const [sessionB] = await db
            .insert(agentSessions)
            .values({
                userId: userB.id,
                title: "User B Secret Laptop Search",
            })
            .returning();

        const runIdB = crypto.randomUUID();
        await db.insert(agentEvents).values({
            sessionId: sessionB.id,
            runId: runIdB,
            eventType: "run_started",
            status: "running",
            inputData: { userId: userB.id, message: "Show me gaming laptops" },
            createdAt: new Date(baseTime + 3000),
        });

        await db.insert(agentEvents).values({
            sessionId: sessionB.id,
            runId: runIdB,
            eventType: "run_completed",
            status: "completed",
            outputData: { response: "Here are top gaming laptops..." },
            createdAt: new Date(baseTime + 3200),
        });

        // 5. Query User A's Chat History
        console.log("\n--- TEST 5: Query User A's Chat History ---");
        const historyA = await getUserChatHistory(userA.id);
        console.log("User A History:", JSON.stringify(historyA, null, 2));

        if (historyA.chat.length !== 2) {
            throw new Error(`TEST 5 FAILED: Expected 2 sessions for User A, got ${historyA.chat.length}`);
        }

        // Verify Session 1 messages
        const s1History = historyA.chat.find((c) => c.sessionId === session1.id);
        if (!s1History) throw new Error("TEST 5 FAILED: Session 1 not found in history");

        if (s1History.messages.length !== 4) {
            throw new Error(`TEST 5 FAILED: Expected 4 messages in Session 1, got ${s1History.messages.length}`);
        }

        if (
            s1History.messages[0].role !== "user" ||
            s1History.messages[0].content !== "Find me Nike running shoes" ||
            s1History.messages[1].role !== "assistant" ||
            s1History.messages[1].content !== "I found 5 Nike running shoes starting from ₹4,999." ||
            s1History.messages[2].role !== "user" ||
            s1History.messages[2].content !== "Show me options under ₹4,000" ||
            s1History.messages[3].role !== "assistant" ||
            s1History.messages[3].content !== "Here are the Nike options under ₹4,000..."
        ) {
            throw new Error("TEST 5 FAILED: Messages content/roles/order mismatch in Session 1");
        }
        console.log("✓ TEST 5 PASSED: Multi-turn chronological order preserved & tool events excluded.");

        // Verify Session 2 messages (guardrail error response)
        const s2History = historyA.chat.find((c) => c.sessionId === session2.id);
        if (!s2History) throw new Error("TEST 5 FAILED: Session 2 not found in history");
        if (
            s2History.messages.length !== 2 ||
            s2History.messages[0].role !== "user" ||
            s2History.messages[1].role !== "assistant" ||
            !s2History.messages[1].content.includes("Arbell is a shopping platform")
        ) {
            throw new Error("TEST 5 FAILED: Session 2 guardrail response mismatch");
        }
        console.log("✓ TEST 5 PASSED: Guardrail / failed run response properly captured.");

        // TEST 6: User Isolation Check
        console.log("\n--- TEST 6: User Isolation Check ---");
        // User A must not have User B's session
        const hasSessionBInA = historyA.chat.some((c) => c.sessionId === sessionB.id);
        if (hasSessionBInA) {
            throw new Error("TEST 6 FAILED: User A received User B's chat session!");
        }

        const historyB = await getUserChatHistory(userB.id);
        if (historyB.chat.length !== 1 || historyB.chat[0].sessionId !== sessionB.id) {
            throw new Error("TEST 6 FAILED: User B did not receive only their own session");
        }

        // Verify User A attempting to fetch User B's session directly
        let unauthorizedCaught = false;
        try {
            await getUserChatSessionHistory(userA.id, sessionB.id);
        } catch (err: any) {
            unauthorizedCaught = true;
            console.log("Correctly rejected cross-user session access:", err.message);
        }

        if (!unauthorizedCaught) {
            throw new Error("TEST 6 FAILED: User A was able to access User B's session directly!");
        }
        console.log("✓ TEST 6 PASSED: Strict user isolation verified.");

        // TEST 7: Single session fetch
        console.log("\n--- TEST 7: Single session fetch ---");
        const singleSession = await getUserChatSessionHistory(userA.id, session1.id);
        if (singleSession.sessionId !== session1.id || singleSession.messages.length !== 4) {
            throw new Error("TEST 7 FAILED: Single session retrieval failed");
        }
        console.log("✓ TEST 7 PASSED: Single session fetch works correctly.");

        console.log("\n==========================================");
        console.log("ALL CHAT HISTORY SERVICE TESTS PASSED SUCCESSFULLY! 🎉");
        console.log("==========================================");
    } finally {
        // Cleanup test data
        console.log("\nCleaning up test data...");
        const sessionList = await db
            .select({ id: agentSessions.id })
            .from(agentSessions)
            .where(inArray(agentSessions.userId, [userA.id, userB.id]));

        if (sessionList.length > 0) {
            const sIds = sessionList.map((s) => s.id);
            await db.delete(agentEvents).where(inArray(agentEvents.sessionId, sIds));
            await db.delete(agentSessions).where(inArray(agentSessions.id, sIds));
        }

        await db.delete(users).where(inArray(users.id, [userA.id, userB.id]));
        console.log("Cleanup complete.");
    }
}

runTests()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("TEST FAILED WITH ERROR:", err);
        process.exit(1);
    });
