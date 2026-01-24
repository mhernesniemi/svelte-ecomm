/**
 * ISR Revalidation Service
 *
 * Handles on-demand revalidation of statically prerendered pages on Vercel.
 * Uses Vercel's bypass token to trigger cache invalidation.
 *
 * Requirements:
 * - BYPASS_TOKEN env var must be set (min 32 chars) and match bypassToken in ISR config
 * - Routes must have ISR config with matching bypassToken
 */
import { BYPASS_TOKEN } from "$env/static/private";
import { env } from "$env/dynamic/private";
import { dev } from "$app/environment";

/**
 * Get the base URL for revalidation requests.
 * Prefers production URL, falls back to deployment URL.
 */
function getBaseUrl(): string | null {
	// VERCEL_PROJECT_PRODUCTION_URL is the production domain (e.g., example.com)
	// VERCEL_URL is the deployment-specific URL (e.g., my-app-abc123.vercel.app)
	return env.VERCEL_PROJECT_PRODUCTION_URL || env.VERCEL_URL || null;
}

/**
 * Revalidate a specific path in the Vercel ISR cache.
 * Returns true if successful or if in dev mode (no-op).
 */
export async function revalidatePath(path: string): Promise<boolean> {
	if (dev) return true;

	const baseUrl = getBaseUrl();

	if (!BYPASS_TOKEN || !baseUrl) {
		console.warn("Revalidation skipped: BYPASS_TOKEN or VERCEL_URL not set");
		return false;
	}

	try {
		const url = `https://${baseUrl}${path}`;
		console.log(`Revalidating: ${url}`);

		const response = await fetch(url, {
			method: "HEAD",
			headers: { "x-prerender-revalidate": BYPASS_TOKEN }
		});

		if (!response.ok) {
			console.warn(`Revalidation returned status ${response.status} for ${path}`);
		}

		return response.ok;
	} catch (error) {
		console.error(`Failed to revalidate path ${path}:`, error);
		return false;
	}
}

/**
 * Revalidate a product page by its ID and slug.
 */
export async function revalidateProduct(productId: number, slug: string): Promise<boolean> {
	return revalidatePath(`/products/${productId}/${slug}`);
}

/**
 * Revalidate common listing pages (home, products listing, collections).
 */
export async function revalidateListingPages(): Promise<void> {
	await Promise.all([
		revalidatePath("/"),
		revalidatePath("/products"),
		revalidatePath("/collections")
	]);
}

/**
 * Revalidate a collection page by its ID and slug.
 */
export async function revalidateCollection(collectionId: number, slug: string): Promise<boolean> {
	return revalidatePath(`/collections/${collectionId}/${slug}`);
}
