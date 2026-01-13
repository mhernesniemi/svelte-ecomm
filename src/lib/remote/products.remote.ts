/**
 * Product Remote Functions
 * Type-safe server functions for product operations
 */
import { query, command } from '$app/server';
import { productService } from '$lib/server/services/products.js';
import type {
	ProductListOptions,
	CreateProductInput,
	UpdateProductInput,
	CreateVariantInput,
	UpdateVariantInput
} from '$lib/commerce/types.js';

// ============================================================================
// PRODUCT QUERIES
// ============================================================================

export const listProducts = query('unchecked', async (input: ProductListOptions = {}) => {
	return productService.list(input);
});

export const getProduct = query('unchecked', async (input: { id: number; language?: string }) => {
	return productService.getById(input.id, input.language ?? 'en');
});

export const getProductBySlug = query(
	'unchecked',
	async (input: { slug: string; language?: string }) => {
		return productService.getBySlug(input.slug, input.language ?? 'en');
	}
);

export const getFacetCounts = query(
	'unchecked',
	async (input: {
		facetCode: string;
		currentFilters?: Record<string, string[]>;
		language?: string;
	}) => {
		return productService.getFacetCounts(
			input.facetCode,
			input.currentFilters ?? {},
			input.language ?? 'en'
		);
	}
);

// ============================================================================
// PRODUCT MUTATIONS
// ============================================================================

export const createProduct = command('unchecked', async (input: CreateProductInput) => {
	return productService.create(input);
});

export const updateProduct = command(
	'unchecked',
	async (input: { id: number; data: UpdateProductInput }) => {
		return productService.update(input.id, input.data);
	}
);

export const deleteProduct = command('unchecked', async (input: { id: number }) => {
	return productService.delete(input.id);
});

export const addProductFacetValue = command(
	'unchecked',
	async (input: { productId: number; facetValueId: number }) => {
		return productService.addFacetValue(input.productId, input.facetValueId);
	}
);

export const removeProductFacetValue = command(
	'unchecked',
	async (input: { productId: number; facetValueId: number }) => {
		return productService.removeFacetValue(input.productId, input.facetValueId);
	}
);

// ============================================================================
// VARIANT MUTATIONS
// ============================================================================

export const createVariant = command('unchecked', async (input: CreateVariantInput) => {
	return productService.createVariant(input);
});

export const updateVariant = command(
	'unchecked',
	async (input: { id: number; data: UpdateVariantInput }) => {
		return productService.updateVariant(input.id, input.data);
	}
);

export const deleteVariant = command('unchecked', async (input: { id: number }) => {
	return productService.deleteVariant(input.id);
});

export const updateVariantStock = command(
	'unchecked',
	async (input: { variantId: number; quantity: number }) => {
		return productService.updateStock(input.variantId, input.quantity);
	}
);
