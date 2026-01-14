/**
 * Facet Service
 * Handles facets and facet values for product filtering
 */
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
	facets,
	facetTranslations,
	facetValues,
	facetValueTranslations,
	productFacetValues
} from "../db/schema.js";
import type {
	Facet,
	FacetWithValues,
	FacetValue,
	FacetValueWithTranslations,
	PaginatedResult
} from "$lib/types.js";

export class FacetService {
	private defaultLanguage = "en";

	/**
	 * Create a new facet
	 */
	async create(input: {
		code: string;
		isPrivate?: boolean;
		translations: { languageCode: string; name: string }[];
	}): Promise<Facet> {
		const [facet] = await db
			.insert(facets)
			.values({
				code: input.code,
				isPrivate: input.isPrivate ?? false
			})
			.returning();

		// Insert translations
		if (input.translations.length > 0) {
			await db.insert(facetTranslations).values(
				input.translations.map((t) => ({
					facetId: facet.id,
					languageCode: t.languageCode,
					name: t.name
				}))
			);
		}

		return facet;
	}

	/**
	 * Get facet by ID with values
	 */
	async getById(id: number, language?: string): Promise<FacetWithValues | null> {
		const lang = language ?? this.defaultLanguage;

		const [facet] = await db.select().from(facets).where(eq(facets.id, id));

		if (!facet) return null;

		return this.loadFacetWithValues(facet, lang);
	}

	/**
	 * Get facet by code
	 */
	async getByCode(code: string, language?: string): Promise<FacetWithValues | null> {
		const lang = language ?? this.defaultLanguage;

		const [facet] = await db.select().from(facets).where(eq(facets.code, code));

		if (!facet) return null;

		return this.loadFacetWithValues(facet, lang);
	}

	/**
	 * List all facets
	 */
	async list(language?: string): Promise<FacetWithValues[]> {
		const lang = language ?? this.defaultLanguage;

		const facetList = await db.select().from(facets).orderBy(facets.code);

		return Promise.all(facetList.map((f: Facet) => this.loadFacetWithValues(f, lang)));
	}

	/**
	 * Update a facet
	 */
	async update(
		id: number,
		input: {
			code?: string;
			isPrivate?: boolean;
			translations?: { languageCode: string; name: string }[];
		}
	): Promise<Facet | null> {
		const [facet] = await db.select().from(facets).where(eq(facets.id, id));

		if (!facet) return null;

		const [updated] = await db
			.update(facets)
			.set({
				...(input.code && { code: input.code }),
				...(input.isPrivate !== undefined && { isPrivate: input.isPrivate }),
				updatedAt: new Date()
			})
			.where(eq(facets.id, id))
			.returning();

		// Update translations
		if (input.translations) {
			for (const t of input.translations) {
				await db
					.insert(facetTranslations)
					.values({
						facetId: id,
						languageCode: t.languageCode,
						name: t.name
					})
					.onConflictDoUpdate({
						target: [facetTranslations.facetId, facetTranslations.languageCode],
						set: { name: t.name }
					});
			}
		}

		return updated;
	}

	/**
	 * Delete a facet (cascade deletes values)
	 */
	async delete(id: number): Promise<boolean> {
		await db.delete(facets).where(eq(facets.id, id));
		return true;
	}

	// ============================================================================
	// FACET VALUE METHODS
	// ============================================================================

	/**
	 * Create a facet value
	 */
	async createValue(input: {
		facetId: number;
		code: string;
		translations: { languageCode: string; name: string }[];
	}): Promise<FacetValue> {
		const [value] = await db
			.insert(facetValues)
			.values({
				facetId: input.facetId,
				code: input.code
			})
			.returning();

		// Insert translations
		if (input.translations.length > 0) {
			await db.insert(facetValueTranslations).values(
				input.translations.map((t) => ({
					facetValueId: value.id,
					languageCode: t.languageCode,
					name: t.name
				}))
			);
		}

		return value;
	}

	/**
	 * Get facet value by ID
	 */
	async getValueById(id: number, language?: string): Promise<FacetValueWithTranslations | null> {
		const lang = language ?? this.defaultLanguage;

		const [value] = await db.select().from(facetValues).where(eq(facetValues.id, id));

		if (!value) return null;

		const translations = await db
			.select()
			.from(facetValueTranslations)
			.where(eq(facetValueTranslations.facetValueId, id));

		return { ...value, translations };
	}

	/**
	 * Update a facet value
	 */
	async updateValue(
		id: number,
		input: {
			code?: string;
			translations?: { languageCode: string; name: string }[];
		}
	): Promise<FacetValue | null> {
		const [value] = await db.select().from(facetValues).where(eq(facetValues.id, id));

		if (!value) return null;

		const [updated] = await db
			.update(facetValues)
			.set({
				...(input.code && { code: input.code }),
				updatedAt: new Date()
			})
			.where(eq(facetValues.id, id))
			.returning();

		// Update translations
		if (input.translations) {
			for (const t of input.translations) {
				await db
					.insert(facetValueTranslations)
					.values({
						facetValueId: id,
						languageCode: t.languageCode,
						name: t.name
					})
					.onConflictDoUpdate({
						target: [
							facetValueTranslations.facetValueId,
							facetValueTranslations.languageCode
						],
						set: { name: t.name }
					});
			}
		}

		return updated;
	}

	/**
	 * Delete a facet value
	 */
	async deleteValue(id: number): Promise<boolean> {
		await db.delete(facetValues).where(eq(facetValues.id, id));
		return true;
	}

	/**
	 * Get products count for a facet value
	 */
	async getValueProductCount(valueId: number): Promise<number> {
		const result = await db
			.select({ count: sql<number>`count(*)` })
			.from(productFacetValues)
			.where(eq(productFacetValues.facetValueId, valueId));

		return Number(result[0]?.count ?? 0);
	}

	// ============================================================================
	// PRIVATE HELPERS
	// ============================================================================

	private async loadFacetWithValues(facet: Facet, language: string): Promise<FacetWithValues> {
		// Load translations
		const translations = await db
			.select()
			.from(facetTranslations)
			.where(eq(facetTranslations.facetId, facet.id));

		// Load values
		const valueList = await db
			.select()
			.from(facetValues)
			.where(eq(facetValues.facetId, facet.id))
			.orderBy(facetValues.code);

		const values: FacetValueWithTranslations[] = [];
		for (const v of valueList) {
			const valueTranslations = await db
				.select()
				.from(facetValueTranslations)
				.where(eq(facetValueTranslations.facetValueId, v.id));

			values.push({ ...v, translations: valueTranslations });
		}

		return {
			...facet,
			translations,
			values
		};
	}
}

// Export singleton instance
export const facetService = new FacetService();
