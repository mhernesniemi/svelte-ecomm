import { facetService } from "$lib/server/services/facets.js";
import { error, fail, redirect, isRedirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);
	if (isNaN(id)) {
		throw error(400, "Invalid facet ID");
	}

	const facet = await facetService.getById(id, "en");
	if (!facet) {
		throw error(404, "Facet not found");
	}

	return { facet };
};

export const actions: Actions = {
	update: async ({ params, request }) => {
		const id = Number(params.id);
		const formData = await request.formData();
		const code = formData.get("code") as string;
		const nameEn = formData.get("name_en") as string;

		if (!code || !nameEn) {
			return fail(400, { error: "All fields are required" });
		}

		try {
			await facetService.update(id, {
				code: code.toLowerCase().replace(/\s+/g, "_"),
				translations: [{ languageCode: "en", name: nameEn }]
			});
			return { success: true, message: "Facet updated" };
		} catch {
			return fail(500, { error: "Failed to update facet" });
		}
	},

	createValue: async ({ params, request }) => {
		const facetId = Number(params.id);
		const formData = await request.formData();
		const code = formData.get("code") as string;
		const nameEn = formData.get("name_en") as string;

		if (!code || !nameEn) {
			return fail(400, { error: "All fields are required" });
		}

		try {
			await facetService.createValue({
				facetId,
				code: code.toLowerCase().replace(/\s+/g, "_"),
				translations: [{ languageCode: "en", name: nameEn }]
			});
			return { success: true, message: "Value created" };
		} catch {
			return fail(500, { error: "Failed to create value" });
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
			return { success: true, message: "Value updated" };
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
			return { success: true, message: "Value deleted" };
		} catch {
			return fail(500, { error: "Failed to delete value" });
		}
	},

	delete: async ({ params }) => {
		const id = Number(params.id);

		try {
			await facetService.delete(id);
			throw redirect(303, "/admin/facets");
		} catch (err) {
			if (isRedirect(err)) throw err;
			return fail(500, { error: "Failed to delete facet" });
		}
	}
};
