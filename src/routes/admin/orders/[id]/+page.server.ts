import { orderService } from '$lib/server/services/orders.js';
import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);

	if (isNaN(id)) {
		throw error(404, 'Invalid order ID');
	}

	const order = await orderService.getById(id);

	if (!order) {
		throw error(404, 'Order not found');
	}

	return { order };
};

export const actions: Actions = {
	transition: async ({ params, request }) => {
		const id = Number(params.id);
		const formData = await request.formData();
		const newState = formData.get('state') as string;

		try {
			await orderService.transitionState(id, newState as any);
			return { success: true };
		} catch (e) {
			return fail(400, { error: (e as Error).message });
		}
	}
};
