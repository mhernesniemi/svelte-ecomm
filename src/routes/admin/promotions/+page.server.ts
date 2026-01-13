import { promotionService } from '$lib/server/services/promotions.js';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const result = await promotionService.list();

	return { promotions: result.items };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();

		const code = formData.get('code') as string;
		const discountType = formData.get('discountType') as 'percentage' | 'fixed_amount';
		const discountValue = Number(formData.get('discountValue'));
		const minOrderAmount = formData.get('minOrderAmount')
			? Number(formData.get('minOrderAmount')) * 100
			: undefined;
		const usageLimit = formData.get('usageLimit') ? Number(formData.get('usageLimit')) : undefined;

		if (!code || !discountType || isNaN(discountValue)) {
			return fail(400, { error: 'Code, type, and value are required' });
		}

		// Convert to cents for fixed_amount
		const value = discountType === 'fixed_amount' ? discountValue * 100 : discountValue;

		try {
			await promotionService.create({
				code,
				discountType,
				discountValue: value,
				minOrderAmount,
				usageLimit
			});

			return { success: true };
		} catch (e) {
			return fail(500, { error: 'Failed to create promotion' });
		}
	},

	toggle: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));
		const enabled = formData.get('enabled') === 'true';

		await promotionService.setEnabled(id, enabled);

		return { toggled: true };
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));

		await promotionService.delete(id);

		return { deleted: true };
	}
};
