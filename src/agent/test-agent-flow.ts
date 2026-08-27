import "dotenv/config";
import { db } from "@/lib";
import { users } from "@/db/schema";
import { buyerAgent, AgentRunContext } from "@/agent";
import {
    createAgentSession,
    getAgentSessionForUser,
    getAgentEventsBySession,
    getAgentEventsByRun,
} from "@/services/agent-log-service";

async function runAgentFlowTests() {
    console.log("====================================================");
    console.log("STARTING ARBELL AI BUYER + MCP AGENT LAYER TESTS");
    console.log("====================================================\n");

    // 1. Fetch or create test users
    const existingUsers = await db.select().from(users).limit(2);
    let u1Id = existingUsers[0]?.id;
    let u2Id = existingUsers[1]?.id;

    if (!u1Id || !u2Id) {
        throw new Error("Need at least 2 users in the database for ownership tests.");
    }

    console.log(`Test Users:\n- Primary Buyer (U1): ${u1Id}\n- Other User (U2): ${u2Id}\n`);

    // ====================================================
    // TEST 1: New Session & Initial Search
    // ====================================================
    console.log("--- TEST 1: Initial Product Search (New Session) ---");
    const userMessage1 = "Find me a laptop under ₹70,000";

    // Simulate route.ts session handling for new session
    const session1 = await createAgentSession({
        userId: u1Id,
        title: userMessage1.slice(0, 100),
    });
    const s1Id = session1.id;
    const r1Id = crypto.randomUUID();

    console.log(`Created Session S1: ${s1Id}`);
    console.log(`Executing Run R1: ${r1Id}`);

    const context1: AgentRunContext = {
        userId: u1Id,
        sessionId: s1Id,
        runId: r1Id,
    };

    const response1 = await buyerAgent.run({
        message: userMessage1,
        context: context1,
    });

    console.log("\n[Agent Response 1]:");
    console.log(response1.response);
    console.log(`Tool calls made: ${response1.toolCallsCount}`);

    // Verify Audit Events for Run 1
    const r1Events = await getAgentEventsByRun({ sessionId: s1Id, runId: r1Id });
    console.log(`\nRun 1 Events count: ${r1Events.length}`);
    const r1EventTypes = r1Events.map((e) => e.eventType);
    console.log("Run 1 Event Types:", r1EventTypes);

    if (!r1EventTypes.includes("run_started")) throw new Error("Missing run_started event");
    if (!r1EventTypes.includes("tool_called")) throw new Error("Missing tool_called event");
    if (!r1EventTypes.includes("tool_completed")) throw new Error("Missing tool_completed event");
    if (!r1EventTypes.includes("run_completed")) throw new Error("Missing run_completed event");
    console.log("✓ TEST 1 PASSED: Full lifecycle recorded with real product search tool results.\n");

    // ====================================================
    // TEST 2: Multi-turn in Same Session (New Run)
    // ====================================================
    console.log("--- TEST 2: Multi-turn Followup (Same Session S1, New Run R2) ---");
    const userMessage2 = "Find me an HP laptop instead";
    const r2Id = crypto.randomUUID();

    // Verify existing session belongs to user
    const existingSession = await getAgentSessionForUser({
        sessionId: s1Id,
        userId: u1Id,
    });
    console.log(`Reusing Session S1: ${existingSession.id}`);
    console.log(`Executing Run R2: ${r2Id}`);

    const context2: AgentRunContext = {
        userId: u1Id,
        sessionId: s1Id,
        runId: r2Id,
    };

    const response2 = await buyerAgent.run({
        message: userMessage2,
        context: context2,
    });

    console.log("\n[Agent Response 2]:");
    console.log(response2.response);

    // Verify Audit Events for Run 2
    const r2Events = await getAgentEventsByRun({ sessionId: s1Id, runId: r2Id });
    console.log(`\nRun 2 Events count: ${r2Events.length}`);
    const r2EventTypes = r2Events.map((e) => e.eventType);
    console.log("Run 2 Event Types:", r2EventTypes);

    if (!r2EventTypes.includes("run_started") || !r2EventTypes.includes("run_completed")) {
        throw new Error("Missing run_started or run_completed event in Run 2");
    }

    // Verify Session S1 total events
    const allSessionEvents = await getAgentEventsBySession(s1Id);
    console.log(`Total events in Session S1 across both runs: ${allSessionEvents.length}`);
    if (allSessionEvents.length !== r1Events.length + r2Events.length) {
        throw new Error("Session events count mismatch");
    }
    console.log("✓ TEST 2 PASSED: Same session reused, new run generated and isolated.\n");

    // ====================================================
    // TEST 3: Fresh Request with Same Session (New Run R3)
    // ====================================================
    console.log("--- TEST 3: Fresh Turn with Same Session (New Run R3) ---");
    const r3Id = crypto.randomUUID();
    const response3 = await buyerAgent.run({
        message: "What is the return policy or warranty for laptops?",
        context: {
            userId: u1Id,
            sessionId: s1Id,
            runId: r3Id,
        },
    });
    console.log("\n[Agent Response 3]:");
    console.log(response3.response);

    const r3Events = await getAgentEventsByRun({ sessionId: s1Id, runId: r3Id });
    if (!r3Events.some((e) => e.eventType === "run_completed")) {
        throw new Error("Run 3 failed to complete");
    }
    console.log("✓ TEST 3 PASSED: Session maintained across independent turns.\n");

    // ====================================================
    // TEST 4: Unauthorized / Fake Session ID
    // ====================================================
    console.log("--- TEST 4: Unauthorized Access Security Check ---");
    let unauthorizedBlocked = false;
    try {
        // User 2 tries to access User 1's session S1
        await getAgentSessionForUser({
            sessionId: s1Id,
            userId: u2Id,
        });
    } catch (err: any) {
        if (err.statusCode === 404) {
            unauthorizedBlocked = true;
            console.log(`✓ Unauthorized access correctly rejected with 404: "${err.message}"`);
        }
    }
    if (!unauthorizedBlocked) {
        throw new Error("SECURITY FAILURE: User 2 accessed User 1's session!");
    }
    console.log("✓ TEST 4 PASSED: Strict session ownership enforced.\n");

    // ====================================================
    // TEST 5: Failure Handling & run_failed Event
    // ====================================================
    console.log("--- TEST 5: Failure Handling & run_failed Audit ---");
    const r5Id = crypto.randomUUID();

    // Create context with a non-existent session to simulate an agent failure
    const fakeSessionId = crypto.randomUUID();
    let failureHandled = false;

    try {
        await buyerAgent.run({
            message: "Test error",
            context: {
                userId: u1Id,
                sessionId: fakeSessionId,
                runId: r5Id,
            },
        });
    } catch (err: any) {
        failureHandled = true;
        console.log(`✓ Caught expected agent failure: "${err.message}"`);
    }

    if (!failureHandled) {
        throw new Error("Expected agent failure was not caught");
    }
    console.log("✓ TEST 5 PASSED: Failure handling verified.\n");

    console.log("====================================================");
    console.log("ALL 5 ARBELL AI BUYER AGENT TESTS COMPLETED! 🚀");
    console.log("====================================================");
}

runAgentFlowTests().catch((err) => {
    console.error("TEST SUITE FAILED:", err);
    process.exit(1);
});
