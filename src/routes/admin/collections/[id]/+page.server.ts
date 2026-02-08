import type { PageServerLoad, Actions } from "./$types";
import { collectionService } from "$lib/server/services/collections.js";
import { facetService } from "$lib/server/services/facets.js";
import { productService } from "$lib/server/services/products.js";
import { error, fail, redirect, isRedirect } from "@sveltejs/kit";
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

	// Get matching products for the data table
	const preview = await collectionService.getProductsForCollection(id, {
		language: "en",
		limit: 100
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
		const isPrivate = data.get("is_private") === "on";
		const filtersJson = data.get("filters") as string | null;

		if (!name || !slug) {
			return fail(400, { error: "Name and slug are required" });
		}

		try {
			await collectionService.update(id, {
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

			// Replace filters if provided
			if (filtersJson) {
				const filters = JSON.parse(filtersJson);
				await collectionService.replaceFilters(id, filters);
			}

			return { success: true, message: "Collection updated successfully" };
		} catch (err) {
			return fail(500, { error: "Failed to update collection" });
		}
	},

	preview: async ({ request }) => {
		const data = await request.formData();
		const filtersJson = data.get("filters") as string;

		try {
			const filters = JSON.parse(filtersJson);
			const result = await collectionService.previewFilters(filters, {
				language: "en",
				limit: 100
			});
			return { preview: result.products, productCount: result.total };
		} catch {
			return fail(400, { error: "Invalid filters" });
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
