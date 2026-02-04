import type { PageServerLoad } from "./$types";
import { collectionService } from "$lib/server/services/collections.js";

export const config = {
	isr: { expiration: 86400 }
};

export const load: PageServerLoad = async () => {
	const collections = await collectionService.list({ language: "en" });

	return { collections };
};
