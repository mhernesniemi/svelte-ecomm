// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Customer } from '$lib/commerce/types.js';

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
			newCartToken?: string; // Set when creating a new guest cart
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
