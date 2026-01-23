import { describe, it, expect } from "vitest";
import { calculateDiscount, type PromotionData } from "./promotion-utils";

function createPromotion(overrides: Partial<PromotionData> = {}): PromotionData {
	return {
		discountType: "percentage",
		discountValue: 10,
		...overrides
	};
}

describe("calculateDiscount", () => {
	describe("percentage discounts", () => {
		it("calculates 10% discount", () => {
			const promotion = createPromotion({ discountType: "percentage", discountValue: 10 });
			expect(calculateDiscount(promotion, 10000)).toBe(1000);
		});

		it("calculates 25% discount", () => {
			const promotion = createPromotion({ discountType: "percentage", discountValue: 25 });
			expect(calculateDiscount(promotion, 10000)).toBe(2500);
		});

		it("rounds to nearest cent", () => {
			const promotion = createPromotion({ discountType: "percentage", discountValue: 10 });
			// 10% of 999 = 99.9, rounds to 100
			expect(calculateDiscount(promotion, 999)).toBe(100);
		});

		it("handles 100% discount", () => {
			const promotion = createPromotion({ discountType: "percentage", discountValue: 100 });
			expect(calculateDiscount(promotion, 5000)).toBe(5000);
		});
	});

	describe("fixed amount discounts", () => {
		it("applies fixed discount", () => {
			const promotion = createPromotion({ discountType: "fixed_amount", discountValue: 500 });
			expect(calculateDiscount(promotion, 10000)).toBe(500);
		});

		it("does not exceed order amount", () => {
			const promotion = createPromotion({
				discountType: "fixed_amount",
				discountValue: 5000
			});
			expect(calculateDiscount(promotion, 3000)).toBe(3000);
		});

		it("equals order amount when discount matches exactly", () => {
			const promotion = createPromotion({
				discountType: "fixed_amount",
				discountValue: 1000
			});
			expect(calculateDiscount(promotion, 1000)).toBe(1000);
		});
	});
});
