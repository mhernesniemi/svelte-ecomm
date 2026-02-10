import type { PageServerLoad } from "./$types";
import { collectionService } from "$lib/server/services/collections.js";
import { error, redirect } from "@sveltejs/kit";
import { DEFAULT_LANGUAGE } from "$lib/utils.js";

export const load: PageServerLoad = async ({ params, url }) => {
	const id = Number(params.id);

	if (isNaN(id)) {
		throw error(404, "Collection not found");
	}

	const page = parseInt(url.searchParams.get("page") ?? "1");
	const limit = 12;
	const offset = (page - 1) * limit;

	const collection = await collectionService.getById(id, DEFAULT_LANGUAGE);
	if (!collection || collection.isPrivate) {
		throw error(404, "Collection not found");
	}

	// Redirect if slug doesn't match (for SEO and correct URLs)
	const correctSlug = collection.translations.find((t) => t.languageCode === DEFAULT_LANGUAGE)?.slug;
	if (correctSlug && params.slug !== correctSlug) {
		const pageParam = page > 1 ? `?page=${page}` : "";
		throw redirect(301, `/collections/${id}/${correctSlug}${pageParam}`);
	}

	const { items: products, pagination } = await collectionService.getProductsForCollection(
		collection.id,
		{ language: DEFAULT_LANGUAGE, limit, offset }
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
