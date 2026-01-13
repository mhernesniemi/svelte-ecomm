import { promotionService } from '$lib/server/services/promotions.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const result = await promotionService.list();
	return { promotions: result.items };
};
