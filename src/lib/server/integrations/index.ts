/**
 * Integration Utilities
 *
 * Lightweight, PostgreSQL-native patterns for integrating external systems
 * (ERP, PIM, etc.) without external dependencies like Redis or job queues.
 *
 * Key Features:
 * - Persistent job queue backed by PostgreSQL
 * - Transactional event outbox (events survive crashes)
 * - Automatic retry with exponential backoff
 * - Webhook handling with signature verification
 * - Sync patterns for data synchronization
 */

// Job Queue
export {
	enqueue,
	enqueueInTransaction,
	registerHandler,
	startWorker,
	isWorkerRunning,
	getQueueStats,
	getFailedJobs,
	retryJob,
	cleanupOldJobs,
	scheduleRecurring,
	type EnqueueOptions,
	type WorkerOptions,
	type QueueStats
} from "./queue.js";

// Events (with transactional outbox support)
export {
	events,
	emit,
	emitPersistent,
	emitInTransaction,
	on,
	onPersistent,
	type EventMap
} from "./events.js";

// Sync Runner
export {
	runSync,
	syncSingleItem,
	registerSyncJob,
	triggerSync,
	scheduleSyncJob,
	syncIntervals,
	type SyncJob,
	type SyncResults,
	type SyncError
} from "./sync.js";

// Retry Utilities
export {
	withRetry,
	isTransientError,
	createRetryFetch,
	type RetryOptions
} from "./retry.js";

// Webhook Handling
export {
	createWebhookHandler,
	verifyHmacSha256,
	signatureVerifiers,
	type WebhookConfig
} from "./webhooks.js";
