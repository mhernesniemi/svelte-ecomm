/**
 * Cache Revalidation
 *
 * Simple utility to trigger Vercel's on-demand ISR.
 * Call after updating products/collections in admin.
 */

import { env } from "$env/dynamic/private";

const VERCEL_API = "https://api.vercel.com";

export async function revalidate(path: string): Promise<void> {
	if (!env.VERCEL_REVALIDATE_TOKEN || !env.VERCEL_PROJECT_ID) {
		console.log(`[cache] Skip revalidation (not configured): ${path}`);
		return;
	}

	const url = new URL(`${VERCEL_API}/v1/projects/${env.VERCEL_PROJECT_ID}/revalidate`);
	if (env.VERCEL_TEAM_ID) url.searchParams.set("teamId", env.VERCEL_TEAM_ID);
	url.searchParams.set("path", path);

	const res = await fetch(url, {
		method: "POST",
		headers: { Authorization: `Bearer ${env.VERCEL_REVALIDATE_TOKEN}` }
	});

	if (!res.ok) {
		console.error(`[cache] Revalidation failed for ${path}:`, await res.text());
	}
}
