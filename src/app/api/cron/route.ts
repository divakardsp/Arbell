import { processScheduledPaymentsJob } from "@/jobs/payment/process-scheduled-payment";

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    console.log("CRON ENTERED=============================")
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return new Response('Unauthorized', {
            status: 401,
        });
    }
    console.log("CRON AUTHENTICATED=============================")
    await processScheduledPaymentsJob();

    return Response.json({ success: true });
}