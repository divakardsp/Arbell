import { preDebitPayments } from "@/db/schema";
import { db } from "@/lib";
import { eq } from "drizzle-orm";


export const processScheduledPaymentsJob = async () => {
    try {

        const scheduledPayments = await db
            .select({
                preDebitPaymentId: preDebitPayments.id,
                paymentId: preDebitPayments.paymentId,
                orderId: preDebitPayments.orderId,
                razorpayOrderId: preDebitPayments.razorpayOrderId,
                razorpayTokenId: preDebitPayments.razorpayTokenId,
                amount: preDebitPayments.amount,
                currency: preDebitPayments.currency,
                status: preDebitPayments.status
            })
            .from(preDebitPayments)
            .where(eq(preDebitPayments.status, "waiting"))

        // call function which will handle the processing of single payment

        console.log(scheduledPayments);



    } catch (error) {
        if (error instanceof Error) {
            console.log(500, `ERROR: Scheduler Job failed :${error.message}`)
        }

        console.log(500, `ERROR: Scheduler Job failed`)
    }

}