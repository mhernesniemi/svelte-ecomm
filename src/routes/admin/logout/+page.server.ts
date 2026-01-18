import { redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { authService } from "$lib/server/services/auth.js";

const ADMIN_SESSION_COOKIE = "admin_session";

export const load: PageServerLoad = async () => {
	throw redirect(303, "/admin/login");
};

export const actions: Actions = {
	default: async ({ cookies, locals }) => {
		const sessionId = locals.adminSessionId;

		if (sessionId) {
			await authService.logout(sessionId);
		}

		cookies.delete(ADMIN_SESSION_COOKIE, { path: "/" });

		throw redirect(303, "/admin/login");
	}
};
