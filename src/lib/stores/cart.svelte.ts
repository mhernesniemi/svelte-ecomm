/**
 * Cart UI state
 * Controls the cart sheet visibility across the app
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
