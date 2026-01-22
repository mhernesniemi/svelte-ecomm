/**
 * Wishlist Store (Client-side only)
 *
 * Manages wishlist count with optimistic updates for instant UI feedback.
 *
 * Usage:
 *   import { wishlistStore } from "$lib/stores/wishlist.svelte";
 *   wishlistStore.increment(); // Optimistic add
 *   wishlistStore.decrement(); // Optimistic remove
 */

let count = $state(0);

export const wishlistStore = {
	get count() {
		return count;
	},

	// Sync from server (called by layout)
	sync(serverCount: number) {
		count = serverCount;
	},

	// Optimistic updates
	increment() {
		count++;
	},

	decrement() {
		if (count > 0) count--;
	}
};
