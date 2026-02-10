import type { PageServerLoad } from "./$types";
import { contentPageService } from "$lib/server/services/content-pages.js";
import { error, redirect } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);

	if (isNaN(id)) {
		throw error(404, "Page not found");
	}

	const page = await contentPageService.getPublishedById(id);
	if (!page) {
		throw error(404, "Page not found");
	}

	// Redirect if slug doesn't match (for SEO and correct URLs)
	if (page.slug && params.slug !== page.slug) {
		throw redirect(301, `/pages/${id}/${page.slug}`);
	}

	return { page };
};
