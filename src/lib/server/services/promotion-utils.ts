/**
 * Pure promotion calculation functions
 * No database or environment dependencies
 */

export interface PromotionData {
	discountType: "percentage" | "fixed_amount";
	discountValue: number;
}

export interface PromotionCombineData {
	combinesWithOtherPromotions: boolean;
}

/**
 * Calculate discount amount for a promotion applied to the full order
 */
export function calculateDiscount(promotion: PromotionData, orderAmount: number): number {
	if (promotion.discountType === "percentage") {
		return Math.round(orderAmount * (promotion.discountValue / 100));
	}

	// Fixed amount - don't exceed order amount
	return Math.min(promotion.discountValue, orderAmount);
}

/**
 * Calculate discount amount for a promotion applied to qualifying products only
 */
export function calculateProductDiscount(
	promotion: PromotionData,
	qualifyingLineTotal: number
): number {
	if (promotion.discountType === "percentage") {
		return Math.round(qualifyingLineTotal * (promotion.discountValue / 100));
	}

	// Fixed amount - don't exceed qualifying total
	return Math.min(promotion.discountValue, qualifyingLineTotal);
}

/**
 * Check if a new promotion can be combined with existing applied promotions.
 * Returns true if all existing promotions and the new one allow combining,
 * or if there are no existing promotions.
 */
export function canCombinePromotions(
	existingPromotions: PromotionCombineData[],
	newPromotion: PromotionCombineData
): boolean {
	if (existingPromotions.length === 0) return true;

	// The new promotion must allow combining
	if (!newPromotion.combinesWithOtherPromotions) return false;

	// All existing promotions must also allow combining
	return existingPromotions.every((p) => p.combinesWithOtherPromotions);
}
