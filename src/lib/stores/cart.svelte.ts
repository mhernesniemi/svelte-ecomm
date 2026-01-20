/**
 * Cart UI State (Client-side only)
 *
 * This file uses the `.svelte.ts` extension to enable Svelte 5 runes ($state).
 * Regular `.ts` files cannot use runes - you'll get "rune_outside_svelte" error.
 *
 * Why this pattern?
 * - CartSheet component needs to be opened from multiple places (product page, wishlist)
 * - We can't pass props up through the component tree (CartSheet is in the layout)
 * - This shared state allows any component to open/close the cart sheet
 *
 * Usage:
 *   import { cartSheet } from "$lib/stores/cart.svelte";
 *   cartSheet.open();  // Opens the cart sheet
 *   cartSheet.close(); // Closes it
 *
 * Note: This is CLIENT-SIDE state. Don't try to call cartSheet.open() from server code.
 */

let cartSheetOpen = $state(false);

export const cartSheet = {
	get isOpen() {
		return cartSheetOpen;
	},
	open() {
		cartSheetOpen = true;
	},
	close() {
		cartSheetOpen = false;
	},
	toggle() {
		cartSheetOpen = !cartSheetOpen;
	}
};
