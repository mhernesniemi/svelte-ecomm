import { productService } from "$lib/server/services/products.js";
import { facetService } from "$lib/server/services/facets.js";
import { customerGroupService } from "$lib/server/services/customerGroups.js";
import { error, fail, redirect } from "@sveltejs/kit";
import { DEFAULT_LANGUAGE } from "$lib/utils.js";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
	const productId = Number(params.id);
	const variantId = Number(params.variantId);

	if (isNaN(productId) || isNaN(variantId)) {
		throw error(404, "Invalid ID");
	}

	const [product, variant, facets, customerGroups, groupPrices] = await Promise.all([
		productService.getById(productId, locals.language),
		productService.getVariantById(variantId, locals.language),
		facetService.list(locals.language),
		customerGroupService.list(),
		productService.getGroupPrices(variantId)
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
		facets,
		customerGroups,
		groupPrices
	};
};

export const actions: Actions = {
	update: async ({ params, request }) => {
		const variantId = Number(params.variantId);
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

		const groupPricingEnabled = formData.get("groupPricingEnabled") === "on";
		const groupPriceGroupIds = formData.getAll("groupPriceGroupId").map(Number);
		const groupPricePrices = formData.getAll("groupPricePrice").map(Number);

		if (!sku || isNaN(price)) {
			return fail(400, { error: "SKU and price are required" });
		}

		try {
			await productService.updateVariant(variantId, {
				sku,
				price,
				stock,
				trackInventory,
				translations: [{ languageCode: DEFAULT_LANGUAGE, name: name || undefined }]
			});

			// Sync facet values
			const variant = await productService.getVariantById(variantId);
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

			// Sync group prices
			const currentGroupPrices = await productService.getGroupPrices(variantId);
			if (groupPricingEnabled) {
				const desiredGroupIds = new Set(groupPriceGroupIds);

				// Remove group prices no longer in the list
				for (const gp of currentGroupPrices) {
					if (!desiredGroupIds.has(gp.groupId)) {
						await productService.removeGroupPrice(variantId, gp.groupId);
					}
				}

				// Upsert desired group prices
				for (let i = 0; i < groupPriceGroupIds.length; i++) {
					const groupId = groupPriceGroupIds[i];
					const groupPrice = Math.round(groupPricePrices[i] * 100);
					if (!isNaN(groupId) && !isNaN(groupPrice) && groupPrice >= 0) {
						await productService.setGroupPrice(variantId, groupId, groupPrice);
					}
				}
			} else {
				// Disabled — remove all group prices
				for (const gp of currentGroupPrices) {
					await productService.removeGroupPrice(variantId, gp.groupId);
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
