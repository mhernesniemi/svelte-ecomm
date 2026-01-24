import type { PageServerLoad } from "./$types";
import { collectionService } from "$lib/server/services/collections.js";
import { BYPASS_TOKEN } from "$env/static/private";

export const config = {
	isr: {
		expiration: 60,
		bypassToken: BYPASS_TOKEN
	}
};

export const load: PageServerLoad = async () => {
	const collections = await collectionService.list({ language: "en" });

	return { collections };
};
