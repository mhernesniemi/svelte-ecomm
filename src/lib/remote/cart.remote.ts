/**
 * Cart Remote Functions
 * Type-safe server functions for cart operations
 */
import { query, command } from '$app/server';
import { orderService } from '$lib/server/services/orders.js';

export const getCart = query(
	'unchecked',
	async (input: { customerId?: number | null; cartToken?: string | null }) => {
		return orderService.getActiveCart(input);
	}
);

export const getOrCreateCart = query(
	'unchecked',
	async (input: { customerId?: number | null; cartToken?: string | null }) => {
		const result = await orderService.getOrCreateActiveCart(input);
		return {
			cart: result.order,
			cartToken: result.cartToken,
			isNew: result.isNew
		};
	}
);

export const addToCart = command(
	'unchecked',
	async (input: {
		variantId: number;
		quantity: number;
		customerId?: number | null;
		cartToken?: string | null;
	}) => {
		const { order, cartToken: newToken } = await orderService.getOrCreateActiveCart({
			customerId: input.customerId,
			cartToken: input.cartToken
		});

		await orderService.addLine(order.id, {
			variantId: input.variantId,
			quantity: input.quantity
		});

		const updatedCart = await orderService.getById(order.id);
		return {
			cart: updatedCart!,
			cartToken: newToken
		};
	}
);

export const updateCartQuantity = command(
	'unchecked',
	async (input: { orderId: number; lineId: number; quantity: number }) => {
		if (input.quantity <= 0) {
			await orderService.removeLine(input.orderId, input.lineId);
		} else {
			await orderService.updateLineQuantity(input.orderId, input.lineId, input.quantity);
		}

		const cart = await orderService.getById(input.orderId);
		return cart!;
	}
);

export const removeCartItem = command(
	'unchecked',
	async (input: { orderId: number; lineId: number }) => {
		await orderService.removeLine(input.orderId, input.lineId);
		const cart = await orderService.getById(input.orderId);
		return cart!;
	}
);

export const applyPromoCode = command(
	'unchecked',
	async (input: { orderId: number; code: string }) => {
		const result = await orderService.applyPromotion(input.orderId, input.code);
		const cart = result.success ? await orderService.getById(input.orderId) : null;
		return { ...result, cart };
	}
);
