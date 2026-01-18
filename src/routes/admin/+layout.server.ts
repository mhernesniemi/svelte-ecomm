/**
 * Admin layout server - protects all admin routes
 * Uses separate admin user auth (not Clerk)
 */
import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// Skip auth for login page
	if (url.pathname === "/admin/login") {
		return { adminUser: null };
	}

	// Check if admin user is logged in
	if (!locals.adminUser) {
		throw redirect(303, "/admin/login");
	}

	return {
		adminUser: locals.adminUser
	};
};
