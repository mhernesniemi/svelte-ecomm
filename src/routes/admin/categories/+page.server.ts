import { categoryService } from "$lib/server/services/categories.js";
import { translationService } from "$lib/server/services/translations.js";
import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
	const [tree, categories, categoryTranslations] = await Promise.all([
		categoryService.getTree(),
		categoryService.list(),
		translationService.getAllCategoryTranslations()
	]);

	return { tree, categories, categoryTranslations };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const slug = formData.get("slug") as string;
		const nameEn = formData.get("name_en") as string;
		const nameFi = formData.get("name_fi") as string;
		const parentId = formData.get("parent_id") as string;

		if (!slug || !nameEn) {
			return fail(400, { error: "Slug and name are required" });
		}

		try {
			const category = await categoryService.create({
				slug: slug.toLowerCase().replace(/\s+/g, "-"),
				parentId: parentId ? Number(parentId) : null,
				name: nameEn
			});

			if (nameFi && category) {
				await translationService.upsertCategoryTranslation(category.id, "fi", {
					name: nameFi
				});
			}

			return { success: true };
		} catch (e) {
			return fail(500, { error: "Failed to create category" });
		}
	},

	update: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get("id"));
		const slug = formData.get("slug") as string;
		const nameEn = formData.get("name_en") as string;
		const nameFi = formData.get("name_fi") as string;
		const parentId = formData.get("parent_id") as string;

		if (!id || !slug || !nameEn) {
			return fail(400, { error: "All fields are required" });
		}

		try {
			await categoryService.update(id, {
				slug: slug.toLowerCase().replace(/\s+/g, "-"),
				parentId: parentId ? Number(parentId) : null,
				name: nameEn
			});

			if (nameFi !== null) {
				await translationService.upsertCategoryTranslation(id, "fi", {
					name: nameFi || ""
				});
			}

			return { success: true };
		} catch (e) {
			return fail(500, { error: "Failed to update category" });
		}
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get("id"));

		await categoryService.delete(id);

		return { deleted: true };
	}
};
