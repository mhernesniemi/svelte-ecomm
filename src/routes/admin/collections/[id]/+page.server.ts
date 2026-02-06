import type { PageServerLoad, Actions } from "./$types";
import { collectionService } from "$lib/server/services/collections.js";
import { facetService } from "$lib/server/services/facets.js";
import { productService } from "$lib/server/services/products.js";
import { error, fail, redirect, isRedirect } from "@sveltejs/kit";
import type { CollectionFilterField, CollectionFilterOperator } from "$lib/types.js";
import { slugify } from "$lib/utils.js";

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);
	if (isNaN(id)) {
		throw error(400, "Invalid collection ID");
	}

	const collection = await collectionService.getById(id);
	if (!collection) {
		throw error(404, "Collection not found");
	}

	// Load facets for filter builder
	const facets = await facetService.list("en");

	// Load all products for manual selection (admin sees all visibility states)
	const { items: products } = await productService.list({
		language: "en",
		visibility: ["public", "private", "draft"],
		limit: 100
	});

	// Get product count
	const productCount = await collectionService.getProductCount(id);

	// Get preview of matching products
	const preview = await collectionService.getProductsForCollection(id, {
		language: "en",
		limit: 6
	});

	return { collection, facets, products, productCount, preview: preview.items };
};

export const actions: Actions = {
	update: async ({ params, request }) => {
		const id = Number(params.id);
		const data = await request.formData();

		const name = data.get("name") as string;
		const slug = data.get("slug") as string;
		const description = data.get("description") as string;
		const enabled = data.get("enabled") === "on";
		const isPrivate = data.get("is_private") === "on";

		if (!name || !slug) {
			return fail(400, { error: "Name and slug are required" });
		}

		try {
			await collectionService.update(id, {
				enabled,
				isPrivate,
				translations: [
					{
						languageCode: "en",
						name,
						slug: slugify(slug),
						description: description || undefined
					}
				]
			});

			return { success: true, message: "Collection updated successfully" };
		} catch (err) {
			return fail(500, { error: "Failed to update collection" });
		}
	},

	addFilter: async ({ params, request }) => {
		const id = Number(params.id);
		const data = await request.formData();

		const field = data.get("field") as CollectionFilterField;
		const operator = data.get("operator") as CollectionFilterOperator;
		const valueStr = data.get("value") as string;

		if (!field || !operator || !valueStr) {
			return fail(400, { error: "Field, operator, and value are required" });
		}

		// Parse value based on field type
		let value: unknown;
		try {
			if (field === "facet" || field === "product" || field === "variant") {
				// Array of IDs
				value = valueStr
					.split(",")
					.map((v) => Number(v.trim()))
					.filter((v) => !isNaN(v));
			} else if (field === "visibility") {
				value = valueStr; // "public", "private", or "draft"
			} else if (field === "price" || field === "stock") {
				value = Number(valueStr);
			} else {
				value = valueStr;
			}
		} catch {
			return fail(400, { error: "Invalid value format" });
		}

		try {
			await collectionService.addFilter(id, { field, operator, value });
			return { success: true, message: "Filter added" };
		} catch (err) {
			return fail(500, { error: "Failed to add filter" });
		}
	},

	removeFilter: async ({ request }) => {
		const data = await request.formData();
		const filterId = Number(data.get("filterId"));

		if (!filterId) {
			return fail(400, { error: "Filter ID is required" });
		}

		try {
			await collectionService.removeFilter(filterId);
			return { success: true, message: "Filter removed" };
		} catch (err) {
			return fail(500, { error: "Failed to remove filter" });
		}
	},

	delete: async ({ params }) => {
		const id = Number(params.id);

		try {
			await collectionService.delete(id);
			throw redirect(303, "/admin/collections");
		} catch (err) {
			if (isRedirect(err)) throw err;
			return fail(500, { error: "Failed to delete collection" });
		}
	}
};
