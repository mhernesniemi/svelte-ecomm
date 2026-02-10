import type { PageServerLoad, Actions } from "./$types";
import { collectionService } from "$lib/server/services/collections.js";
import { fail, redirect } from "@sveltejs/kit";

export const load: PageServerLoad = async () => {
	const collections = await collectionService.listAll();

	// Get product counts for each collection
	const collectionsWithCounts = await Promise.all(
		collections.map(async (c) => ({
			...c,
			productCount: await collectionService.getProductCount(c.id)
		}))
	);

	return { collections: collectionsWithCounts };
};

export const actions: Actions = {
	delete: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get("id"));

		if (!id) {
			return fail(400, { error: "Collection ID is required" });
		}

		const success = await collectionService.delete(id);
		if (!success) {
			return fail(404, { error: "Collection not found" });
		}

		return { success: true };
	},

	deleteSelected: async ({ request }) => {
		const data = await request.formData();
		const ids = data.getAll("ids").map(Number).filter(Boolean);

		if (ids.length === 0) {
			return fail(400, { error: "No collections selected" });
		}

		try {
			await Promise.all(ids.map((id) => collectionService.delete(id)));
			return { success: true };
		} catch {
			return fail(500, { error: "Failed to delete collections" });
		}
	}
};
