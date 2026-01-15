// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Customer } from "$lib/types.js";

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			auth: () => {
				userId: string | null;
				sessionId: string | null;
				getToken: () => Promise<string | null>;
			};
			customer: Customer | null;
			cartToken: string | null;
			newCartToken?: string;
			wishlistToken: string | null;
			newWishlistToken?: string;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
