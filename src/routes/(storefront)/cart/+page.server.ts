import { orderService } from '$lib/server/services/orders.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const cart = await orderService.getActiveCart({
		customerId: locals.customer?.id,
		cartToken: locals.cartToken
	});

	return { cart };
};
