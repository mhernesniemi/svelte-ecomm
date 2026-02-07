/**
 * Sync Runner
 *
 * Reusable pattern for synchronizing data from external systems (ERP, PIM, etc.)
 * Can run immediately or be scheduled via the job queue.
 */

import { registerHandler, enqueue, scheduleRecurring } from "./queue.js";
import { emitPersistent } from "./events.js";

export interface SyncResults {
	name: string;
	created: number;
	updated: number;
	deleted: number;
	skipped: number;
	errors: SyncError[];
	durationMs: number;
	completedAt: Date;
}

export interface SyncError {
	externalId: string;
	message: string;
	timestamp: Date;
}

export interface SyncJob<TExternal, TLocal = unknown> {
	/** Unique name for this sync job */
	name: string;

	/** Fetch all items from external system */
	fetchExternal: () => Promise<TExternal[]>;

	/** Get external ID from an item */
	getExternalId: (item: TExternal) => string;

	/** Find local item by external ID */
	findLocal: (externalId: string) => Promise<TLocal | null>;

	/** Create new local item from external data */
	create: (item: TExternal) => Promise<void>;

	/** Update existing local item from external data */
	update: (item: TExternal, local: TLocal) => Promise<void>;

	/** Optional: Delete local item */
	delete?: (local: TLocal) => Promise<void>;

	/** Optional: Check if item should be skipped */
	shouldSkip?: (item: TExternal) => boolean;

	/** Optional: Called before sync starts */
	onStart?: () => Promise<void>;

	/** Optional: Called after sync completes */
	onComplete?: (results: SyncResults) => Promise<void>;
}

/**
 * Run a sync job immediately
 */
export async function runSync<TExternal, TLocal>(
	job: SyncJob<TExternal, TLocal>
): Promise<SyncResults> {
	const startTime = performance.now();
	const results: SyncResults = {
		name: job.name,
		created: 0,
		updated: 0,
		deleted: 0,
		skipped: 0,
		errors: [],
		durationMs: 0,
		completedAt: new Date()
	};

	try {
		await job.onStart?.();

		const externalItems = await job.fetchExternal();
		console.debug(`[Sync:${job.name}] Fetched ${externalItems.length} items`);

		for (const item of externalItems) {
			const externalId = job.getExternalId(item);

			try {
				if (job.shouldSkip?.(item)) {
					results.skipped++;
					continue;
				}

				const local = await job.findLocal(externalId);

				if (local) {
					await job.update(item, local);
					results.updated++;
				} else {
					await job.create(item);
					results.created++;
				}
			} catch (e) {
				results.errors.push({
					externalId,
					message: e instanceof Error ? e.message : String(e),
					timestamp: new Date()
				});
			}
		}

		results.durationMs = performance.now() - startTime;
		results.completedAt = new Date();

		console.log(
			`[Sync:${job.name}] Complete: ${results.created} created, ${results.updated} updated, ${results.errors.length} errors (${results.durationMs.toFixed(0)}ms)`
		);

		await job.onComplete?.(results);

		// Emit completion event
		await emitPersistent("sync.completed", {
			syncName: job.name,
			created: results.created,
			updated: results.updated,
			errors: results.errors.length
		});
	} catch (e) {
		console.error(`[Sync:${job.name}] Fatal error:`, e);
		results.errors.push({
			externalId: "_fatal",
			message: e instanceof Error ? e.message : String(e),
			timestamp: new Date()
		});
		results.durationMs = performance.now() - startTime;
	}

	return results;
}

/**
 * Sync a single item (useful for webhook handlers)
 */
export async function syncSingleItem<TExternal, TLocal>(
	job: Pick<
		SyncJob<TExternal, TLocal>,
		"name" | "getExternalId" | "findLocal" | "create" | "update"
	>,
	item: TExternal
): Promise<{ action: "created" | "updated"; externalId: string }> {
	const externalId = job.getExternalId(item);
	const local = await job.findLocal(externalId);

	if (local) {
		await job.update(item, local);
		return { action: "updated", externalId };
	} else {
		await job.create(item);
		return { action: "created", externalId };
	}
}

// Registry of sync jobs for queue-based execution
const syncJobs = new Map<string, SyncJob<unknown, unknown>>();

/**
 * Register a sync job for queue-based execution
 */
export function registerSyncJob<TExternal, TLocal>(job: SyncJob<TExternal, TLocal>): void {
	syncJobs.set(job.name, job as SyncJob<unknown, unknown>);

	// Register queue handler
	registerHandler(`sync.${job.name}`, async () => {
		await runSync(job);
	});

}

/**
 * Trigger a registered sync job via queue
 */
export async function triggerSync(name: string): Promise<number> {
	if (!syncJobs.has(name)) {
		throw new Error(`Sync job not registered: ${name}`);
	}
	return enqueue(`sync.${name}`, {});
}

/**
 * Schedule a sync job to run at regular intervals
 */
export async function scheduleSyncJob(name: string, intervalMs: number): Promise<void> {
	if (!syncJobs.has(name)) {
		throw new Error(`Sync job not registered: ${name}`);
	}

	// Register a handler that re-schedules after completion
	const originalHandler = syncJobs.get(name)!;
	registerHandler(`sync.${name}.recurring`, async () => {
		await runSync(originalHandler);

		// Schedule next run
		await scheduleRecurring(`sync.${name}.recurring`, {}, intervalMs);
	});

	// Start the recurring schedule
	await scheduleRecurring(`sync.${name}.recurring`, {}, intervalMs);

}

/**
 * Common sync intervals
 */
export const syncIntervals = {
	minutes: (n: number) => n * 60 * 1000,
	hours: (n: number) => n * 60 * 60 * 1000,
	days: (n: number) => n * 24 * 60 * 60 * 1000
};
