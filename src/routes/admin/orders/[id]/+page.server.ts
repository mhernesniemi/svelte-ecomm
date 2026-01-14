import { orderService } from '$lib/server/services/orders.js';
import { shippingService } from '$lib/server/services/index.js';
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

	// Load shipping info
	const orderShipping = await shippingService.getOrderShipping(id);
	let shippingMethod = null;
	if (orderShipping) {
		shippingMethod = await shippingService.getMethodById(orderShipping.shippingMethodId);
	}

	return { order, orderShipping, shippingMethod };
};

export const actions: Actions = {
	transition: async ({ params, request }) => {
		const id = Number(params.id);
		const formData = await request.formData();
		const newState = formData.get('state') as string;

		try {
			await orderService.transitionState(id, newState as any);
			
			// If transitioning to 'paid', create shipment
			if (newState === 'paid') {
				const order = await orderService.getById(id);
				if (order) {
					try {
						await shippingService.createShipment(order);
					} catch (e) {
						console.error('Error creating shipment:', e);
						// Don't fail the transition if shipment creation fails
					}
				}
			}
			
			return { success: true };
		} catch (e) {
			return fail(400, { error: (e as Error).message });
		}
	},
	
	updateShippingStatus: async ({ params, request }) => {
		const id = Number(params.id);
		const formData = await request.formData();
		const status = formData.get('status') as string;

		try {
			await shippingService.updateShippingStatus(id, status as any);
			return { success: true };
		} catch (e) {
			return fail(400, { error: (e as Error).message });
		}
	},
	
	trackShipment: async ({ params }) => {
		const id = Number(params.id);
		
		try {
			const status = await shippingService.trackShipment(id);
			return { success: true, trackingStatus: status };
		} catch (e) {
			return fail(400, { error: (e as Error).message });
		}
	}
};
