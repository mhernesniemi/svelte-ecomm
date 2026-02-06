import { productService } from "$lib/server/services/products.js";
import { facetService } from "$lib/server/services/facets.js";
import { fail, redirect, isRedirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
	const facets = await facetService.list("en");

	return {
		facets
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();

		const name = formData.get("name") as string;
		const slug = formData.get("slug") as string;
		const description = formData.get("description") as string;
		const type = (formData.get("type") as "physical" | "digital") || "physical";
		const visibility =
			(formData.get("visibility") as "public" | "private" | "draft") || "draft";

		// Validation
		if (!name || !slug) {
			return fail(400, {
				error: "Name and slug are required",
				values: {
					name,
					slug,
					description,
					type,
					visibility
				}
			});
		}

		try {
			const product = await productService.create({
				type,
				visibility,
				translations: [
					{
						languageCode: "en",
						name,
						slug,
						description: description || undefined
					}
				]
			});

			throw redirect(303, `/admin/products/${product.id}`);
		} catch (error) {
			if (isRedirect(error)) throw error;
			return fail(500, {
				error: "Failed to create product",
				values: {
					name,
					slug,
					description,
					type,
					visibility
				}
			});
		}
	}
};
