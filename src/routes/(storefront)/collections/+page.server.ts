import type { PageServerLoad } from "./$types";
import { collectionService } from "$lib/server/services/collections.js";

export const load: PageServerLoad = async ({ locals }) => {
	const collections = await collectionService.list({ language: locals.language });

	return { collections };
};
