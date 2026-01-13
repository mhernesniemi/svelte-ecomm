/**
 * Account layout server - protects all account routes
 * Requires user to be logged in
 */
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { userId } = locals.auth();
	if (!userId) {
		throw redirect(303, '/sign-in?redirect=/account');
	}

	return {
		customer: locals.customer
	};
};
