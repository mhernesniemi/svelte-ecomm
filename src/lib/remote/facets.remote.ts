/**
 * Facet Remote Functions
 * Type-safe server functions for facet operations
 */
import { query, command } from '$app/server';
import { facetService } from '$lib/server/services/facets.js';

// ============================================================================
// FACET OPERATIONS
// ============================================================================

export const listFacets = query('unchecked', async (input: { language?: string } = {}) => {
	return facetService.list(input.language ?? 'en');
});

export const getFacet = query('unchecked', async (input: { id: number; language?: string }) => {
	return facetService.getById(input.id, input.language ?? 'en');
});

export const getFacetByCode = query(
	'unchecked',
	async (input: { code: string; language?: string }) => {
		return facetService.getByCode(input.code, input.language ?? 'en');
	}
);

export const createFacet = command(
	'unchecked',
	async (input: {
		code: string;
		isPrivate?: boolean;
		translations: { languageCode: string; name: string }[];
	}) => {
		return facetService.create(input);
	}
);

export const updateFacet = command(
	'unchecked',
	async (input: {
		id: number;
		data: {
			code?: string;
			isPrivate?: boolean;
			translations?: { languageCode: string; name: string }[];
		};
	}) => {
		return facetService.update(input.id, input.data);
	}
);

export const deleteFacet = command('unchecked', async (input: { id: number }) => {
	return facetService.delete(input.id);
});

// ============================================================================
// FACET VALUE OPERATIONS
// ============================================================================

export const getFacetValue = query(
	'unchecked',
	async (input: { id: number; language?: string }) => {
		return facetService.getValueById(input.id, input.language ?? 'en');
	}
);

export const createFacetValue = command(
	'unchecked',
	async (input: {
		facetId: number;
		code: string;
		translations: { languageCode: string; name: string }[];
	}) => {
		return facetService.createValue(input);
	}
);

export const updateFacetValue = command(
	'unchecked',
	async (input: {
		id: number;
		data: {
			code?: string;
			translations?: { languageCode: string; name: string }[];
		};
	}) => {
		return facetService.updateValue(input.id, input.data);
	}
);

export const deleteFacetValue = command('unchecked', async (input: { id: number }) => {
	return facetService.deleteValue(input.id);
});

export const getFacetValueProductCount = query('unchecked', async (input: { valueId: number }) => {
	return facetService.getValueProductCount(input.valueId);
});
