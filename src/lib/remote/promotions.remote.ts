/**
 * Promotion Remote Functions
 * Type-safe server functions for promotion operations
 */
import { query, command } from '$app/server';
import { promotionService } from '$lib/server/services/promotions.js';
import type { CreatePromotionInput } from '$lib/commerce/types.js';

// ============================================================================
// PROMOTION QUERIES
// ============================================================================

export const listPromotions = query(
	'unchecked',
	async (
		input: {
			enabled?: boolean;
			limit?: number;
			offset?: number;
		} = {}
	) => {
		return promotionService.list(input);
	}
);

export const listActivePromotions = query(async () => {
	return promotionService.listActive();
});

export const getPromotion = query('unchecked', async (input: { id: number }) => {
	return promotionService.getById(input.id);
});

export const getPromotionByCode = query('unchecked', async (input: { code: string }) => {
	return promotionService.getByCode(input.code);
});

export const validatePromotion = query(
	'unchecked',
	async (input: { code: string; orderAmount: number }) => {
		return promotionService.validate(input.code, input.orderAmount);
	}
);

// ============================================================================
// PROMOTION MUTATIONS
// ============================================================================

export const createPromotion = command('unchecked', async (input: CreatePromotionInput) => {
	return promotionService.create(input);
});

export const updatePromotion = command(
	'unchecked',
	async (input: {
		id: number;
		data: Partial<Omit<CreatePromotionInput, 'code'> & { enabled?: boolean }>;
	}) => {
		return promotionService.update(input.id, input.data);
	}
);

export const togglePromotion = command(
	'unchecked',
	async (input: { id: number; enabled: boolean }) => {
		return promotionService.setEnabled(input.id, input.enabled);
	}
);

export const deletePromotion = command('unchecked', async (input: { id: number }) => {
	return promotionService.delete(input.id);
});
