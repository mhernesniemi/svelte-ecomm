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
		const nameEn = data.get("name_en") as string;
		const nameFi = data.get("name_fi") as string;
		const slugEn = data.get("slug_en") as string;
		const slugFi = data.get("slug_fi") as string;
		const descriptionEn = data.get("description_en") as string;
		const descriptionFi = data.get("description_fi") as string;
		const enabled = data.get("enabled") === "on";
		const isPrivate = data.get("is_private") === "on";

		// Validate required fields
		if (!code || !nameEn || !slugEn) {
			return fail(400, {
				error: "Code, name (EN), and slug (EN) are required",
				code,
				nameEn,
				nameFi,
				slugEn,
				slugFi,
				descriptionEn,
				descriptionFi
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
						name: nameEn,
						slug: slugify(slugEn),
						description: descriptionEn || undefined
					},
					{
						languageCode: "fi",
						name: nameFi || nameEn,
						slug: slugify(slugFi || slugEn),
						description: descriptionFi || descriptionEn || undefined
					}
				]
			});

			throw redirect(303, `/admin/collections/${collection.id}`);
		} catch (err) {
			if (isRedirect(err)) throw err;
			return fail(500, {
				error: "Failed to create collection",
				code,
				nameEn,
				nameFi,
				slugEn,
				slugFi,
				descriptionEn,
				descriptionFi
			});
		}
	}
};
