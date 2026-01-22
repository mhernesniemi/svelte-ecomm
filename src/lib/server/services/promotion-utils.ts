/**
 * Pure promotion calculation functions
 * No database or environment dependencies
 */

export interface PromotionData {
	discountType: "percentage" | "fixed_amount";
	discountValue: number;
}

/**
 * Calculate discount amount for a promotion
 */
export function calculateDiscount(promotion: PromotionData, orderAmount: number): number {
	if (promotion.discountType === "percentage") {
		return Math.round(orderAmount * (promotion.discountValue / 100));
	}

	// Fixed amount - don't exceed order amount
	return Math.min(promotion.discountValue, orderAmount);
}
