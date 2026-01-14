import { facetService } from "$lib/server/services/facets.js";
import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
	const facets = await facetService.list("en");

	return { facets };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const code = formData.get("code") as string;
		const nameEn = formData.get("name_en") as string;

		if (!code || !nameEn) {
			return fail(400, { error: "Code and name are required" });
		}

		try {
			await facetService.create({
				code: code.toLowerCase().replace(/\s+/g, "_"),
				translations: [{ languageCode: "en", name: nameEn }]
			});

			return { success: true };
		} catch (e) {
			return fail(500, { error: "Failed to create facet" });
		}
	},

	createValue: async ({ request }) => {
		const formData = await request.formData();
		const facetId = Number(formData.get("facetId"));
		const code = formData.get("code") as string;
		const nameEn = formData.get("name_en") as string;

		if (!facetId || !code || !nameEn) {
			return fail(400, { valueError: "All fields are required" });
		}

		try {
			await facetService.createValue({
				facetId,
				code: code.toLowerCase().replace(/\s+/g, "_"),
				translations: [{ languageCode: "en", name: nameEn }]
			});

			return { valueSuccess: true };
		} catch (e) {
			return fail(500, { valueError: "Failed to create value" });
		}
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get("id"));

		await facetService.delete(id);

		return { deleted: true };
	}
};
