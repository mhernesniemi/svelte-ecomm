import type { PageServerLoad, Actions } from "./$types";
import { contentPageService } from "$lib/server/services/content-pages.js";
import { error, fail, redirect, isRedirect } from "@sveltejs/kit";
import { slugify } from "$lib/utils.js";

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);
	if (isNaN(id)) {
		throw error(400, "Invalid page ID");
	}

	const page = await contentPageService.getById(id);
	if (!page) {
		throw error(404, "Content page not found");
	}

	return { page };
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
				translations: [
					{
						languageCode: "en",
						title,
						slug: slugify(slug),
						body: body || undefined
					}
				]
			});

			return { success: true, message: "Page updated successfully" };
		} catch (err) {
			return fail(500, { error: "Failed to update page" });
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
