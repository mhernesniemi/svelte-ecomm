/**
 * Product Service
 * Handles all product-related business logic and database operations
 */
import { eq, and, desc, asc, sql, inArray, isNull, like } from "drizzle-orm";
import { db } from "../db/index.js";
import {
	products,
	productTranslations,
	productVariants,
	productVariantTranslations,
	productFacetValues,
	variantFacetValues,
	facetValues,
	facetValueTranslations,
	facets,
	facetTranslations,
	productAssets,
	assets
} from "../db/schema.js";
import type {
	Product,
	ProductWithRelations,
	ProductVariant,
	ProductVariantWithRelations,
	ProductListOptions,
	CreateProductInput,
	UpdateProductInput,
	CreateVariantInput,
	UpdateVariantInput,
	FacetCount,
	PaginatedResult
} from "$lib/types.js";

export class ProductService {
	private defaultLanguage = "en";

	/**
	 * List products with filtering and pagination
	 */
	async list(options: ProductListOptions = {}): Promise<PaginatedResult<ProductWithRelations>> {
		const {
			language = this.defaultLanguage,
			facets: facetFilters,
			search,
			visibility = "public",
			limit = 20,
			offset = 0
		} = options;

		// Build base query conditions
		const conditions = [isNull(products.deletedAt)];

		if (visibility !== undefined) {
			if (Array.isArray(visibility)) {
				conditions.push(inArray(products.visibility, visibility));
			} else {
				conditions.push(eq(products.visibility, visibility));
			}
		}

		// Get product IDs that match facet filters
		let productIdsFromFacets: number[] | null = null;
		if (facetFilters && Object.keys(facetFilters).length > 0) {
			productIdsFromFacets = await this.getProductIdsByFacets(facetFilters);
			if (productIdsFromFacets.length === 0) {
				return { items: [], pagination: { total: 0, limit, offset, hasMore: false } };
			}
			conditions.push(inArray(products.id, productIdsFromFacets));
		}

		// Search filter
		if (search) {
			const searchProductIds = await this.searchProductIds(search, language);
			if (searchProductIds.length === 0) {
				return { items: [], pagination: { total: 0, limit, offset, hasMore: false } };
			}
			conditions.push(inArray(products.id, searchProductIds));
		}

		// Count total
		const countResult = await db
			.select({ count: sql<number>`count(*)` })
			.from(products)
			.where(and(...conditions));
		const total = Number(countResult[0]?.count ?? 0);

		// Fetch products
		const productList = await db
			.select()
			.from(products)
			.where(and(...conditions))
			.orderBy(desc(products.createdAt))
			.limit(limit)
			.offset(offset);

		// Load relations for each product
		const items = await Promise.all(
			productList.map((p) => this.loadProductRelations(p, language))
		);

		return {
			items,
			pagination: {
				total,
				limit,
				offset,
				hasMore: offset + items.length < total
			}
		};
	}

	/**
	 * Get a single product by ID
	 */
	async getById(id: number, language?: string): Promise<ProductWithRelations | null> {
		const lang = language ?? this.defaultLanguage;

		const product = await db
			.select()
			.from(products)
			.where(and(eq(products.id, id), isNull(products.deletedAt)))
			.limit(1);

		if (!product[0]) return null;

		return this.loadProductRelations(product[0], lang);
	}

	/**
	 * Get a product by slug
	 */
	async getBySlug(slug: string, language?: string): Promise<ProductWithRelations | null> {
		const lang = language ?? this.defaultLanguage;

		const translation = await db
			.select()
			.from(productTranslations)
			.where(eq(productTranslations.slug, slug))
			.limit(1);

		if (!translation[0]) return null;

		return this.getById(translation[0].productId, lang);
	}

	/**
	 * Create a new product
	 */
	async create(input: CreateProductInput): Promise<Product> {
		const [product] = await db
			.insert(products)
			.values({
				type: input.type ?? "physical",
				visibility: input.visibility ?? "public",
				taxCode: input.taxCode ?? "standard"
			})
			.returning();

		// Insert translations
		if (input.translations.length > 0) {
			await db.insert(productTranslations).values(
				input.translations.map((t) => ({
					productId: product.id,
					languageCode: t.languageCode,
					name: t.name,
					slug: t.slug,
					description: t.description
				}))
			);
		}

		return product;
	}

	/**
	 * Update an existing product
	 */
	async update(id: number, input: UpdateProductInput): Promise<ProductWithRelations | null> {
		const existing = await this.getById(id);
		if (!existing) return null;

		// Update product fields
		const updates: {
			type?: "physical" | "digital";
			visibility?: "public" | "private" | "hidden";
			taxCode?: string;
		} = {};
		if (input.type !== undefined) updates.type = input.type;
		if (input.visibility !== undefined) updates.visibility = input.visibility;
		if (input.taxCode !== undefined) updates.taxCode = input.taxCode;

		if (Object.keys(updates).length > 0) {
			await db.update(products).set(updates).where(eq(products.id, id));
		}

		// Update translations
		if (input.translations) {
			for (const t of input.translations) {
				await db
					.insert(productTranslations)
					.values({
						productId: id,
						languageCode: t.languageCode,
						name: t.name ?? "",
						slug: t.slug ?? "",
						description: t.description
					})
					.onConflictDoUpdate({
						target: [productTranslations.productId, productTranslations.languageCode],
						set: {
							...(t.name && { name: t.name }),
							...(t.slug && { slug: t.slug }),
							...(t.description !== undefined && { description: t.description })
						}
					});
			}
		}

		return this.getById(id);
	}

	/**
	 * Soft delete a product and clean up translations
	 */
	async delete(id: number): Promise<boolean> {
		await db.delete(productTranslations).where(eq(productTranslations.productId, id));

		await db.update(products).set({ deletedAt: new Date() }).where(eq(products.id, id));

		return true;
	}

	/**
	 * Add a facet value to a product
	 */
	async addFacetValue(productId: number, facetValueId: number): Promise<void> {
		await db
			.insert(productFacetValues)
			.values({ productId, facetValueId })
			.onConflictDoNothing();
	}

	/**
	 * Remove a facet value from a product
	 */
	async removeFacetValue(productId: number, facetValueId: number): Promise<void> {
		await db
			.delete(productFacetValues)
			.where(
				and(
					eq(productFacetValues.productId, productId),
					eq(productFacetValues.facetValueId, facetValueId)
				)
			);
	}

	/**
	 * Get facet counts for filtering UI
	 */
	async getFacetCounts(
		facetCode: string,
		currentFilters: Record<string, string[]> = {},
		language?: string
	): Promise<FacetCount[]> {
		const lang = language ?? this.defaultLanguage;

		// Get the facet
		const facet = await db.select().from(facets).where(eq(facets.code, facetCode)).limit(1);

		if (!facet[0]) return [];

		// Get all values for this facet with counts
		const values = await db
			.select({
				valueId: facetValues.id,
				valueCode: facetValues.code,
				count: sql<number>`count(distinct ${productFacetValues.productId})`
			})
			.from(facetValues)
			.leftJoin(productFacetValues, eq(productFacetValues.facetValueId, facetValues.id))
			.leftJoin(products, eq(products.id, productFacetValues.productId))
			.where(and(eq(facetValues.facetId, facet[0].id), isNull(products.deletedAt)))
			.groupBy(facetValues.id, facetValues.code);

		// Get translations
		const result: FacetCount[] = [];
		for (const v of values) {
			const translation = await db
				.select()
				.from(facetValueTranslations)
				.where(
					and(
						eq(facetValueTranslations.facetValueId, v.valueId),
						eq(facetValueTranslations.languageCode, lang)
					)
				)
				.limit(1);

			result.push({
				facetCode,
				valueCode: v.valueCode,
				valueName: translation[0]?.name ?? v.valueCode,
				count: Number(v.count)
			});
		}

		return result;
	}

	// ============================================================================
	// VARIANT METHODS
	// ============================================================================

	/**
	 * Create a product variant
	 */
	async createVariant(input: CreateVariantInput): Promise<ProductVariant> {
		const [variant] = await db
			.insert(productVariants)
			.values({
				productId: input.productId,
				sku: input.sku,
				price: input.price,
				stock: input.stock ?? 0
			})
			.returning();

		// Insert translations
		if (input.translations && input.translations.length > 0) {
			await db.insert(productVariantTranslations).values(
				input.translations.map((t) => ({
					variantId: variant.id,
					languageCode: t.languageCode,
					name: t.name
				}))
			);
		}

		return variant;
	}

	/**
	 * Update a variant
	 */
	async updateVariant(id: number, input: UpdateVariantInput): Promise<ProductVariant | null> {
		const [variant] = await db.select().from(productVariants).where(eq(productVariants.id, id));

		if (!variant) return null;

		const updateData: Partial<typeof variant> = {};
		if (input.sku !== undefined) updateData.sku = input.sku;
		if (input.price !== undefined) updateData.price = input.price;
		if (input.stock !== undefined) updateData.stock = input.stock;

		const [updated] = await db
			.update(productVariants)
			.set(updateData)
			.where(eq(productVariants.id, id))
			.returning();

		// Update translations
		if (input.translations) {
			for (const t of input.translations) {
				await db
					.insert(productVariantTranslations)
					.values({
						variantId: id,
						languageCode: t.languageCode,
						name: t.name
					})
					.onConflictDoUpdate({
						target: [
							productVariantTranslations.variantId,
							productVariantTranslations.languageCode
						],
						set: { name: t.name }
					});
			}
		}

		return updated;
	}

	/**
	 * Delete a variant
	 */
	async deleteVariant(id: number): Promise<boolean> {
		await db
			.update(productVariants)
			.set({ deletedAt: new Date() })
			.where(eq(productVariants.id, id));

		return true;
	}

	/**
	 * Update variant stock
	 */
	async updateStock(variantId: number, quantity: number): Promise<void> {
		await db
			.update(productVariants)
			.set({
				stock: sql`${productVariants.stock} + ${quantity}`
			})
			.where(eq(productVariants.id, variantId));
	}

	/**
	 * Add facet value to variant
	 */
	async getVariantById(
		variantId: number,
		language?: string
	): Promise<ProductVariantWithRelations | null> {
		const lang = language ?? this.defaultLanguage;

		const variant = await db
			.select()
			.from(productVariants)
			.where(and(eq(productVariants.id, variantId), isNull(productVariants.deletedAt)))
			.limit(1);

		if (!variant[0]) return null;

		return this.loadVariantRelations(variant[0], lang);
	}

	async addVariantFacetValue(variantId: number, facetValueId: number): Promise<void> {
		await db
			.insert(variantFacetValues)
			.values({ variantId, facetValueId })
			.onConflictDoNothing();
	}

	async removeVariantFacetValue(variantId: number, facetValueId: number): Promise<void> {
		await db
			.delete(variantFacetValues)
			.where(
				and(
					eq(variantFacetValues.variantId, variantId),
					eq(variantFacetValues.facetValueId, facetValueId)
				)
			);
	}

	// ============================================================================
	// PRIVATE HELPERS
	// ============================================================================

	private async loadProductRelations(
		product: Product,
		language: string
	): Promise<ProductWithRelations> {
		// Load translations
		const translations = await db
			.select()
			.from(productTranslations)
			.where(eq(productTranslations.productId, product.id));

		// Load variants
		const variantList = await db
			.select()
			.from(productVariants)
			.where(
				and(eq(productVariants.productId, product.id), isNull(productVariants.deletedAt))
			);

		const variants = await Promise.all(
			variantList.map((v) => this.loadVariantRelations(v, language))
		);

		// Load facet values
		const facetValueIds = await db
			.select({ facetValueId: productFacetValues.facetValueId })
			.from(productFacetValues)
			.where(eq(productFacetValues.productId, product.id));

		const facetValuesData = [];
		for (const fv of facetValueIds) {
			const value = await db
				.select()
				.from(facetValues)
				.where(eq(facetValues.id, fv.facetValueId))
				.limit(1);

			if (value[0]) {
				const valueTranslations = await db
					.select()
					.from(facetValueTranslations)
					.where(eq(facetValueTranslations.facetValueId, value[0].id));

				facetValuesData.push({
					...value[0],
					translations: valueTranslations
				});
			}
		}

		// Load assets
		const productAssetList = await db
			.select({ asset: assets, position: productAssets.position })
			.from(productAssets)
			.innerJoin(assets, eq(assets.id, productAssets.assetId))
			.where(eq(productAssets.productId, product.id))
			.orderBy(asc(productAssets.position));

		const assetList = productAssetList.map((pa) => pa.asset);

		// Load featured asset
		let featuredAsset = null;
		if (product.featuredAssetId) {
			const [fa] = await db
				.select()
				.from(assets)
				.where(eq(assets.id, product.featuredAssetId));
			featuredAsset = fa ?? null;
		}

		return {
			...product,
			translations,
			variants,
			facetValues: facetValuesData,
			assets: assetList,
			featuredAsset
		};
	}

	private async loadVariantRelations(
		variant: ProductVariant,
		language: string
	): Promise<ProductVariantWithRelations> {
		// Load translations
		const translations = await db
			.select()
			.from(productVariantTranslations)
			.where(eq(productVariantTranslations.variantId, variant.id));

		// Load facet values
		const facetValueIds = await db
			.select({ facetValueId: variantFacetValues.facetValueId })
			.from(variantFacetValues)
			.where(eq(variantFacetValues.variantId, variant.id));

		const facetValuesData = [];
		for (const fv of facetValueIds) {
			const value = await db
				.select()
				.from(facetValues)
				.where(eq(facetValues.id, fv.facetValueId))
				.limit(1);

			if (value[0]) {
				const valueTranslations = await db
					.select()
					.from(facetValueTranslations)
					.where(eq(facetValueTranslations.facetValueId, value[0].id));

				facetValuesData.push({
					...value[0],
					translations: valueTranslations
				});
			}
		}

		return {
			...variant,
			translations,
			facetValues: facetValuesData,
			assets: [],
			featuredAsset: null
		};
	}

	private async getProductIdsByFacets(facetFilters: Record<string, string[]>): Promise<number[]> {
		// Get all facet value IDs for the given filters
		const allValueIds: number[] = [];

		for (const [facetCode, valueCodes] of Object.entries(facetFilters)) {
			if (valueCodes.length === 0) continue;

			const facet = await db.select().from(facets).where(eq(facets.code, facetCode)).limit(1);

			if (!facet[0]) continue;

			const values = await db
				.select()
				.from(facetValues)
				.where(
					and(eq(facetValues.facetId, facet[0].id), inArray(facetValues.code, valueCodes))
				);

			allValueIds.push(...values.map((v) => v.id));
		}

		if (allValueIds.length === 0) return [];

		// Find products that have ALL the specified facet values
		const productMatches = await db
			.select({ productId: productFacetValues.productId })
			.from(productFacetValues)
			.where(inArray(productFacetValues.facetValueId, allValueIds))
			.groupBy(productFacetValues.productId);

		return productMatches.map((p) => p.productId);
	}

	private async searchProductIds(search: string, language: string): Promise<number[]> {
		const searchPattern = `%${search}%`;

		const matches = await db
			.select({ productId: productTranslations.productId })
			.from(productTranslations)
			.where(
				and(
					eq(productTranslations.languageCode, language),
					sql`(${productTranslations.name} ILIKE ${searchPattern} OR ${productTranslations.description} ILIKE ${searchPattern})`
				)
			);

		return matches.map((m) => m.productId);
	}

	/**
	 * Get lightweight product catalog for client-side search
	 * Returns only the fields needed for search: id, name, slug, price, image
	 */
	async getSearchCatalog(language = this.defaultLanguage) {
		const rows = await db
			.select({
				id: products.id,
				name: productTranslations.name,
				slug: productTranslations.slug,
				price: productVariants.price,
				image: assets.source
			})
			.from(products)
			.innerJoin(
				productTranslations,
				and(
					eq(productTranslations.productId, products.id),
					eq(productTranslations.languageCode, language)
				)
			)
			.leftJoin(
				productVariants,
				and(eq(productVariants.productId, products.id), isNull(productVariants.deletedAt))
			)
			.leftJoin(assets, eq(assets.id, products.featuredAssetId))
			.where(and(eq(products.visibility, "public"), isNull(products.deletedAt)))
			.orderBy(asc(productTranslations.name));

		// Deduplicate by product id (multiple variants produce multiple rows), keep lowest price
		const seen = new Map<
			number,
			{ id: number; name: string; slug: string; price: number; image: string | null }
		>();
		for (const row of rows) {
			const existing = seen.get(row.id);
			if (!existing || (row.price !== null && row.price < existing.price)) {
				seen.set(row.id, {
					id: row.id,
					name: row.name,
					slug: row.slug,
					price: row.price ?? 0,
					image: row.image
				});
			}
		}

		return [...seen.values()];
	}
}

// Export singleton instance
export const productService = new ProductService();
