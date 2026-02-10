// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Customer } from "$lib/types.js";
import type { User } from "$lib/server/services/auth.js";
import type { SessionAuthObject } from "@clerk/backend";
import type { PendingSessionOptions } from "@clerk/shared/types";

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			auth: (options?: PendingSessionOptions) => SessionAuthObject;
			customer: Customer | null;
			cartToken: string | null;
			newCartToken?: string;
			wishlistToken: string | null;
			newWishlistToken?: string;
			// Admin user (separate from customer)
			adminUser: User | null;
			adminSessionId: string | null;
			adminDark: boolean;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
