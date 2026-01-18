import { fail, redirect } from "@sveltejs/kit";
import { dev } from "$app/environment";
import type { Actions, PageServerLoad } from "./$types";
import { authService } from "$lib/server/services/auth.js";

const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export const load: PageServerLoad = async ({ locals }) => {
	// Already logged in, redirect to admin
	if (locals.adminUser) {
		throw redirect(303, "/admin");
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const email = formData.get("email")?.toString() ?? "";
		const password = formData.get("password")?.toString() ?? "";

		if (!email || !password) {
			return fail(400, { error: "Email and password are required" });
		}

		const result = await authService.login(email, password);

		if (!result) {
			return fail(401, { error: "Invalid email or password" });
		}

		// Set session cookie (Secure in production)
		cookies.set(ADMIN_SESSION_COOKIE, result.sessionId, {
			path: "/",
			httpOnly: true,
			sameSite: "lax",
			secure: !dev,
			maxAge: SESSION_MAX_AGE
		});

		throw redirect(303, "/admin");
	}
};
