import { facetService } from "$lib/server/services/facets.js";
import { translationService } from "$lib/server/services/translations.js";
import { TRANSLATION_LANGUAGES } from "$lib/config/languages.js";
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

			// Save facet translations
			for (const lang of TRANSLATION_LANGUAGES) {
				const tName = formData.get(`name_${lang.code}`) as string;

				await translationService.upsertFacetTranslation(id, lang.code, {
					name: tName || ""
				});
			}

			// Delete removed values
			const deleteValueIds = formData.getAll("delete_value").map(Number).filter(Boolean);
			for (const valueId of deleteValueIds) {
				await facetService.deleteValue(valueId);
			}

			// Save value updates and translations
			const facet = await facetService.getById(id);
			if (facet) {
				for (const value of facet.values) {
					const valueName = formData.get(`value_${value.id}_name_en`) as string;
					const valueCode = formData.get(`value_${value.id}_code`) as string;

					if (valueName && valueCode) {
						await facetService.updateValue(value.id, {
							name: valueName,
							code: valueCode.toLowerCase().replace(/\s+/g, "_")
						});
					}

					for (const lang of TRANSLATION_LANGUAGES) {
						const transName = formData.get(`value_${value.id}_name_${lang.code}`) as string;
						await translationService.upsertFacetValueTranslation(value.id, lang.code, {
							name: transName || ""
						});
					}
				}
			}

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
