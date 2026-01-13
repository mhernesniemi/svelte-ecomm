import { productService } from '$lib/server/services/products.js';
import { facetService } from '$lib/server/services/facets.js';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);

	if (isNaN(id)) {
		throw error(404, 'Invalid product ID');
	}

	const product = await productService.getById(id, 'en');

	if (!product) {
		throw error(404, 'Product not found');
	}

	const facets = await facetService.list('en');

	return {
		product,
		facets
	};
};

export const actions: Actions = {
	update: async ({ params, request }) => {
		const id = Number(params.id);
		const formData = await request.formData();

		const nameEn = formData.get('name_en') as string;
		const nameFi = formData.get('name_fi') as string;
		const slugEn = formData.get('slug_en') as string;
		const slugFi = formData.get('slug_fi') as string;
		const descriptionEn = formData.get('description_en') as string;
		const descriptionFi = formData.get('description_fi') as string;
		const enabled = formData.get('enabled') === 'on';

		if (!nameEn || !slugEn) {
			return fail(400, { error: 'English name and slug are required' });
		}

		try {
			await productService.update(id, {
				enabled,
				translations: [
					{
						languageCode: 'en',
						name: nameEn,
						slug: slugEn,
						description: descriptionEn || undefined
					},
					{
						languageCode: 'fi',
						name: nameFi || nameEn,
						slug: slugFi || slugEn,
						description: descriptionFi || undefined
					}
				]
			});

			return { success: true };
		} catch (e) {
			return fail(500, { error: 'Failed to update product' });
		}
	},

	delete: async ({ params }) => {
		const id = Number(params.id);

		await productService.delete(id);

		throw redirect(303, '/admin/products');
	},

	addVariant: async ({ params, request }) => {
		const productId = Number(params.id);
		const formData = await request.formData();

		const sku = formData.get('sku') as string;
		const price = Number(formData.get('price')) * 100; // Convert to cents
		const stock = Number(formData.get('stock')) || 0;
		const nameEn = formData.get('variant_name_en') as string;

		if (!sku || isNaN(price)) {
			return fail(400, { variantError: 'SKU and price are required' });
		}

		try {
			await productService.createVariant({
				productId,
				sku,
				price,
				stock,
				translations: nameEn ? [{ languageCode: 'en', name: nameEn }] : []
			});

			return { variantSuccess: true };
		} catch (e) {
			return fail(500, { variantError: 'Failed to create variant' });
		}
	}
};
