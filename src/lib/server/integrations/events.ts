/**
 * Event System with Transactional Outbox
 *
 * Two modes of operation:
 * 1. In-memory events (immediate, not persisted) - for non-critical notifications
 * 2. Persistent events via job queue (transactional) - for critical integrations
 *
 * Use persistent events when:
 * - The event must not be lost (order.paid → ERP sync)
 * - The event should survive server restarts
 * - You need retry on failure
 */

import { enqueue, enqueueInTransaction, registerHandler } from "./queue.js";
import type { PgTransaction } from "drizzle-orm/pg-core";

// Event payload types
export type EventMap = {
	"order.created": { orderId: number };
	"order.paid": { orderId: number };
	"order.shipped": { orderId: number; trackingNumber?: string };
	"order.cancelled": { orderId: number; reason?: string };
	"product.created": { productId: number };
	"product.updated": { productId: number };
	"product.deleted": { productId: number };
	"customer.created": { customerId: number };
	"customer.updated": { customerId: number };
	"inventory.low": { variantId: number; sku: string; stock: number; threshold: number };
	"sync.completed": { syncName: string; created: number; updated: number; errors: number };
};

type EventHandler<T> = (payload: T) => Promise<void> | void;

// In-memory handler registry (for immediate, non-critical events)
const memoryHandlers = new Map<string, EventHandler<unknown>[]>();

/**
 * Subscribe to an event (in-memory, immediate execution)
 * Use this for non-critical side effects that don't need persistence
 */
export function on<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): () => void {
	const handlers = memoryHandlers.get(event) || [];
	handlers.push(handler as EventHandler<unknown>);
	memoryHandlers.set(event, handlers);

	// Return unsubscribe function
	return () => {
		const current = memoryHandlers.get(event) || [];
		memoryHandlers.set(
			event,
			current.filter((h) => h !== handler)
		);
	};
}

/**
 * Emit an event (in-memory, immediate execution)
 * Handlers run concurrently, failures are logged but don't stop other handlers
 */
export async function emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): Promise<void> {
	const handlers = memoryHandlers.get(event) || [];

	if (handlers.length === 0) return;

	const results = await Promise.allSettled(handlers.map((h) => h(payload)));

	for (const result of results) {
		if (result.status === "rejected") {
			console.error(`[Events] Handler failed for ${event}:`, result.reason);
		}
	}
}

/**
 * Emit a persistent event (via job queue)
 * Use this for critical events that must not be lost
 */
export async function emitPersistent<K extends keyof EventMap>(
	event: K,
	payload: EventMap[K]
): Promise<void> {
	await enqueue(`event.${event}`, payload as Record<string, unknown>);
}

/**
 * Emit a persistent event within a transaction (transactional outbox pattern)
 * The event is only persisted if the transaction commits
 */
export async function emitInTransaction<K extends keyof EventMap>(
	tx: PgTransaction<any, any, any>,
	event: K,
	payload: EventMap[K]
): Promise<void> {
	await enqueueInTransaction(tx, `event.${event}`, payload as Record<string, unknown>);
}

/**
 * Subscribe to a persistent event (via job queue)
 * Handler will be called by the queue worker with retry on failure
 */
export function onPersistent<K extends keyof EventMap>(
	event: K,
	handler: EventHandler<EventMap[K]>
): void {
	registerHandler(`event.${event}`, async (payload: Record<string, unknown>) => {
		await handler(payload as EventMap[K]);
	});
}

/**
 * Helper to create a typed event emitter for use in services
 */
export function createEventEmitter() {
	return {
		emit,
		emitPersistent,
		emitInTransaction,
		on,
		onPersistent
	};
}

export const events = createEventEmitter();
