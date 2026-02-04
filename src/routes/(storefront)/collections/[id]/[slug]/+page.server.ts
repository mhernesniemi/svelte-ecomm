import type { PageServerLoad } from "./$types";
import { collectionService } from "$lib/server/services/collections.js";
import { error, redirect } from "@sveltejs/kit";

export const config = {
	isr: { expiration: 86400 }
};

export const load: PageServerLoad = async ({ params, url }) => {
	const id = Number(params.id);

	if (isNaN(id)) {
		throw error(404, "Collection not found");
	}

	const language = "en";
	const page = parseInt(url.searchParams.get("page") ?? "1");
	const limit = 12;
	const offset = (page - 1) * limit;

	const collection = await collectionService.getById(id, language);
	if (!collection || collection.isPrivate || !collection.enabled) {
		throw error(404, "Collection not found");
	}

	// Redirect if slug doesn't match (for SEO and correct URLs)
	const correctSlug = collection.translations.find((t) => t.languageCode === language)?.slug;
	if (correctSlug && params.slug !== correctSlug) {
		const pageParam = page > 1 ? `?page=${page}` : "";
		throw redirect(301, `/collections/${id}/${correctSlug}${pageParam}`);
	}

	const { items: products, pagination } = await collectionService.getProductsForCollection(
		collection.id,
		{ language, limit, offset }
	);

	return {
		collection,
		products,
		pagination: {
			...pagination,
			currentPage: page,
			totalPages: Math.ceil(pagination.total / limit)
		}
	};
};
