import { productService } from "$lib/server/services/products.js";
import { fail, redirect, isRedirect } from "@sveltejs/kit";
import type { Actions } from "./$types";

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();

		const name = formData.get("name") as string;
		const slug = formData.get("slug") as string;

		if (!name || !slug) {
			return fail(400, {
				error: "Name and slug are required",
				values: { name, slug }
			});
		}

		try {
			const product = await productService.create({
				type: "physical",
				visibility: "draft",
				translations: [
					{
						languageCode: "en",
						name,
						slug
					}
				]
			});

			throw redirect(303, `/admin/products/${product.id}`);
		} catch (error) {
			if (isRedirect(error)) throw error;
			return fail(500, {
				error: "Failed to create product",
				values: { name, slug }
			});
		}
	}
};
