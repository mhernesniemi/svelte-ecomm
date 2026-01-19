/**
 * Cart Remote Functions
 * Used for cart operations without page reload
 */
import { command, getRequestEvent } from "$app/server";
import { orderService } from "$lib/server/services/orders.js";

const CART_COOKIE_NAME = "cart_token";
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export const addToCart = command(
	"unchecked",
	async (input: { variantId: number; quantity: number }) => {
		const event = getRequestEvent();
		const customerId = event.locals.customer?.id ?? null;
		const cartToken = event.locals.cartToken ?? null;

		const {
			order,
			cartToken: newCartToken,
			isNew
		} = await orderService.getOrCreateActiveCart({
			customerId,
			cartToken
		});

		// If a new guest cart was created, set the cookie
		if (isNew && newCartToken && !customerId) {
			event.cookies.set(CART_COOKIE_NAME, newCartToken, {
				path: "/",
				httpOnly: true,
				sameSite: "lax",
				maxAge: CART_COOKIE_MAX_AGE
			});
		}

		await orderService.addLine(order.id, {
			variantId: input.variantId,
			quantity: input.quantity
		});

		return { success: true };
	}
);

export const updateCartLineQuantity = command(
	"unchecked",
	async (input: { lineId: number; quantity: number }) => {
		const event = getRequestEvent();
		const customerId = event.locals.customer?.id ?? null;
		const cartToken = event.locals.cartToken ?? null;

		const cart = await orderService.getActiveCart({ customerId, cartToken });
		if (!cart) {
			throw new Error("No active cart found");
		}

		if (input.quantity <= 0) {
			await orderService.removeLine(cart.id, input.lineId);
		} else {
			await orderService.updateLineQuantity(cart.id, input.lineId, input.quantity);
		}

		return { success: true };
	}
);

export const removeCartLine = command(
	"unchecked",
	async (input: { lineId: number }) => {
		const event = getRequestEvent();
		const customerId = event.locals.customer?.id ?? null;
		const cartToken = event.locals.cartToken ?? null;

		const cart = await orderService.getActiveCart({ customerId, cartToken });
		if (!cart) {
			throw new Error("No active cart found");
		}

		await orderService.removeLine(cart.id, input.lineId);

		return { success: true };
	}
);
