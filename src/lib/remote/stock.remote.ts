/**
 * Stock Remote Functions
 *
 * Used to fetch real-time stock data on statically prerendered product pages.
 * This bypasses the ISR cache to ensure accurate stock availability.
 */
import { command } from "$app/server";
import { db } from "$lib/server/db/index.js";
import { productVariants } from "$lib/server/db/schema.js";
import { inArray, and, isNull } from "drizzle-orm";

/**
 * Get current stock levels for multiple variants.
 * Called from product pages to show real-time availability.
 */
export const getVariantStock = command(
	"unchecked",
	async (variantIds: number[]): Promise<{ variantId: number; stock: number }[]> => {
		if (!variantIds.length) return [];

		const variants = await db
			.select({ id: productVariants.id, stock: productVariants.stock })
			.from(productVariants)
			.where(and(inArray(productVariants.id, variantIds), isNull(productVariants.deletedAt)));

		return variants.map((v) => ({ variantId: v.id, stock: v.stock }));
	}
);
