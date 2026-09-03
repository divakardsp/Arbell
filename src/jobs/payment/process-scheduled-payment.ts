import { orders, preDebitPayments, razorpayTokens, users } from "@/db/schema";
import { db } from "@/lib";
import { eq, lte, and } from "drizzle-orm";
import { razorpayPaymentCall } from "@/services/payment-service";

export const processScheduledPaymentsJob = async () => {
    try {
        const cutoff = new Date(Date.now() - (25 * 60 * 60 * 1000 + 30 * 60 * 1000));
        // console.log(cutoff)

        const scheduledPayments = await db
            .select({
                preDebitPaymentId: preDebitPayments.id,
                paymentId: preDebitPayments.paymentId,
                orderId: preDebitPayments.orderId,
                razorpayOrderId: preDebitPayments.razorpayOrderId,
                encryptedRazorpayTokenId: razorpayTokens.razorpayTokenId,
                amount: preDebitPayments.amount,
                currency: preDebitPayments.currency,
                status: preDebitPayments.status,
                email: users.email,
                createdAt: preDebitPayments.createdAt,
            })
            .from(preDebitPayments)
            .innerJoin(
                orders,
                eq(preDebitPayments.orderId, orders.id)
            )
            .innerJoin(
                users,
                eq(orders.userId, users.id)
            )
            .innerJoin(
                razorpayTokens,
                eq(preDebitPayments.razorpayTokenId, razorpayTokens.id)
            )
            .where(and(
                eq(preDebitPayments.status, "waiting"),
                lte(preDebitPayments.createdAt, cutoff)
            ));

        if (!scheduledPayments || scheduledPayments.length === 0) {
            console.log("[processScheduledPaymentsJob] No pending scheduled payments eligible for processing.");
            return [];
        }

        console.log(`[processScheduledPaymentsJob] Processing ${scheduledPayments.length} scheduled payments...`);
        // console.dir(scheduledPayments, {depth:null})
        const results = await razorpayPaymentCall(scheduledPayments);
        console.log("[processScheduledPaymentsJob] Execution completed with results:", results);

        return results;
    } catch (error) {
        if (error instanceof Error) {
            console.error(`ERROR: Scheduler Job failed: ${error.message}`, error);
        } else {
            console.error("ERROR: Scheduler Job failed with unknown error", error);
        }
        throw error;
    }
};