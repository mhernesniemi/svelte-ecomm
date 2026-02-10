import { categoryService } from "$lib/server/services/categories.js";
import { fail } from "@sveltejs/kit";
import { DEFAULT_LANGUAGE } from "$lib/utils.js";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	const tree = await categoryService.getTree(locals.language);
	const categories = await categoryService.list(locals.language);

	return { tree, categories };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const slug = formData.get("slug") as string;
		const nameEn = formData.get("name_en") as string;
		const parentId = formData.get("parent_id") as string;

		if (!slug || !nameEn) {
			return fail(400, { error: "Slug and name are required" });
		}

		try {
			await categoryService.create({
				slug: slug.toLowerCase().replace(/\s+/g, "-"),
				parentId: parentId ? Number(parentId) : null,
				translations: [{ languageCode: DEFAULT_LANGUAGE, name: nameEn }]
			});

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
		const parentId = formData.get("parent_id") as string;

		if (!id || !slug || !nameEn) {
			return fail(400, { error: "All fields are required" });
		}

		try {
			await categoryService.update(id, {
				slug: slug.toLowerCase().replace(/\s+/g, "-"),
				parentId: parentId ? Number(parentId) : null,
				translations: [{ languageCode: DEFAULT_LANGUAGE, name: nameEn }]
			});

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
