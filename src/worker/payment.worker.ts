import cron from "node-cron";
import { processScheduledPaymentsJob } from "@/jobs/payment/process-scheduled-payment";

console.log("Payment worker started");

cron.schedule("*/10 * * * * *", async () => {
    console.log("Running scheduled payment job");

    await processScheduledPaymentsJob();
});