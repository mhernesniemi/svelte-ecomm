/**
 * Stock Reservation Service
 * Handles stock reservations for cart items to prevent overselling
 *
 * Reservation Pattern:
 * - Stock is reserved when items are added to cart
 * - Reservations expire after RESERVATION_TIMEOUT_MINUTES (released back to available)
 * - On payment: reservations confirmed, stock deducted
 * - On cancel: reservations released, stock restored (if paid)
 */
import { eq, and, gt, sql, sum } from "drizzle-orm";
import { db } from "../db/index.js";
import { stockReservations, productVariants } from "../db/schema.js";

// Reservation timeout in minutes
const RESERVATION_TIMEOUT_MINUTES = 15;

export class ReservationService {
	/**
	 * Get available stock for a variant (total stock minus active reservations)
	 */
	async getAvailableStock(variantId: number): Promise<number> {
		// Get variant's total stock and tracking setting
		const [variant] = await db
			.select({ stock: productVariants.stock, trackInventory: productVariants.trackInventory })
			.from(productVariants)
			.where(eq(productVariants.id, variantId));

		if (!variant) return 0;

		// If inventory tracking is disabled, stock is unlimited
		if (!variant.trackInventory) return Infinity;

		// Get sum of active (non-expired) reservations
		const [result] = await db
			.select({ reserved: sum(stockReservations.quantity) })
			.from(stockReservations)
			.where(
				and(
					eq(stockReservations.variantId, variantId),
					gt(stockReservations.expiresAt, new Date())
				)
			);

		const reserved = Number(result?.reserved ?? 0);

		return Math.max(0, variant.stock - reserved);
	}

	/**
	 * Get available stock for a variant, excluding reservations from a specific order
	 * Used when checking stock for existing cart items
	 */
	async getAvailableStockExcludingOrder(variantId: number, orderId: number): Promise<number> {
		// Get variant's total stock and tracking setting
		const [variant] = await db
			.select({ stock: productVariants.stock, trackInventory: productVariants.trackInventory })
			.from(productVariants)
			.where(eq(productVariants.id, variantId));

		if (!variant) return 0;

		// If inventory tracking is disabled, stock is unlimited
		if (!variant.trackInventory) return Infinity;

		// Get sum of active (non-expired) reservations excluding this order
		const [result] = await db
			.select({ reserved: sum(stockReservations.quantity) })
			.from(stockReservations)
			.where(
				and(
					eq(stockReservations.variantId, variantId),
					gt(stockReservations.expiresAt, new Date()),
					sql`${stockReservations.orderId} != ${orderId}`
				)
			);

		const reserved = Number(result?.reserved ?? 0);

		return Math.max(0, variant.stock - reserved);
	}

	/**
	 * Create a reservation for a cart line item
	 */
	async reserve(
		variantId: number,
		orderId: number,
		orderLineId: number,
		quantity: number
	): Promise<void> {
		const expiresAt = new Date(Date.now() + RESERVATION_TIMEOUT_MINUTES * 60 * 1000);

		await db.insert(stockReservations).values({
			variantId,
			orderId,
			orderLineId,
			quantity,
			expiresAt
		});
	}

	/**
	 * Update reservation quantity for an existing order line
	 */
	async updateQuantity(orderLineId: number, quantity: number): Promise<void> {
		// Extend expiry when quantity is updated
		const expiresAt = new Date(Date.now() + RESERVATION_TIMEOUT_MINUTES * 60 * 1000);

		await db
			.update(stockReservations)
			.set({ quantity, expiresAt })
			.where(eq(stockReservations.orderLineId, orderLineId));
	}

	/**
	 * Release reservation for a single order line
	 */
	async release(orderLineId: number): Promise<void> {
		await db.delete(stockReservations).where(eq(stockReservations.orderLineId, orderLineId));
	}

	/**
	 * Release all reservations for an order
	 */
	async releaseForOrder(orderId: number): Promise<void> {
		await db.delete(stockReservations).where(eq(stockReservations.orderId, orderId));
	}

	/**
	 * Extend reservation expiry for an order (e.g., during checkout)
	 */
	async extendForOrder(orderId: number, additionalMinutes?: number): Promise<void> {
		const minutes = additionalMinutes ?? RESERVATION_TIMEOUT_MINUTES;
		const newExpiry = new Date(Date.now() + minutes * 60 * 1000);

		await db
			.update(stockReservations)
			.set({ expiresAt: newExpiry })
			.where(eq(stockReservations.orderId, orderId));
	}

	/**
	 * Get reservation for an order line
	 */
	async getByOrderLineId(orderLineId: number) {
		const [reservation] = await db
			.select()
			.from(stockReservations)
			.where(eq(stockReservations.orderLineId, orderLineId));

		return reservation ?? null;
	}

	/**
	 * Get all reservations for an order
	 */
	async getForOrder(orderId: number) {
		return db.select().from(stockReservations).where(eq(stockReservations.orderId, orderId));
	}

	/**
	 * Clean up expired reservations (can be called periodically)
	 */
	async cleanupExpired(): Promise<number> {
		const result = await db
			.delete(stockReservations)
			.where(sql`${stockReservations.expiresAt} <= NOW()`)
			.returning({ id: stockReservations.id });

		return result.length;
	}
}

// Export singleton instance
export const reservationService = new ReservationService();
