/**
 * Cart Remote Functions
 *
 * These functions use SvelteKit's `command()` pattern for RPC-style server calls.
 *
 * How it works:
 * - `command()` creates a function that runs on the SERVER but can be called from the CLIENT
 * - The client calls `await addToCart({...})` like a normal async function
 * - SvelteKit serializes the input, sends it to the server, executes, and returns the result
 * - "unchecked" means no CSRF protection (safe for read-like operations or when using cookies)
 *
 * Why use this instead of form actions?
 * - No page reload needed
 * - Can be called from any component (not just forms)
 * - Cleaner async/await syntax
 *
 * Important: Code inside command() runs on the SERVER only.
 * To trigger client-side effects (like opening a sheet), do it AFTER the await in the component.
 *
 * @see https://svelte.dev/docs/kit/$app-server#command
 */
import { command, getRequestEvent } from "$app/server";
import { orderService } from "$lib/server/services/orders.js";

const CART_COOKIE_NAME = "cart_token";
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Add an item to the cart. Creates a new cart if one doesn't exist.
 * Called from product pages and wishlist.
 */
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

/**
 * Update quantity of a cart line item. Removes the line if quantity <= 0.
 */
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

/**
 * Remove a line item from the cart entirely.
 */
export const removeCartLine = command("unchecked", async (input: { lineId: number }) => {
	const event = getRequestEvent();
	const customerId = event.locals.customer?.id ?? null;
	const cartToken = event.locals.cartToken ?? null;

	const cart = await orderService.getActiveCart({ customerId, cartToken });
	if (!cart) {
		throw new Error("No active cart found");
	}

	await orderService.removeLine(cart.id, input.lineId);

	return { success: true };
});
