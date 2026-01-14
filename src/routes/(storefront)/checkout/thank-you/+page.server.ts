/**
 * Thank you page - shows order confirmation
 */
import { error } from '@sveltejs/kit';
import { orderService } from '$lib/server/services/index.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ url, locals }) => {
	const orderCode = url.searchParams.get('order');

	if (!orderCode) {
		throw error(400, 'Order code is required');
	}

	const order = await orderService.getByCode(orderCode);

	if (!order) {
		throw error(404, 'Order not found');
	}

	// Verify that the order belongs to the current user (if logged in)
	if (locals.customer && order.customerId !== locals.customer.id) {
		throw error(403, 'You do not have permission to view this order');
	}

	return {
		order
	};
};
