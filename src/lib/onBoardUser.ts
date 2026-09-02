"use server"

import { auth, currentUser } from "@clerk/nextjs/server";
import { defaultPieChartProps } from "recharts/types/chart/PieChart";
import { db } from ".";
import { users } from "@/db/schema";

export async function onBoarduser() {

    const authRes = await auth();

    if (!authRes.userId) return;
    if (!authRes.isAuthenticated) return


    const clerkUser = await currentUser()

    if (!clerkUser) return;


    const email =
        clerkUser.primaryEmailAddress?.emailAddress ??
        clerkUser.emailAddresses[0]?.emailAddress ??
        null;

    const name =
        clerkUser.fullName ??
        ([clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
            null);

    if(!name) return
    await db
        .insert(users)
        .values({
            clerkId: clerkUser.id,
            email,
            name,
        })
        .onConflictDoUpdate({
            target: users.clerkId,
            set: {
                email : email,
                name: name,
                updatedAt: new Date()
            },
        });
}