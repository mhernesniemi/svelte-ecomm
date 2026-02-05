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

	update: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get("id"));
		const code = formData.get("code") as string;
		const nameEn = formData.get("name_en") as string;

		if (!id || !code || !nameEn) {
			return fail(400, { error: "All fields are required" });
		}

		try {
			await facetService.update(id, {
				code: code.toLowerCase().replace(/\s+/g, "_"),
				translations: [{ languageCode: "en", name: nameEn }]
			});
			return { success: true };
		} catch {
			return fail(500, { error: "Failed to update facet" });
		}
	},

	updateValue: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get("id"));
		const code = formData.get("code") as string;
		const nameEn = formData.get("name_en") as string;

		if (!id || !code || !nameEn) {
			return fail(400, { error: "All fields are required" });
		}

		try {
			await facetService.updateValue(id, {
				code: code.toLowerCase().replace(/\s+/g, "_"),
				translations: [{ languageCode: "en", name: nameEn }]
			});
			return { success: true };
		} catch {
			return fail(500, { error: "Failed to update value" });
		}
	},

	deleteValue: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get("id"));

		if (!id) {
			return fail(400, { error: "Value ID is required" });
		}

		try {
			await facetService.deleteValue(id);
			return { success: true };
		} catch {
			return fail(500, { error: "Failed to delete value" });
		}
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get("id"));

		if (!id) {
			return fail(400, { error: "Facet ID is required" });
		}

		try {
			await facetService.delete(id);
			return { success: true };
		} catch {
			return fail(500, { error: "Failed to delete facet" });
		}
	}
};
