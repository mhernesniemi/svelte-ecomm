import { productService } from "$lib/server/services/products.js";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	const result = await productService.list({
		limit: 1000,
		offset: 0,
		visibility: ["public", "private", "draft"],
		language: locals.language
	});

	return {
		products: result.items
	};
};

export const actions: Actions = {
	publish: async ({ request }) => {
		const data = await request.formData();
		const ids = data.getAll("ids").map(Number).filter(Boolean);

		if (ids.length === 0) {
			return fail(400, { error: "No products selected" });
		}

		try {
			await Promise.all(ids.map((id) => productService.update(id, { visibility: "public" })));
			return {
				success: true,
				message: `${ids.length} product${ids.length !== 1 ? "s" : ""} published`
			};
		} catch {
			return fail(500, { error: "Failed to publish products" });
		}
	},

	deleteSelected: async ({ request }) => {
		const data = await request.formData();
		const ids = data.getAll("ids").map(Number).filter(Boolean);

		if (ids.length === 0) {
			return fail(400, { error: "No products selected" });
		}

		try {
			await Promise.all(ids.map((id) => productService.delete(id)));
			return { success: true };
		} catch {
			return fail(500, { error: "Failed to delete products" });
		}
	}
};
