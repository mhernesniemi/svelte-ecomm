import { contentPageService } from "$lib/server/services/content-pages.js";
import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
	const pages = await contentPageService.list();
	return { pages };
};

export const actions: Actions = {
	deleteSelected: async ({ request }) => {
		const formData = await request.formData();
		const ids = formData.getAll("ids").map(Number).filter(Boolean);

		if (ids.length === 0) {
			return fail(400, { error: "No pages selected" });
		}

		try {
			await Promise.all(ids.map((id) => contentPageService.delete(id)));
			return { success: true };
		} catch {
			return fail(500, { error: "Failed to delete pages" });
		}
	}
};
