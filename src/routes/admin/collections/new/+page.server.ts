import { collectionService } from "$lib/server/services/collections.js";
import { fail, redirect, isRedirect } from "@sveltejs/kit";
import { slugify, DEFAULT_LANGUAGE } from "$lib/utils.js";
import type { Actions } from "./$types";

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();

		const name = data.get("name") as string;
		const slug = data.get("slug") as string;

		if (!name || !slug) {
			return fail(400, {
				error: "Name and slug are required",
				name,
				slug
			});
		}

		try {
			const collection = await collectionService.create({
				isPrivate: false,
				translations: [
					{
						languageCode: DEFAULT_LANGUAGE,
						name,
						slug: slugify(slug)
					}
				]
			});

			throw redirect(303, `/admin/collections/${collection.id}`);
		} catch (err) {
			if (isRedirect(err)) throw err;
			return fail(500, {
				error: "Failed to create collection",
				name,
				slug
			});
		}
	}
};
