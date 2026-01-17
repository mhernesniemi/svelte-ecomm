import { json } from "@sveltejs/kit";
import { productService } from "$lib/server/services/index.js";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url }) => {
	const query = url.searchParams.get("q")?.trim() || "";

	if (query.length < 2) {
		return json([]);
	}

	const result = await productService.list({
		search: query,
		limit: 8,
		visibility: "public"
	});

	// Return minimal data for search results
	const items = result.items.map((product) => {
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

	return json(items);
};
