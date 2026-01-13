/**
 * Order Remote Functions
 * Type-safe server functions for order operations (admin)
 */
import { query, command } from '$app/server';
import { orderService } from '$lib/server/services/orders.js';
import type { OrderState } from '$lib/commerce/types.js';

// ============================================================================
// ORDER QUERIES
// ============================================================================

export const listOrders = query(
	'unchecked',
	async (input: { state?: OrderState; limit?: number; offset?: number } = {}) => {
		return orderService.list(input.state, input.limit ?? 20, input.offset ?? 0);
	}
);

export const getOrder = query('unchecked', async (input: { id: number }) => {
	return orderService.getById(input.id);
});

export const getOrderByCode = query('unchecked', async (input: { code: string }) => {
	return orderService.getByCode(input.code);
});

export const listCustomerOrders = query(
	'unchecked',
	async (input: {
		customerId: number;
		includeActive?: boolean;
		limit?: number;
		offset?: number;
	}) => {
		return orderService.listForCustomer(input.customerId, {
			includeActive: input.includeActive,
			limit: input.limit,
			offset: input.offset
		});
	}
);

// ============================================================================
// ORDER MUTATIONS
// ============================================================================

export const transitionOrderState = command(
	'unchecked',
	async (input: { orderId: number; newState: OrderState }) => {
		const order = await orderService.transitionState(input.orderId, input.newState);
		return { id: order.id, state: order.state };
	}
);

export const setOrderShippingAddress = command(
	'unchecked',
	async (input: {
		orderId: number;
		address: {
			fullName: string;
			streetLine1: string;
			streetLine2?: string;
			city: string;
			postalCode: string;
			country: string;
		};
	}) => {
		const order = await orderService.setShippingAddress(input.orderId, input.address);
		return { id: order.id };
	}
);

export const removeOrderPromotion = command(
	'unchecked',
	async (input: { orderId: number; promotionId: number }) => {
		return orderService.removePromotion(input.orderId, input.promotionId);
	}
);
