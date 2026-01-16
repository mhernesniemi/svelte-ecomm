import { productService } from "$lib/server/services/products.js";
import { facetService } from "$lib/server/services/facets.js";
import { assetService } from "$lib/server/services/assets.js";
import { error, fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);

	if (isNaN(id)) {
		throw error(404, "Invalid product ID");
	}

	const product = await productService.getById(id, "en");

	if (!product) {
		throw error(404, "Product not found");
	}

	const facets = await facetService.list("en");

	return {
		product,
		facets
	};
};

export const actions: Actions = {
	update: async ({ params, request }) => {
		const id = Number(params.id);
		const formData = await request.formData();

		const nameEn = formData.get("name_en") as string;
		const nameFi = formData.get("name_fi") as string;
		const slugEn = formData.get("slug_en") as string;
		const slugFi = formData.get("slug_fi") as string;
		const descriptionEn = formData.get("description_en") as string;
		const descriptionFi = formData.get("description_fi") as string;
		const visibility = formData.get("visibility") as "public" | "private" | "hidden";

		if (!nameEn || !slugEn) {
			return fail(400, { error: "English name and slug are required" });
		}

		try {
			await productService.update(id, {
				visibility,
				translations: [
					{
						languageCode: "en",
						name: nameEn,
						slug: slugEn,
						description: descriptionEn || undefined
					},
					{
						languageCode: "fi",
						name: nameFi || nameEn,
						slug: slugFi || slugEn,
						description: descriptionFi || undefined
					}
				]
			});

			return { success: true };
		} catch (e) {
			return fail(500, { error: "Failed to update product" });
		}
	},

	delete: async ({ params }) => {
		const id = Number(params.id);

		await productService.delete(id);

		throw redirect(303, "/admin/products");
	},

	updateFacetValues: async ({ params, request }) => {
		const productId = Number(params.id);
		const formData = await request.formData();
		const facetValueIds = formData.getAll("facetValueIds").map(Number);

		try {
			// Get current facet values
			const product = await productService.getById(productId, "en");
			if (!product) {
				return fail(404, { error: "Product not found" });
			}

			const currentIds = product.facetValues.map((fv) => fv.id);

			// Remove unchecked values
			for (const id of currentIds) {
				if (!facetValueIds.includes(id)) {
					await productService.removeFacetValue(productId, id);
				}
			}

			// Add newly checked values
			for (const id of facetValueIds) {
				if (!currentIds.includes(id)) {
					await productService.addFacetValue(productId, id);
				}
			}

			return { facetSuccess: true };
		} catch (e) {
			return fail(500, { error: "Failed to update facet values" });
		}
	},

	updateVariantFacetValues: async ({ request }) => {
		const formData = await request.formData();
		const variantId = Number(formData.get("variantId"));
		const facetValueIds = formData.getAll("facetValueIds").map(Number);

		if (isNaN(variantId)) {
			return fail(400, { error: "Invalid variant ID" });
		}

		try {
			// Get current facet values for this variant
			const variant = await productService.getVariantById(variantId, "en");
			if (!variant) {
				return fail(404, { error: "Variant not found" });
			}

			const currentIds = variant.facetValues.map((fv) => fv.id);

			// Remove unchecked values
			for (const id of currentIds) {
				if (!facetValueIds.includes(id)) {
					await productService.removeVariantFacetValue(variantId, id);
				}
			}

			// Add newly checked values
			for (const id of facetValueIds) {
				if (!currentIds.includes(id)) {
					await productService.addVariantFacetValue(variantId, id);
				}
			}

			return { variantFacetSuccess: true };
		} catch (e) {
			return fail(500, { error: "Failed to update variant facet values" });
		}
	},

	addVariant: async ({ params, request }) => {
		const productId = Number(params.id);
		const formData = await request.formData();

		const sku = formData.get("sku") as string;
		const price = Number(formData.get("price")) * 100; // Convert to cents
		const stock = Number(formData.get("stock")) || 0;
		const nameEn = formData.get("variant_name_en") as string;

		if (!sku || isNaN(price)) {
			return fail(400, { variantError: "SKU and price are required" });
		}

		try {
			await productService.createVariant({
				productId,
				sku,
				price,
				stock,
				translations: nameEn ? [{ languageCode: "en", name: nameEn }] : []
			});

			return { variantSuccess: true };
		} catch (e) {
			return fail(500, { variantError: "Failed to create variant" });
		}
	},

	addImage: async ({ params, request }) => {
		const productId = Number(params.id);
		const formData = await request.formData();

		const url = formData.get("url") as string;
		const name = formData.get("name") as string;
		const fileId = formData.get("fileId") as string;
		const width = Number(formData.get("width")) || 0;
		const height = Number(formData.get("height")) || 0;
		const fileSize = Number(formData.get("fileSize")) || 0;

		if (!url || !name) {
			return fail(400, { imageError: "Image data is required" });
		}

		try {
			const asset = await assetService.create({ name, url, fileId, width, height, fileSize });
			await assetService.addToProduct(productId, asset.id);
			return { imageSuccess: true };
		} catch (e) {
			return fail(500, { imageError: "Failed to add image" });
		}
	},

	removeImage: async ({ params, request }) => {
		const productId = Number(params.id);
		const formData = await request.formData();
		const assetId = Number(formData.get("assetId"));

		if (isNaN(assetId)) {
			return fail(400, { imageError: "Invalid asset ID" });
		}

		try {
			await assetService.removeFromProduct(productId, assetId);
			await assetService.delete(assetId);
			return { imageRemoved: true };
		} catch (e) {
			return fail(500, { imageError: "Failed to remove image" });
		}
	},

	setFeaturedImage: async ({ params, request }) => {
		const productId = Number(params.id);
		const formData = await request.formData();
		const assetId = Number(formData.get("assetId"));

		if (isNaN(assetId)) {
			return fail(400, { imageError: "Invalid asset ID" });
		}

		try {
			await assetService.setFeaturedAsset(productId, assetId);
			return { featuredSet: true };
		} catch (e) {
			return fail(500, { imageError: "Failed to set featured image" });
		}
	}
};
