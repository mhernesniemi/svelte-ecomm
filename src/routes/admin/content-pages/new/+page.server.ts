import type { PageServerLoad, Actions } from "./$types";
import { contentPageService } from "$lib/server/services/content-pages.js";
import { fail, redirect, isRedirect } from "@sveltejs/kit";

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
}

export const load: PageServerLoad = async () => {
	return {};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();

		const title = data.get("title") as string;
		const slug = data.get("slug") as string;
		const body = data.get("body") as string;
		const published = data.get("published") === "on";

		if (!title || !slug) {
			return fail(400, {
				error: "Title and slug are required",
				title,
				slug,
				body
			});
		}

		try {
			const page = await contentPageService.create({
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

			throw redirect(303, `/admin/content-pages/${page.id}?created=1`);
		} catch (err) {
			if (isRedirect(err)) throw err;
			return fail(500, {
				error: "Failed to create page",
				title,
				slug,
				body
			});
		}
	}
};
