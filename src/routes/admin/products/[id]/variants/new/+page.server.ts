import { productService } from "$lib/server/services/products.js";
import { facetService } from "$lib/server/services/facets.js";
import { error, fail, redirect, isRedirect } from "@sveltejs/kit";
import { DEFAULT_LANGUAGE } from "$lib/utils.js";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
	const productId = Number(params.id);

	if (isNaN(productId)) {
		throw error(404, "Invalid product ID");
	}

	const product = await productService.getById(productId, locals.language);

	if (!product) {
		throw error(404, "Product not found");
	}

	const facets = await facetService.list(locals.language);

	return {
		product: { id: product.id, name: product.name },
		facets
	};
};

export const actions: Actions = {
	default: async ({ params, request }) => {
		const productId = Number(params.id);
		const formData = await request.formData();

		const sku = formData.get("sku") as string;
		const price = Number(formData.get("price")) * 100; // Convert to cents
		const trackInventory = formData.get("trackInventory") === "on";
		const stock = trackInventory ? Number(formData.get("stock")) || 0 : 0;
		const name = formData.get("variant_name") as string;
		const facetValueIds = formData
			.getAll("facetValueIds")
			.map(Number)
			.filter((id) => !isNaN(id));

		if (!sku || isNaN(price)) {
			return fail(400, { error: "SKU and price are required", sku, name, stock });
		}

		try {
			const variant = await productService.createVariant({
				productId,
				sku,
				price,
				stock,
				trackInventory,
				translations: name ? [{ languageCode: DEFAULT_LANGUAGE, name }] : []
			});

			// Add facet values to the variant
			for (const fvId of facetValueIds) {
				await productService.addVariantFacetValue(variant.id, fvId);
			}

			throw redirect(303, `/admin/products/${productId}?variantCreated=1`);
		} catch (err) {
			if (isRedirect(err)) throw err;
			return fail(500, { error: "Failed to create variant", sku, name, stock });
		}
	}
};
