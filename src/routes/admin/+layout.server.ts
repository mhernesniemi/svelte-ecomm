/**
 * Admin layout server - protects all admin routes
 * Only users with isAdmin=true can access
 */
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// Check if user is logged in
	if (!locals.auth?.userId) {
		throw redirect(303, '/sign-in?redirect=/admin');
	}

	// Check if user is admin
	if (!locals.customer?.isAdmin) {
		throw redirect(303, '/');
	}

	return {
		customer: locals.customer
	};
};
