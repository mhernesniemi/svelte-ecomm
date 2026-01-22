/**
 * Search Remote Functions
 */
import { command } from "$app/server";
import { productService } from "$lib/server/services/index.js";

export interface SearchResult {
	id: number;
	name: string;
	slug: string;
	price: number;
	image: string | null;
}

/**
 * Search products by query string
 */
export const searchProducts = command("unchecked", async (query: string): Promise<SearchResult[]> => {
	if (!query || query.trim().length < 2) {
		return [];
	}

	const result = await productService.list({
		search: query.trim(),
		limit: 8,
		visibility: "public"
	});

	return result.items.map((product) => {
		const translation = product.translations.find((t) => t.languageCode === "en");
		const defaultVariant = product.variants[0];

		return {
			id: product.id,
			name: translation?.name || "Untitled",
			slug: translation?.slug || "",
			price: defaultVariant?.price || 0,
			image: product.featuredAsset?.source || null
		};
	});
});
