import type { PageServerLoad, Actions } from "./$types";
import { collectionService } from "$lib/server/services/collections.js";
import { facetService } from "$lib/server/services/facets.js";
import { productService } from "$lib/server/services/products.js";
import { fail, redirect, isRedirect } from "@sveltejs/kit";

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
}

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

		const code = data.get("code") as string;
		const name = data.get("name") as string;
		const slug = data.get("slug") as string;
		const description = data.get("description") as string;
		const enabled = data.get("enabled") === "on";
		const isPrivate = data.get("is_private") === "on";

		// Validate required fields
		if (!code || !name || !slug) {
			return fail(400, {
				error: "Code, name, and slug are required",
				code,
				name,
				slug,
				description
			});
		}

		try {
			const collection = await collectionService.create({
				code: slugify(code),
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
				code,
				name,
				slug,
				description
			});
		}
	}
};
