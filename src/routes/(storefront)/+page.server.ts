import { productService } from "$lib/server/services/products.js";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
	// Get featured products (public only)
	const result = await productService.list({
		language: "en",
		visibility: "public",
		limit: 8
	});

	return {
		featuredProducts: result.items
	};
};
