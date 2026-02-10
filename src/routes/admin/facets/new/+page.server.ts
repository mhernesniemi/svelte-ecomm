import { facetService } from "$lib/server/services/facets.js";
import { fail, redirect, isRedirect } from "@sveltejs/kit";
import { DEFAULT_LANGUAGE } from "$lib/utils.js";
import type { Actions } from "./$types";

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const code = formData.get("code") as string;
		const nameEn = formData.get("name_en") as string;

		if (!code || !nameEn) {
			return fail(400, { error: "Code and name are required" });
		}

		try {
			const facet = await facetService.create({
				code: code.toLowerCase().replace(/\s+/g, "_"),
				translations: [{ languageCode: DEFAULT_LANGUAGE, name: nameEn }]
			});

			throw redirect(303, `/admin/facets/${facet.id}`);
		} catch (err) {
			if (isRedirect(err)) throw err;
			return fail(500, { error: "Failed to create facet" });
		}
	}
};
