import "dotenv/config";
import { v4 as randomUUID } from "uuid";
import { db } from "@/lib";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
    createAgentSession,
    getAgentSessionById,
    getAgentSessionForUser,
    updateAgentSession,
    createAgentEvent,
    getAgentEventsBySession,
    getAgentEventsByRun,
} from "./index";

async function runTests() {
    console.log("==========================================");
    console.log("STARTING AGENT LOG SERVICE VERIFICATION");
    console.log("==========================================\n");

    // 1. Fetch or create two test users (U1 and U2)
    let existingUsers = await db.select().from(users).limit(2);
    let u1Id: string;
    let u2Id: string;

    if (existingUsers.length >= 2) {
        u1Id = existingUsers[0].id;
        u2Id = existingUsers[1].id;
        console.log(`Using existing users:\n- User 1: ${u1Id} (${existingUsers[0].email})\n- User 2: ${u2Id} (${existingUsers[1].email})\n`);
    } else {
        // Create 2 test users if not present
        const [user1] = await db
            .insert(users)
            .values({
                name: "Test User 1",
                email: `test1_${Date.now()}@example.com`,
                phone: `99999${Math.floor(10000 + Math.random() * 90000)}`,
            })
            .returning();
        const [user2] = await db
            .insert(users)
            .values({
                name: "Test User 2",
                email: `test2_${Date.now()}@example.com`,
                phone: `99998${Math.floor(10000 + Math.random() * 90000)}`,
            })
            .returning();
        u1Id = user1.id;
        u2Id = user2.id;
        console.log(`Created test users:\n- User 1: ${u1Id}\n- User 2: ${u2Id}\n`);
    }

    // ==========================================
    // TEST 1: Session Lifecycle
    // ==========================================
    console.log("--- TEST 1: Session Lifecycle ---");
    const session = await createAgentSession({
        userId: u1Id,
        title: "AI Buyer Session - Laptop Search",
    });

    console.log("✓ Session created:", {
        id: session.id,
        userId: session.userId,
        title: session.title,
        status: session.status,
        startedAt: session.startedAt,
    });

    const s1Id = session.id;

    // getAgentSessionById
    const fetchedById = await getAgentSessionById(s1Id);
    if (fetchedById.id !== s1Id || fetchedById.title !== "AI Buyer Session - Laptop Search") {
        throw new Error("getAgentSessionById failed to return matching session.");
    }
    console.log("✓ getAgentSessionById succeeded");

    // updateAgentSession
    const updated = await updateAgentSession(s1Id, {
        title: "AI Buyer Session - Completed Purchase",
        status: "completed",
        endedAt: new Date(),
    });
    if (updated.title !== "AI Buyer Session - Completed Purchase" || updated.status !== "completed" || !updated.endedAt) {
        throw new Error("updateAgentSession failed to update title/status/endedAt.");
    }
    console.log("✓ updateAgentSession succeeded:", {
        id: updated.id,
        title: updated.title,
        status: updated.status,
        endedAt: updated.endedAt,
        updatedAt: updated.updatedAt,
    });

    // ==========================================
    // TEST 2: Session Ownership Validation
    // ==========================================
    console.log("\n--- TEST 2: Ownership Validation ---");

    // S1 belongs to U1 -> should succeed
    const userSession = await getAgentSessionForUser({ sessionId: s1Id, userId: u1Id });
    if (userSession.id !== s1Id) {
        throw new Error("getAgentSessionForUser failed for rightful owner.");
    }
    console.log(`✓ getAgentSessionForUser(S1, U1) succeeded for rightful owner U1`);

    // S1 does not belong to U2 -> must throw 404
    let ownershipBlocked = false;
    try {
        await getAgentSessionForUser({ sessionId: s1Id, userId: u2Id });
    } catch (err: any) {
        if (err.statusCode === 404) {
            ownershipBlocked = true;
            console.log(`✓ getAgentSessionForUser(S1, U2) correctly blocked with 404: "${err.message}"`);
        } else {
            throw err;
        }
    }
    if (!ownershipBlocked) {
        throw new Error("SECURITY FAILURE: getAgentSessionForUser allowed unauthorized user access!");
    }

    // ==========================================
    // TEST 3: Events & Run Filtering
    // ==========================================
    console.log("\n--- TEST 3: Event Logging & Run Filtering ---");

    const r1Id = crypto.randomUUID();
    const r2Id = crypto.randomUUID();

    console.log(`Creating events for Run 1 (${r1Id})...`);
    // Create Run 1 events
    const e1 = await createAgentEvent({
        sessionId: s1Id,
        runId: r1Id,
        eventType: "run_started",
        status: "running",
        inputData: { query: "Find high-end laptops under 70k" },
    });

    const e2 = await createAgentEvent({
        sessionId: s1Id,
        runId: r1Id,
        eventType: "tool_called",
        status: "running",
        toolName: "search_products",
        inputData: { search: "laptop", minPrice: 30000, maxPrice: 70000 },
    });

    const e3 = await createAgentEvent({
        sessionId: s1Id,
        runId: r1Id,
        eventType: "tool_completed",
        status: "completed",
        toolName: "search_products",
        outputData: { count: 3, items: ["Laptop A", "Laptop B", "Laptop C"] },
    });

    const e4 = await createAgentEvent({
        sessionId: s1Id,
        runId: r1Id,
        eventType: "run_completed",
        status: "completed",
        outputData: { answer: "Found 3 matching laptops." },
    });
    console.log("✓ Created 4 events for Run 1 (run_started, tool_called, tool_completed, run_completed)");

    console.log(`Creating events for Run 2 (${r2Id})...`);
    // Create Run 2 events
    const e5 = await createAgentEvent({
        sessionId: s1Id,
        runId: r2Id,
        eventType: "run_started",
        status: "running",
        inputData: { query: "Proceed to checkout laptop A" },
    });

    const e6 = await createAgentEvent({
        sessionId: s1Id,
        runId: r2Id,
        eventType: "order_created",
        status: "completed",
        outputData: { orderId: "ord_123" },
    });

    const e7 = await createAgentEvent({
        sessionId: s1Id,
        runId: r2Id,
        eventType: "run_completed",
        status: "completed",
        outputData: { summary: "Order created successfully" },
    });
    console.log("✓ Created 3 events for Run 2 (run_started, order_created, run_completed)");

    // Test getAgentEventsBySession(S1) -> should return all 7 events in chronological order
    const sessionEvents = await getAgentEventsBySession(s1Id);
    console.log(`✓ getAgentEventsBySession(S1) returned ${sessionEvents.length} events (expected: 7)`);

    if (sessionEvents.length !== 7) {
        throw new Error(`Expected 7 events for session, got ${sessionEvents.length}`);
    }

    // Verify chronological ordering
    for (let i = 1; i < sessionEvents.length; i++) {
        const prevTime = new Date(sessionEvents[i - 1].createdAt).getTime();
        const currTime = new Date(sessionEvents[i].createdAt).getTime();
        if (currTime < prevTime) {
            throw new Error(`Events are not in chronological order! Index ${i} has earlier timestamp.`);
        }
    }
    console.log("✓ Verified all session events are in chronological order (createdAt ASC)");

    // Test getAgentEventsByRun({ sessionId: S1, runId: R1 }) -> should return only 4 events for Run 1
    const r1Events = await getAgentEventsByRun({ sessionId: s1Id, runId: r1Id });
    console.log(`✓ getAgentEventsByRun(S1, R1) returned ${r1Events.length} events (expected: 4)`);

    if (r1Events.length !== 4) {
        throw new Error(`Expected 4 events for Run 1, got ${r1Events.length}`);
    }
    for (const evt of r1Events) {
        if (evt.runId !== r1Id) {
            throw new Error(`Unexpected event from different run: ${evt.runId}`);
        }
    }
    console.log("✓ Verified all returned events belong exclusively to Run 1");

    // Test getAgentEventsByRun({ sessionId: S1, runId: R2 }) -> should return only 3 events for Run 2
    const r2Events = await getAgentEventsByRun({ sessionId: s1Id, runId: r2Id });
    console.log(`✓ getAgentEventsByRun(S1, R2) returned ${r2Events.length} events (expected: 3)`);

    if (r2Events.length !== 3) {
        throw new Error(`Expected 3 events for Run 2, got ${r2Events.length}`);
    }
    for (const evt of r2Events) {
        if (evt.runId !== r2Id) {
            throw new Error(`Unexpected event from different run: ${evt.runId}`);
        }
    }
    console.log("✓ Verified all returned events belong exclusively to Run 2");

    console.log("\n==========================================");
    console.log("ALL TESTS PASSED SUCCESSFULLY! 🚀");
    console.log("==========================================");
}

runTests().catch((error) => {
    console.error("TEST FAILED:", error);
    process.exit(1);
});
