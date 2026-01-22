/**
 * Cron endpoint for processing job queue
 * Triggered by Vercel Cron every minute
 */
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { processJobs, getQueueStats } from "$lib/server/integrations/queue.js";
import { env } from "$env/dynamic/private";

export const GET: RequestHandler = async ({ request }) => {
	// Verify cron secret (Vercel sends this header)
	const authHeader = request.headers.get("authorization");
	if (env.CRON_SECRET && authHeader !== `Bearer ${env.CRON_SECRET}`) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	const startTime = Date.now();

	try {
		const processed = await processJobs({
			maxJobs: 50,
			timeoutMs: 55000 // Leave 5s buffer before Vercel timeout
		});

		const stats = await getQueueStats();

		return json({
			success: true,
			processed,
			durationMs: Date.now() - startTime,
			queue: stats
		});
	} catch (error) {
		console.error("[Cron] Job processing failed:", error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Unknown error"
			},
			{ status: 500 }
		);
	}
};
