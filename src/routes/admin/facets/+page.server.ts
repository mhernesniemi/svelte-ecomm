import { facetService } from '$lib/server/services/facets.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const facets = await facetService.list('en');
	return { facets };
};
