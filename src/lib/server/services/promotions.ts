/**
 * Promotion Service
 * Handles coupon codes and discounts
 */
import { eq, and, desc, sql, gte, lte, or, isNull } from "drizzle-orm";
import { db } from "../db/index.js";
import { promotions } from "../db/schema.js";
import type { Promotion, CreatePromotionInput, PaginatedResult } from "$lib/types.js";

export class PromotionService {
	/**
	 * Create a new promotion
	 */
	async create(input: CreatePromotionInput): Promise<Promotion> {
		const [promotion] = await db
			.insert(promotions)
			.values({
				code: input.code.toUpperCase(),
				discountType: input.discountType,
				discountValue: input.discountValue,
				minOrderAmount: input.minOrderAmount,
				usageLimit: input.usageLimit,
				startsAt: input.startsAt,
				endsAt: input.endsAt,
				enabled: true,
				usageCount: 0
			})
			.returning();

		return promotion;
	}

	/**
	 * Get promotion by ID
	 */
	async getById(id: number): Promise<Promotion | null> {
		const [promotion] = await db.select().from(promotions).where(eq(promotions.id, id));

		return promotion ?? null;
	}

	/**
	 * Get promotion by code
	 */
	async getByCode(code: string): Promise<Promotion | null> {
		const [promotion] = await db
			.select()
			.from(promotions)
			.where(eq(promotions.code, code.toUpperCase()));

		return promotion ?? null;
	}

	/**
	 * List all promotions
	 */
	async list(
		options: {
			enabled?: boolean;
			limit?: number;
			offset?: number;
		} = {}
	): Promise<PaginatedResult<Promotion>> {
		const { enabled, limit = 20, offset = 0 } = options;

		const conditions = enabled !== undefined ? [eq(promotions.enabled, enabled)] : [];

		const countResult = await db
			.select({ count: sql<number>`count(*)` })
			.from(promotions)
			.where(and(...conditions));

		const total = Number(countResult[0]?.count ?? 0);

		const items = await db
			.select()
			.from(promotions)
			.where(and(...conditions))
			.orderBy(desc(promotions.createdAt))
			.limit(limit)
			.offset(offset);

		return {
			items,
			pagination: {
				total,
				limit,
				offset,
				hasMore: offset + items.length < total
			}
		};
	}

	/**
	 * List active promotions (enabled, within date range, not exhausted)
	 */
	async listActive(): Promise<Promotion[]> {
		const now = new Date();

		const items = await db
			.select()
			.from(promotions)
			.where(
				and(
					eq(promotions.enabled, true),
					or(isNull(promotions.startsAt), lte(promotions.startsAt, now)),
					or(isNull(promotions.endsAt), gte(promotions.endsAt, now)),
					or(
						isNull(promotions.usageLimit),
						sql`${promotions.usageCount} < ${promotions.usageLimit}`
					)
				)
			);

		return items;
	}

	/**
	 * Update a promotion
	 */
	async update(
		id: number,
		input: Partial<Omit<CreatePromotionInput, "code"> & { enabled?: boolean }>
	): Promise<Promotion | null> {
		const [promotion] = await db.select().from(promotions).where(eq(promotions.id, id));

		if (!promotion) return null;

		const [updated] = await db
			.update(promotions)
			.set({
				...(input.discountType && { discountType: input.discountType }),
				...(input.discountValue !== undefined && { discountValue: input.discountValue }),
				...(input.minOrderAmount !== undefined && { minOrderAmount: input.minOrderAmount }),
				...(input.usageLimit !== undefined && { usageLimit: input.usageLimit }),
				...(input.startsAt !== undefined && { startsAt: input.startsAt }),
				...(input.endsAt !== undefined && { endsAt: input.endsAt }),
				...(input.enabled !== undefined && { enabled: input.enabled })
			})
			.where(eq(promotions.id, id))
			.returning();

		return updated;
	}

	/**
	 * Enable/disable a promotion
	 */
	async setEnabled(id: number, enabled: boolean): Promise<Promotion | null> {
		return this.update(id, { enabled });
	}

	/**
	 * Delete a promotion
	 */
	async delete(id: number): Promise<boolean> {
		await db.delete(promotions).where(eq(promotions.id, id));
		return true;
	}

	/**
	 * Validate a promotion code
	 * Returns the promotion if valid, or an error message if not
	 */
	async validate(
		code: string,
		orderAmount: number
	): Promise<{ valid: boolean; promotion?: Promotion; error?: string }> {
		const promotion = await this.getByCode(code);

		if (!promotion) {
			return { valid: false, error: "Invalid promotion code" };
		}

		if (!promotion.enabled) {
			return { valid: false, error: "Promotion is not active" };
		}

		const now = new Date();

		if (promotion.startsAt && promotion.startsAt > now) {
			return { valid: false, error: "Promotion has not started yet" };
		}

		if (promotion.endsAt && promotion.endsAt < now) {
			return { valid: false, error: "Promotion has expired" };
		}

		if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
			return { valid: false, error: "Promotion usage limit reached" };
		}

		if (promotion.minOrderAmount && orderAmount < promotion.minOrderAmount) {
			return {
				valid: false,
				error: `Minimum order amount of ${promotion.minOrderAmount / 100} required`
			};
		}

		return { valid: true, promotion };
	}

	/**
	 * Calculate discount amount for a promotion
	 */
	calculateDiscount(promotion: Promotion, orderAmount: number): number {
		if (promotion.discountType === "percentage") {
			return Math.round(orderAmount * (promotion.discountValue / 100));
		}

		// Fixed amount - don't exceed order amount
		return Math.min(promotion.discountValue, orderAmount);
	}
}

// Export singleton instance
export const promotionService = new PromotionService();
