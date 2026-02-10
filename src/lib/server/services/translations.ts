import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import {
	productTranslations,
	productVariantTranslations,
	facetTranslations,
	facetValueTranslations,
	collectionTranslations,
	categoryTranslations,
	contentPageTranslations
} from "../db/schema.js";

export class TranslationService {
	// ── Products ──────────────────────────────────────────────────────────

	async getProductTranslations(productId: number) {
		return db
			.select()
			.from(productTranslations)
			.where(eq(productTranslations.productId, productId));
	}

	async upsertProductTranslation(
		productId: number,
		languageCode: string,
		data: { name: string; slug: string; description?: string | null }
	) {
		await db
			.insert(productTranslations)
			.values({
				productId,
				languageCode,
				name: data.name,
				slug: data.slug,
				description: data.description ?? null
			})
			.onConflictDoUpdate({
				target: [productTranslations.productId, productTranslations.languageCode],
				set: {
					name: data.name,
					slug: data.slug,
					description: data.description ?? null
				}
			});
	}

	// ── Product Variants ─────────────────────────────────────────────────

	async getVariantTranslations(variantId: number) {
		return db
			.select()
			.from(productVariantTranslations)
			.where(eq(productVariantTranslations.variantId, variantId));
	}

	async upsertVariantTranslation(
		variantId: number,
		languageCode: string,
		data: { name?: string | null }
	) {
		await db
			.insert(productVariantTranslations)
			.values({
				variantId,
				languageCode,
				name: data.name ?? null
			})
			.onConflictDoUpdate({
				target: [productVariantTranslations.variantId, productVariantTranslations.languageCode],
				set: {
					name: data.name ?? null
				}
			});
	}

	// ── Facets ────────────────────────────────────────────────────────────

	async getFacetTranslations(facetId: number) {
		return db
			.select()
			.from(facetTranslations)
			.where(eq(facetTranslations.facetId, facetId));
	}

	async upsertFacetTranslation(
		facetId: number,
		languageCode: string,
		data: { name: string }
	) {
		await db
			.insert(facetTranslations)
			.values({
				facetId,
				languageCode,
				name: data.name
			})
			.onConflictDoUpdate({
				target: [facetTranslations.facetId, facetTranslations.languageCode],
				set: {
					name: data.name
				}
			});
	}

	// ── Facet Values ─────────────────────────────────────────────────────

	async getAllFacetValueTranslations(facetId: number) {
		// Get all facet values for this facet, then their translations
		const { facetValues } = await import("../db/schema.js");
		const values = await db
			.select({ id: facetValues.id })
			.from(facetValues)
			.where(eq(facetValues.facetId, facetId));

		const valueIds = values.map((v) => v.id);
		if (valueIds.length === 0) return {};

		const { inArray } = await import("drizzle-orm");
		const rows = await db
			.select()
			.from(facetValueTranslations)
			.where(inArray(facetValueTranslations.facetValueId, valueIds));

		// Group by facetValueId
		const map: Record<number, typeof rows> = {};
		for (const row of rows) {
			if (!map[row.facetValueId]) map[row.facetValueId] = [];
			map[row.facetValueId].push(row);
		}
		return map;
	}

	async upsertFacetValueTranslation(
		facetValueId: number,
		languageCode: string,
		data: { name: string }
	) {
		await db
			.insert(facetValueTranslations)
			.values({
				facetValueId,
				languageCode,
				name: data.name
			})
			.onConflictDoUpdate({
				target: [facetValueTranslations.facetValueId, facetValueTranslations.languageCode],
				set: {
					name: data.name
				}
			});
	}

	// ── Collections ──────────────────────────────────────────────────────

	async getCollectionTranslations(collectionId: number) {
		return db
			.select()
			.from(collectionTranslations)
			.where(eq(collectionTranslations.collectionId, collectionId));
	}

	async upsertCollectionTranslation(
		collectionId: number,
		languageCode: string,
		data: { name: string; slug: string; description?: string | null }
	) {
		await db
			.insert(collectionTranslations)
			.values({
				collectionId,
				languageCode,
				name: data.name,
				slug: data.slug,
				description: data.description ?? null
			})
			.onConflictDoUpdate({
				target: [collectionTranslations.collectionId, collectionTranslations.languageCode],
				set: {
					name: data.name,
					slug: data.slug,
					description: data.description ?? null
				}
			});
	}

	// ── Categories ───────────────────────────────────────────────────────

	async getCategoryTranslations(categoryId: number) {
		return db
			.select()
			.from(categoryTranslations)
			.where(eq(categoryTranslations.categoryId, categoryId));
	}

	async getAllCategoryTranslations() {
		const rows = await db.select().from(categoryTranslations);

		// Group by categoryId
		const map: Record<number, typeof rows> = {};
		for (const row of rows) {
			if (!map[row.categoryId]) map[row.categoryId] = [];
			map[row.categoryId].push(row);
		}
		return map;
	}

	async upsertCategoryTranslation(
		categoryId: number,
		languageCode: string,
		data: { name: string }
	) {
		await db
			.insert(categoryTranslations)
			.values({
				categoryId,
				languageCode,
				name: data.name
			})
			.onConflictDoUpdate({
				target: [categoryTranslations.categoryId, categoryTranslations.languageCode],
				set: {
					name: data.name
				}
			});
	}

	// ── Content Pages ────────────────────────────────────────────────────

	async getContentPageTranslations(pageId: number) {
		return db
			.select()
			.from(contentPageTranslations)
			.where(eq(contentPageTranslations.contentPageId, pageId));
	}

	async upsertContentPageTranslation(
		pageId: number,
		languageCode: string,
		data: { title: string; slug: string; body?: string | null }
	) {
		await db
			.insert(contentPageTranslations)
			.values({
				contentPageId: pageId,
				languageCode,
				title: data.title,
				slug: data.slug,
				body: data.body ?? null
			})
			.onConflictDoUpdate({
				target: [contentPageTranslations.contentPageId, contentPageTranslations.languageCode],
				set: {
					title: data.title,
					slug: data.slug,
					body: data.body ?? null
				}
			});
	}
}

export const translationService = new TranslationService();
