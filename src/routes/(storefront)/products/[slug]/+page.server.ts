import { productService } from '$lib/server/services/products.js';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const product = await productService.getBySlug(params.slug, 'en');

	if (!product || !product.enabled) {
		throw error(404, 'Product not found');
	}

	return { product };
};
