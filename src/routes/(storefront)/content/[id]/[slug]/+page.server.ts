import type { PageServerLoad } from "./$types";
import { contentPageService } from "$lib/server/services/content-pages.js";
import { error, redirect } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);

	if (isNaN(id)) {
		throw error(404, "Page not found");
	}

	const language = "en";

	const page = await contentPageService.getPublishedById(id);
	if (!page) {
		throw error(404, "Page not found");
	}

	// Redirect if slug doesn't match (for SEO and correct URLs)
	const correctSlug = page.translations.find((t) => t.languageCode === language)?.slug;
	if (correctSlug && params.slug !== correctSlug) {
		throw redirect(301, `/content/${id}/${correctSlug}`);
	}

	return { page };
};
