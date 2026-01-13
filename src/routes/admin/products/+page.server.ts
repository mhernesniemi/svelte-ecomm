import { productService } from '$lib/server/services/products.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const page = Number(url.searchParams.get('page')) || 1;
	const limit = 20;
	const offset = (page - 1) * limit;

	const result = await productService.list({
		limit,
		offset,
		language: 'en'
	});

	return {
		products: result.items,
		pagination: result.pagination,
		currentPage: page
	};
};
