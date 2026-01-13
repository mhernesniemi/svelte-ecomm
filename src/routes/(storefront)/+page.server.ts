import { productService } from '$lib/server/services/products.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Get featured products
	const result = await productService.list({
		language: 'en',
		enabled: true,
		limit: 8
	});

	return {
		featuredProducts: result.items
	};
};
