/**
 * PostgreSQL-backed Job Queue
 *
 * A lightweight, persistent job queue using PostgreSQL.
 * Features:
 * - Jobs persist across server restarts
 * - Transactional job creation (same transaction as business logic)
 * - Automatic retry with exponential backoff
 * - Concurrent worker safety via FOR UPDATE SKIP LOCKED
 * - No external dependencies (Redis, etc.)
 */

import { db } from "../db/index.js";
import { jobs } from "../db/schema.js";
import { eq, and, lte, sql, desc } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";

// Type for the job payload - must be JSON serializable
type JobPayload = Record<string, unknown>;

// Job handler function type
type JobHandler<T extends JobPayload = JobPayload> = (payload: T) => Promise<void>;

// Registry of job handlers
const handlers = new Map<string, JobHandler>();

// Worker state
let workerRunning = false;
let workerStopRequested = false;

/**
 * Register a handler for a job type
 */
export function registerHandler<T extends JobPayload>(type: string, handler: JobHandler<T>): void {
	if (handlers.has(type)) {
		console.warn(`[Queue] Handler for "${type}" already registered, replacing`);
	}
	handlers.set(type, handler as JobHandler);
	console.log(`[Queue] Registered handler for "${type}"`);
}

/**
 * Enqueue options
 */
export interface EnqueueOptions {
	/** Queue name (default: "default") */
	queue?: string;
	/** When to run the job (default: now) */
	runAt?: Date;
	/** Max retry attempts (default: 3) */
	maxAttempts?: number;
}

/**
 * Add a job to the queue
 */
export async function enqueue<T extends JobPayload>(
	type: string,
	payload: T,
	options: EnqueueOptions = {}
): Promise<number> {
	const [job] = await db
		.insert(jobs)
		.values({
			type,
			payload,
			queue: options.queue ?? "default",
			runAt: options.runAt ?? new Date(),
			maxAttempts: options.maxAttempts ?? 3
		})
		.returning({ id: jobs.id });

	console.log(`[Queue] Enqueued job ${job.id} (${type})`);
	return job.id;
}

/**
 * Add a job within an existing transaction (transactional outbox pattern)
 * This ensures the job is only created if the transaction commits
 */
export async function enqueueInTransaction<T extends JobPayload>(
	tx: PgTransaction<any, any, any>,
	type: string,
	payload: T,
	options: EnqueueOptions = {}
): Promise<void> {
	await tx.insert(jobs).values({
		type,
		payload,
		queue: options.queue ?? "default",
		runAt: options.runAt ?? new Date(),
		maxAttempts: options.maxAttempts ?? 3
	});
}

/**
 * Schedule a recurring job (only creates if not already pending)
 */
export async function scheduleRecurring(
	type: string,
	payload: JobPayload,
	intervalMs: number,
	options: Omit<EnqueueOptions, "runAt"> = {}
): Promise<void> {
	// Check if already scheduled
	const existing = await db
		.select({ id: jobs.id })
		.from(jobs)
		.where(and(eq(jobs.type, type), eq(jobs.status, "pending")))
		.limit(1);

	if (existing.length === 0) {
		await enqueue(type, payload, {
			...options,
			runAt: new Date(Date.now() + intervalMs)
		});
	}
}

/**
 * Fetch and lock the next available job using FOR UPDATE SKIP LOCKED
 */
async function fetchNextJob(queue: string): Promise<typeof jobs.$inferSelect | null> {
	const result = await db.execute<{
		id: number;
		queue: string;
		type: string;
		payload: JobPayload;
		status: "pending" | "processing" | "completed" | "failed";
		attempts: number;
		max_attempts: number;
		last_error: string | null;
		run_at: Date;
		started_at: Date | null;
		completed_at: Date | null;
		created_at: Date;
	}>(sql`
		UPDATE jobs
		SET status = 'processing', started_at = NOW(), attempts = attempts + 1
		WHERE id = (
			SELECT id FROM jobs
			WHERE queue = ${queue}
				AND status = 'pending'
				AND run_at <= NOW()
			ORDER BY run_at ASC
			FOR UPDATE SKIP LOCKED
			LIMIT 1
		)
		RETURNING *
	`);

	if (result.length === 0) return null;

	const row = result[0];
	return {
		id: row.id,
		queue: row.queue,
		type: row.type,
		payload: row.payload,
		status: row.status,
		attempts: row.attempts,
		maxAttempts: row.max_attempts,
		lastError: row.last_error,
		runAt: row.run_at,
		startedAt: row.started_at,
		completedAt: row.completed_at,
		createdAt: row.created_at
	};
}

/**
 * Mark job as completed
 */
async function completeJob(jobId: number): Promise<void> {
	await db
		.update(jobs)
		.set({
			status: "completed",
			completedAt: new Date()
		})
		.where(eq(jobs.id, jobId));
}

/**
 * Mark job as failed, schedule retry if attempts remain
 */
async function failJob(
	jobId: number,
	error: string,
	attempts: number,
	maxAttempts: number
): Promise<void> {
	if (attempts < maxAttempts) {
		// Exponential backoff: 1min, 4min, 16min, 64min...
		const backoffMs = Math.pow(4, attempts) * 60 * 1000;
		const runAt = new Date(Date.now() + backoffMs);

		await db
			.update(jobs)
			.set({
				status: "pending",
				lastError: error,
				runAt
			})
			.where(eq(jobs.id, jobId));

		console.log(`[Queue] Job ${jobId} will retry at ${runAt.toISOString()}`);
	} else {
		await db
			.update(jobs)
			.set({
				status: "failed",
				lastError: error,
				completedAt: new Date()
			})
			.where(eq(jobs.id, jobId));

		console.log(`[Queue] Job ${jobId} permanently failed after ${attempts} attempts`);
	}
}

/**
 * Process a single job from the queue
 */
async function processOne(queue: string): Promise<boolean> {
	const job = await fetchNextJob(queue);

	if (!job) return false;

	const handler = handlers.get(job.type);

	if (!handler) {
		console.error(`[Queue] No handler registered for job type: ${job.type}`);
		await failJob(job.id, `No handler for job type: ${job.type}`, job.attempts, job.maxAttempts);
		return true;
	}

	const startTime = performance.now();

	try {
		await handler(job.payload as JobPayload);
		await completeJob(job.id);

		const duration = performance.now() - startTime;
		console.log(`[Queue] Job ${job.id} (${job.type}) completed in ${duration.toFixed(0)}ms`);
	} catch (e) {
		const error = e instanceof Error ? e.message : String(e);
		console.error(`[Queue] Job ${job.id} (${job.type}) failed:`, error);
		await failJob(job.id, error, job.attempts, job.maxAttempts);
	}

	return true;
}

/**
 * Worker options
 */
export interface WorkerOptions {
	/** Queue to process (default: "default") */
	queue?: string;
	/** Poll interval in ms when no jobs available (default: 1000) */
	pollInterval?: number;
}

/**
 * Start the queue worker
 * Returns a function to stop the worker
 */
export function startWorker(options: WorkerOptions = {}): () => void {
	const queue = options.queue ?? "default";
	const pollInterval = options.pollInterval ?? 1000;

	if (workerRunning) {
		console.warn("[Queue] Worker already running");
		return () => {};
	}

	workerRunning = true;
	workerStopRequested = false;

	const work = async () => {
		console.log(`[Queue] Worker started for queue: ${queue}`);

		while (!workerStopRequested) {
			try {
				const processed = await processOne(queue);

				// If no job found, wait before polling again
				if (!processed) {
					await Bun.sleep(pollInterval);
				}
			} catch (e) {
				console.error("[Queue] Worker error:", e);
				await Bun.sleep(pollInterval);
			}
		}

		workerRunning = false;
		console.log(`[Queue] Worker stopped for queue: ${queue}`);
	};

	// Start worker in background
	work();

	// Return stop function
	return () => {
		workerStopRequested = true;
	};
}

/**
 * Check if worker is running
 */
export function isWorkerRunning(): boolean {
	return workerRunning;
}

/**
 * Queue statistics
 */
export interface QueueStats {
	pending: number;
	processing: number;
	completed: number;
	failed: number;
}

/**
 * Get queue statistics
 */
export async function getQueueStats(queue = "default"): Promise<QueueStats> {
	const result = await db.execute<{ status: string; count: number }>(sql`
		SELECT status, COUNT(*)::int as count
		FROM jobs
		WHERE queue = ${queue}
		GROUP BY status
	`);

	const stats: QueueStats = { pending: 0, processing: 0, completed: 0, failed: 0 };

	for (const row of result) {
		if (row.status in stats) {
			stats[row.status as keyof QueueStats] = row.count;
		}
	}

	return stats;
}

/**
 * Get recent failed jobs for debugging
 */
export async function getFailedJobs(queue = "default", limit = 10) {
	return db
		.select()
		.from(jobs)
		.where(and(eq(jobs.queue, queue), eq(jobs.status, "failed")))
		.orderBy(desc(jobs.completedAt))
		.limit(limit);
}

/**
 * Retry a failed job
 */
export async function retryJob(jobId: number): Promise<void> {
	await db
		.update(jobs)
		.set({
			status: "pending",
			attempts: 0,
			runAt: new Date(),
			lastError: null,
			startedAt: null,
			completedAt: null
		})
		.where(eq(jobs.id, jobId));

	console.log(`[Queue] Job ${jobId} queued for retry`);
}

/**
 * Clean up old completed jobs
 */
export async function cleanupOldJobs(olderThanDays = 7): Promise<number> {
	const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

	const result = await db
		.delete(jobs)
		.where(and(eq(jobs.status, "completed"), lte(jobs.completedAt, cutoff)))
		.returning({ id: jobs.id });

	return result.length;
}
