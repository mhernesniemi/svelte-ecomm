import { facetService } from "$lib/server/services/facets.js";
import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
	const facets = await facetService.list("en");

	return { facets };
};

export const actions: Actions = {
	deleteSelected: async ({ request }) => {
		const formData = await request.formData();
		const ids = formData.getAll("ids").map(Number).filter(Boolean);

		if (ids.length === 0) {
			return fail(400, { error: "No facets selected" });
		}

		try {
			await Promise.all(ids.map((id) => facetService.delete(id)));
			return { success: true };
		} catch {
			return fail(500, { error: "Failed to delete facets" });
		}
	}
};
