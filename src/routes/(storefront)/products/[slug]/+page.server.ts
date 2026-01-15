import { productService } from "$lib/server/services/products.js";
import { languageTag } from "$lib/paraglide/runtime.js";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
	const language = languageTag();
	const product = await productService.getBySlug(params.slug, language);

	if (!product || !product.enabled) {
		throw error(404, "Product not found");
	}

	return { product };
};
