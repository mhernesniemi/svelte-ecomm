/**
 * Checkout page server actions
 */
import { fail } from '@sveltejs/kit';
import { orderService } from '$lib/server/services/index.js';
import { shippingService } from '$lib/server/services/index.js';
import type { PageServerLoad, Actions } from './$types.js';

export const load: PageServerLoad = async ({ cookies, locals }) => {
	const cartToken = cookies.get('cartToken') ?? null;
	const customerId = locals.user?.id ?? null;

	// Get active cart
	const cart = await orderService.getActiveCart({ customerId, cartToken });
	if (!cart) {
		return {
			cart: null,
			shippingRates: []
		};
	}

	// Get available shipping rates
	const shippingRates = await shippingService.getAvailableRates(cart);

	return {
		cart,
		shippingRates
	};
};

export const actions: Actions = {
	setShippingAddress: async ({ request, cookies, locals }) => {
		const cartToken = cookies.get('cartToken') ?? null;
		const customerId = locals.user?.id ?? null;

		const cart = await orderService.getActiveCart({ customerId, cartToken });
		if (!cart) {
			return fail(404, { error: 'Cart not found' });
		}

		const data = await request.formData();
		const fullName = data.get('fullName')?.toString();
		const streetLine1 = data.get('streetLine1')?.toString();
		const streetLine2 = data.get('streetLine2')?.toString();
		const city = data.get('city')?.toString();
		const postalCode = data.get('postalCode')?.toString();
		const country = data.get('country')?.toString() || 'FI';

		if (!fullName || !streetLine1 || !city || !postalCode) {
			return fail(400, { error: 'Missing required address fields' });
		}

		await orderService.setShippingAddress(cart.id, {
			fullName,
			streetLine1,
			streetLine2: streetLine2 || undefined,
			city,
			postalCode,
			country
		});

		// Reload cart to get updated shipping rates
		const updatedCart = await orderService.getActiveCart({ customerId, cartToken });
		const shippingRates = updatedCart
			? await shippingService.getAvailableRates(updatedCart)
			: [];

		return {
			success: true,
			cart: updatedCart,
			shippingRates
		};
	},

	setShippingMethod: async ({ request, cookies, locals }) => {
		const cartToken = cookies.get('cartToken') ?? null;
		const customerId = locals.user?.id ?? null;

		const cart = await orderService.getActiveCart({ customerId, cartToken });
		if (!cart) {
			return fail(404, { error: 'Cart not found' });
		}

		const data = await request.formData();
		const methodId = data.get('methodId')?.toString();
		const rateId = data.get('rateId')?.toString();
		const price = data.get('price')?.toString();

		if (!methodId || !rateId || !price) {
			return fail(400, { error: 'Missing shipping method information' });
		}

		await shippingService.setShippingMethod(
			cart.id,
			parseInt(methodId),
			rateId,
			parseInt(price)
		);

		// Recalculate totals with new shipping cost
		await orderService.getById(cart.id);

		const updatedCart = await orderService.getActiveCart({ customerId, cartToken });

		return {
			success: true,
			cart: updatedCart
		};
	}
};
