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

		const nameEn = formData.get("name_en") as string;
		const nameFi = formData.get("name_fi") as string;
		const slugEn = formData.get("slug_en") as string;
		const slugFi = formData.get("slug_fi") as string;
		const descriptionEn = formData.get("description_en") as string;
		const descriptionFi = formData.get("description_fi") as string;
		const type = (formData.get("type") as "physical" | "digital") || "physical";
		const visibility =
			(formData.get("visibility") as "public" | "private" | "hidden") || "public";

		// Validation
		if (!nameEn || !slugEn) {
			return fail(400, {
				error: "English name and slug are required",
				values: {
					nameEn,
					nameFi,
					slugEn,
					slugFi,
					descriptionEn,
					descriptionFi,
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
						name: nameEn,
						slug: slugEn,
						description: descriptionEn || undefined
					},
					...(nameFi || slugFi
						? [
								{
									languageCode: "fi",
									name: nameFi || nameEn,
									slug: slugFi || slugEn,
									description: descriptionFi || undefined
								}
							]
						: [])
				]
			});

			throw redirect(303, `/admin/products/${product.id}`);
		} catch (error) {
			if (isRedirect(error)) throw error;
			return fail(500, {
				error: "Failed to create product",
				values: {
					nameEn,
					nameFi,
					slugEn,
					slugFi,
					descriptionEn,
					descriptionFi,
					type,
					visibility
				}
			});
		}
	}
};
