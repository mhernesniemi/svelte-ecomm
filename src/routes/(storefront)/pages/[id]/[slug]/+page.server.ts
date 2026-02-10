import type { PageServerLoad } from "./$types";
import { contentPageService } from "$lib/server/services/content-pages.js";
import { error, redirect } from "@sveltejs/kit";
import { DEFAULT_LANGUAGE } from "$lib/utils.js";

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
	const correctSlug = page.translations.find((t) => t.languageCode === DEFAULT_LANGUAGE)?.slug;
	if (correctSlug && params.slug !== correctSlug) {
		throw redirect(301, `/pages/${id}/${correctSlug}`);
	}

	return { page };
};
