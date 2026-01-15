import type { PageServerLoad } from "./$types";
import { collectionService } from "$lib/server/services/collections.js";
import { error } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ params, url }) => {
	const language = "en";
	const page = parseInt(url.searchParams.get("page") ?? "1");
	const limit = 12;
	const offset = (page - 1) * limit;

	const collection = await collectionService.getBySlug(params.slug, language);
	if (!collection || collection.isPrivate || !collection.enabled) {
		throw error(404, "Collection not found");
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
