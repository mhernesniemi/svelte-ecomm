import type { PageServerLoad, Actions } from "./$types";
import { contentPageService } from "$lib/server/services/content-pages.js";
import { translationService } from "$lib/server/services/translations.js";
import { error, fail, redirect, isRedirect } from "@sveltejs/kit";
import { slugify } from "$lib/utils.js";

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);
	if (isNaN(id)) {
		throw error(400, "Invalid page ID");
	}

	const [page, translations] = await Promise.all([
		contentPageService.getById(id),
		translationService.getContentPageTranslations(id)
	]);
	if (!page) {
		throw error(404, "Content page not found");
	}

	return { page, translations };
};

export const actions: Actions = {
	update: async ({ params, request }) => {
		const id = Number(params.id);
		const data = await request.formData();

		const title = data.get("title") as string;
		const slug = data.get("slug") as string;
		const body = data.get("body") as string;
		const published = data.get("published") === "on";

		if (!title || !slug) {
			return fail(400, { error: "Title and slug are required" });
		}

		try {
			await contentPageService.update(id, {
				published,
				title,
				slug: slugify(slug),
				body: body || undefined
			});

			return { success: true, message: "Page updated successfully" };
		} catch (err) {
			return fail(500, { error: "Failed to update page" });
		}
	},

	saveTranslation: async ({ request }) => {
		const formData = await request.formData();
		const entityId = Number(formData.get("entityId"));
		const languageCode = formData.get("languageCode") as string;
		const title = formData.get("title") as string;
		const slug = formData.get("slug") as string;
		const body = formData.get("body") as string;

		if (!entityId || !languageCode) {
			return fail(400, { error: "Missing required fields" });
		}

		try {
			await translationService.upsertContentPageTranslation(entityId, languageCode, {
				title: title || "",
				slug: slug || "",
				body: body || null
			});
			return { success: true, message: "Translation saved" };
		} catch {
			return fail(500, { error: "Failed to save translation" });
		}
	},

	delete: async ({ params }) => {
		const id = Number(params.id);

		try {
			await contentPageService.delete(id);
			throw redirect(303, "/admin/content-pages");
		} catch (err) {
			if (isRedirect(err)) throw err;
			return fail(500, { error: "Failed to delete page" });
		}
	}
};
