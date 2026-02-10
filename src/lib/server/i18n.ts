/**
 * Translation Resolution Utilities
 * Resolves translation arrays into flat fields on entities.
 * Services call these functions so routes/components get pre-resolved objects.
 */
import { DEFAULT_LANGUAGE } from "$lib/utils.js";
import type {
	ProductWithRelations,
	ProductVariantWithRelations,
	FacetValueWithTranslations,
	FacetWithValues,
	CollectionWithRelations,
	CollectionWithCount,
	ContentPageWithTranslations,
	ResolvedProduct,
	ResolvedProductVariant,
	ResolvedFacetValue,
	ResolvedFacet,
	ResolvedCollection,
	ResolvedCollectionWithCount,
	ResolvedContentPage
} from "$lib/types.js";
import type {
	CategoryWithTranslations,
	CategoryTreeNode,
	ResolvedCategory,
	ResolvedCategoryTreeNode
} from "$lib/server/services/categories.js";

/**
 * Find a translation matching the given language, falling back to the first translation
 */
export function resolveTranslation<T extends { languageCode: string }>(
	translations: T[],
	language: string = DEFAULT_LANGUAGE
): T | undefined {
	return translations.find((t) => t.languageCode === language) ?? translations[0];
}

/**
 * Resolve a facet value: merge translated name onto the entity
 */
export function resolveFacetValue(
	fv: FacetValueWithTranslations,
	language: string = DEFAULT_LANGUAGE
): ResolvedFacetValue {
	const t = resolveTranslation(fv.translations, language);
	return {
		...fv,
		name: t?.name ?? fv.code
	};
}

/**
 * Resolve a facet: merge translated name and resolve all values
 */
export function resolveFacet(
	facet: FacetWithValues,
	language: string = DEFAULT_LANGUAGE
): ResolvedFacet {
	const t = resolveTranslation(facet.translations, language);
	return {
		...facet,
		name: t?.name ?? facet.code,
		values: facet.values.map((v) => resolveFacetValue(v, language))
	};
}

/**
 * Resolve a product variant: merge translated name and resolve facet values
 */
export function resolveVariant(
	variant: ProductVariantWithRelations,
	language: string = DEFAULT_LANGUAGE
): ResolvedProductVariant {
	const t = resolveTranslation(variant.translations, language);
	return {
		...variant,
		name: t?.name ?? variant.sku,
		facetValues: variant.facetValues.map((fv) => resolveFacetValue(fv, language))
	};
}

/**
 * Resolve a product: merge translated fields and resolve nested entities
 */
export function resolveProduct(
	product: ProductWithRelations,
	language: string = DEFAULT_LANGUAGE
): ResolvedProduct {
	const t = resolveTranslation(product.translations, language);
	return {
		...product,
		name: t?.name ?? "Untitled",
		slug: t?.slug ?? "",
		description: t?.description ?? null,
		variants: product.variants.map((v) => resolveVariant(v, language)),
		facetValues: product.facetValues.map((fv) => resolveFacetValue(fv, language))
	};
}

/**
 * Resolve a collection: merge translated fields
 */
export function resolveCollection(
	collection: CollectionWithRelations,
	language: string = DEFAULT_LANGUAGE
): ResolvedCollection {
	const t = resolveTranslation(collection.translations, language);
	return {
		...collection,
		name: t?.name ?? "Untitled",
		slug: t?.slug ?? "",
		description: t?.description ?? null
	};
}

/**
 * Resolve a collection with count
 */
export function resolveCollectionWithCount(
	collection: CollectionWithCount,
	language: string = DEFAULT_LANGUAGE
): ResolvedCollectionWithCount {
	const t = resolveTranslation(collection.translations, language);
	return {
		...collection,
		name: t?.name ?? "Untitled",
		slug: t?.slug ?? "",
		description: t?.description ?? null,
		filters: (collection as unknown as CollectionWithRelations).filters ?? []
	};
}

/**
 * Resolve a category: merge translated name
 */
export function resolveCategory(
	category: CategoryWithTranslations,
	language: string = DEFAULT_LANGUAGE
): ResolvedCategory {
	const t = resolveTranslation(category.translations, language);
	return {
		...category,
		name: t?.name ?? category.slug
	};
}

/**
 * Resolve a category tree node recursively
 */
export function resolveCategoryTreeNode(
	node: CategoryTreeNode,
	language: string = DEFAULT_LANGUAGE
): ResolvedCategoryTreeNode {
	const t = resolveTranslation(node.translations, language);
	return {
		...node,
		name: t?.name ?? node.slug,
		children: node.children.map((c) => resolveCategoryTreeNode(c, language))
	};
}

/**
 * Resolve a content page: merge translated fields
 */
export function resolveContentPage(
	page: ContentPageWithTranslations,
	language: string = DEFAULT_LANGUAGE
): ResolvedContentPage {
	const t = resolveTranslation(page.translations, language);
	return {
		...page,
		title: t?.title ?? "Untitled",
		slug: t?.slug ?? "",
		body: t?.body ?? null
	};
}
