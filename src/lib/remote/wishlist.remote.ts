/**
 * Wishlist Remote Functions
 *
 * Uses SvelteKit's `command()` for RPC-style server calls without page reload.
 * See cart.remote.ts for detailed explanation of the command() pattern.
 */
import { command, getRequestEvent } from "$app/server";
import { wishlistService } from "$lib/server/services/wishlist.js";

const WISHLIST_COOKIE_NAME = "wishlist_token";
const WISHLIST_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * Toggle a product in/out of the wishlist. Returns { added: boolean }.
 */
export const toggleWishlist = command(
	"unchecked",
	async (input: { productId: number; variantId?: number }) => {
		const event = getRequestEvent();
		const customerId = event.locals.customer?.id ?? null;
		const wishlistToken = event.locals.wishlistToken ?? null;

		const result = await wishlistService.toggleItem({
			productId: input.productId,
			variantId: input.variantId,
			customerId,
			guestToken: wishlistToken
		});

		// Set cookie if new guest wishlist was created
		if (
			result.added &&
			result.guestToken &&
			!customerId &&
			result.guestToken !== wishlistToken
		) {
			event.cookies.set(WISHLIST_COOKIE_NAME, result.guestToken, {
				path: "/",
				httpOnly: true,
				sameSite: "lax",
				maxAge: WISHLIST_COOKIE_MAX_AGE
			});
		}

		return { added: result.added };
	}
);

/**
 * Check if a product is in the user's wishlist.
 */
export const isInWishlist = command("unchecked", async (input: { productId: number }) => {
	const event = getRequestEvent();
	return wishlistService.hasItem({
		productId: input.productId,
		customerId: event.locals.customer?.id,
		guestToken: event.locals.wishlistToken
	});
});

/**
 * Get all product IDs in the user's wishlist.
 */
export const getWishlistProductIds = command("unchecked", async () => {
	const event = getRequestEvent();
	return wishlistService.getProductIds({
		customerId: event.locals.customer?.id,
		guestToken: event.locals.wishlistToken
	});
});
