import { productService } from "$lib/server/services/products.js";
import { facetService } from "$lib/server/services/facets.js";
import { error, fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
	const productId = Number(params.id);
	const variantId = Number(params.variantId);

	if (isNaN(productId) || isNaN(variantId)) {
		throw error(404, "Invalid ID");
	}

	const [product, variant, facets] = await Promise.all([
		productService.getById(productId, "en"),
		productService.getVariantById(variantId, "en"),
		facetService.list("en")
	]);

	if (!product) {
		throw error(404, "Product not found");
	}

	if (!variant) {
		throw error(404, "Variant not found");
	}

	return {
		product: { id: product.id, name: product.translations[0]?.name ?? "Product" },
		variant,
		facets
	};
};

export const actions: Actions = {
	update: async ({ params, request }) => {
		const variantId = Number(params.variantId);
		const formData = await request.formData();

		const sku = formData.get("sku") as string;
		const price = Number(formData.get("price")) * 100; // Convert to cents
		const stock = Number(formData.get("stock")) || 0;
		const name = formData.get("variant_name") as string;
		const facetValueIds = formData.getAll("facetValueIds").map(Number).filter((id) => !isNaN(id));

		if (!sku || isNaN(price)) {
			return fail(400, { error: "SKU and price are required" });
		}

		try {
			await productService.updateVariant(variantId, {
				sku,
				price,
				stock,
				translations: [{ languageCode: "en", name: name || undefined }]
			});

			// Sync facet values
			const variant = await productService.getVariantById(variantId, "en");
			if (variant) {
				const currentIds = variant.facetValues.map((fv) => fv.id);
				for (const id of currentIds) {
					if (!facetValueIds.includes(id)) {
						await productService.removeVariantFacetValue(variantId, id);
					}
				}
				for (const id of facetValueIds) {
					if (!currentIds.includes(id)) {
						await productService.addVariantFacetValue(variantId, id);
					}
				}
			}

			return { success: true };
		} catch (e) {
			return fail(500, { error: "Failed to update variant" });
		}
	},

	delete: async ({ params }) => {
		const productId = Number(params.id);
		const variantId = Number(params.variantId);

		await productService.deleteVariant(variantId);

		throw redirect(303, `/admin/products/${productId}?variantDeleted=1`);
	}
};
