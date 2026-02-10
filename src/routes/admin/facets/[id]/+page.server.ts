import { facetService } from "$lib/server/services/facets.js";
import { translationService } from "$lib/server/services/translations.js";
import { error, fail, redirect, isRedirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);
	if (isNaN(id)) {
		throw error(400, "Invalid facet ID");
	}

	const [facet, facetTranslations, valueTranslations] = await Promise.all([
		facetService.getById(id),
		translationService.getFacetTranslations(id),
		translationService.getAllFacetValueTranslations(id)
	]);
	if (!facet) {
		throw error(404, "Facet not found");
	}

	return { facet, facetTranslations, valueTranslations };
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
				name: nameEn
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
				name: nameEn
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
				name: nameEn
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

	saveTranslation: async ({ request }) => {
		const formData = await request.formData();
		const entityId = Number(formData.get("entityId"));
		const languageCode = formData.get("languageCode") as string;
		const name = formData.get("name") as string;

		if (!entityId || !languageCode) {
			return fail(400, { error: "Missing required fields" });
		}

		try {
			await translationService.upsertFacetTranslation(entityId, languageCode, {
				name: name || ""
			});
			return { success: true, message: "Translation saved" };
		} catch {
			return fail(500, { error: "Failed to save translation" });
		}
	},

	saveValueTranslation: async ({ request }) => {
		const formData = await request.formData();
		const facetValueId = Number(formData.get("facetValueId"));
		const languageCode = formData.get("languageCode") as string;
		const name = formData.get("name") as string;

		if (!facetValueId || !languageCode) {
			return fail(400, { error: "Missing required fields" });
		}

		try {
			await translationService.upsertFacetValueTranslation(facetValueId, languageCode, {
				name: name || ""
			});
			return { success: true, message: "Value translation saved" };
		} catch {
			return fail(500, { error: "Failed to save value translation" });
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
