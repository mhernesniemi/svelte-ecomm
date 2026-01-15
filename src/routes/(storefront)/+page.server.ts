import { productService } from "$lib/server/services/products.js";
import { languageTag } from "$lib/paraglide/runtime.js";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
	const language = languageTag();

	// Get featured products
	const result = await productService.list({
		language,
		enabled: true,
		limit: 8
	});

	return {
		featuredProducts: result.items
	};
};
