export type ActiveDiscount = {
	id: number;
	title: string | null;
	discountType: string;
	discountValue: number;
	promotionType: string;
	productIds: number[] | null;
};

/**
 * Find the best applicable discount for a product at a given price.
 * Returns the discount that saves the most money, or null if none apply.
 */
export function findBestDiscount(
	discounts: ActiveDiscount[],
	productId: number,
	price: number
): ActiveDiscount | null {
	if (discounts.length === 0 || price <= 0) return null;

	let best: ActiveDiscount | null = null;
	let bestAmount = 0;

	for (const d of discounts) {
		if (d.productIds !== null && !d.productIds.includes(productId)) continue;

		const amount =
			d.discountType === "percentage"
				? Math.round(price * (d.discountValue / 100))
				: Math.min(d.discountValue, price);

		if (amount > bestAmount) {
			bestAmount = amount;
			best = d;
		}
	}

	return best;
}

/**
 * Calculate the discounted price after applying a discount.
 */
export function getDiscountedPrice(discount: ActiveDiscount, price: number): number {
	if (discount.discountType === "percentage") {
		return price - Math.round(price * (discount.discountValue / 100));
	}
	return Math.max(0, price - discount.discountValue);
}
