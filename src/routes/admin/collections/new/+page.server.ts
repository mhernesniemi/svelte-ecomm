import type { PageServerLoad, Actions } from "./$types";
import { collectionService } from "$lib/server/services/collections.js";
import { facetService } from "$lib/server/services/facets.js";
import { productService } from "$lib/server/services/products.js";
import { fail, redirect, isRedirect } from "@sveltejs/kit";
import { slugify } from "$lib/utils.js";

export const load: PageServerLoad = async () => {
	// Load facets for filter builder
	const facets = await facetService.list("en");

	// Load all products for manual selection (admin sees all visibility states)
	const { items: products } = await productService.list({
		language: "en",
		visibility: ["public", "private", "hidden"],
		limit: 100
	});

	return { facets, products };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();

		const name = data.get("name") as string;
		const slug = data.get("slug") as string;
		const description = data.get("description") as string;
		const enabled = data.get("enabled") === "on";
		const isPrivate = data.get("is_private") === "on";

		// Validate required fields
		if (!name || !slug) {
			return fail(400, {
				error: "Name and slug are required",
				name,
				slug,
				description
			});
		}

		try {
			const collection = await collectionService.create({
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

			throw redirect(303, `/admin/collections/${collection.id}`);
		} catch (err) {
			if (isRedirect(err)) throw err;
			return fail(500, {
				error: "Failed to create collection",
				name,
				slug,
				description
			});
		}
	}
};
