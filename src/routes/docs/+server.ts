import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

/**
 * Redirect /docs to /docs/index.html for dev server compatibility.
 * In production on Vercel, static files are served directly.
 */
export const GET: RequestHandler = async () => {
	throw redirect(302, "/docs/index.html");
};
