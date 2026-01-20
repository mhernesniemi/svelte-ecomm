/**
 * Category Service
 * Handles hierarchical product categories for navigation and breadcrumbs
 */
import { eq, and, isNull, asc, inArray, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
	categories,
	categoryTranslations,
	productCategories,
	products,
	productTranslations
} from "../db/schema.js";

export type Category = typeof categories.$inferSelect;
export type CategoryTranslation = typeof categoryTranslations.$inferSelect;

export type CategoryWithTranslations = Category & {
	translations: CategoryTranslation[];
};

export type CategoryTreeNode = CategoryWithTranslations & {
	children: CategoryTreeNode[];
};

export type CategoryBreadcrumb = {
	id: number;
	slug: string;
	name: string;
};

export class CategoryService {
	private defaultLanguage = "en";

	/**
	 * Create a new category
	 */
	async create(input: {
		slug: string;
		parentId?: number | null;
		position?: number;
		translations: { languageCode: string; name: string }[];
	}): Promise<Category> {
		const [category] = await db
			.insert(categories)
			.values({
				slug: input.slug,
				parentId: input.parentId ?? null,
				position: input.position ?? 0
			})
			.returning();

		if (input.translations.length > 0) {
			await db.insert(categoryTranslations).values(
				input.translations.map((t) => ({
					categoryId: category.id,
					languageCode: t.languageCode,
					name: t.name
				}))
			);
		}

		return category;
	}

	/**
	 * Get category by ID with translations
	 */
	async getById(id: number): Promise<CategoryWithTranslations | null> {
		const category = await db.query.categories.findFirst({
			where: eq(categories.id, id),
			with: { translations: true }
		});

		return category ?? null;
	}

	/**
	 * Get category by slug with translations
	 */
	async getBySlug(slug: string): Promise<CategoryWithTranslations | null> {
		const category = await db.query.categories.findFirst({
			where: eq(categories.slug, slug),
			with: { translations: true }
		});

		return category ?? null;
	}

	/**
	 * Get all root categories (no parent)
	 */
	async getRoots(): Promise<CategoryWithTranslations[]> {
		return db.query.categories.findMany({
			where: isNull(categories.parentId),
			with: { translations: true },
			orderBy: [asc(categories.position), asc(categories.id)]
		});
	}

	/**
	 * Get children of a category
	 */
	async getChildren(parentId: number): Promise<CategoryWithTranslations[]> {
		return db.query.categories.findMany({
			where: eq(categories.parentId, parentId),
			with: { translations: true },
			orderBy: [asc(categories.position), asc(categories.id)]
		});
	}

	/**
	 * Build full category tree
	 */
	async getTree(): Promise<CategoryTreeNode[]> {
		const allCategories = await db.query.categories.findMany({
			with: { translations: true },
			orderBy: [asc(categories.position), asc(categories.id)]
		});

		return this.buildTree(allCategories, null);
	}

	private buildTree(
		allCategories: CategoryWithTranslations[],
		parentId: number | null
	): CategoryTreeNode[] {
		return allCategories
			.filter((c) => c.parentId === parentId)
			.map((c) => ({
				...c,
				children: this.buildTree(allCategories, c.id)
			}));
	}

	/**
	 * Get breadcrumb path from root to category
	 */
	async getBreadcrumbs(categoryId: number, language?: string): Promise<CategoryBreadcrumb[]> {
		const lang = language ?? this.defaultLanguage;

		// Use recursive CTE to get all ancestors
		const result = await db.execute(sql`
			WITH RECURSIVE ancestors AS (
				SELECT id, parent_id, slug, 0 as depth
				FROM categories
				WHERE id = ${categoryId}
				UNION ALL
				SELECT c.id, c.parent_id, c.slug, a.depth + 1
				FROM categories c
				JOIN ancestors a ON c.id = a.parent_id
			)
			SELECT a.id, a.slug, ct.name
			FROM ancestors a
			LEFT JOIN category_translations ct ON ct.category_id = a.id AND ct.language_code = ${lang}
			ORDER BY a.depth DESC
		`);

		return (result as unknown as { id: number; slug: string; name: string }[]).map((row) => ({
			id: row.id,
			slug: row.slug,
			name: row.name ?? row.slug
		}));
	}

	/**
	 * Get all descendant category IDs (for filtering products)
	 */
	async getDescendantIds(categoryId: number): Promise<number[]> {
		const result = await db.execute(sql`
			WITH RECURSIVE descendants AS (
				SELECT id FROM categories WHERE id = ${categoryId}
				UNION ALL
				SELECT c.id FROM categories c
				JOIN descendants d ON c.parent_id = d.id
			)
			SELECT id FROM descendants
		`);

		return (result as unknown as { id: number }[]).map((row) => row.id);
	}

	/**
	 * Update a category
	 */
	async update(
		id: number,
		input: {
			slug?: string;
			parentId?: number | null;
			position?: number;
			translations?: { languageCode: string; name: string }[];
		}
	): Promise<Category | null> {
		const updateData: Partial<Category> = {};
		if (input.slug !== undefined) updateData.slug = input.slug;
		if (input.parentId !== undefined) updateData.parentId = input.parentId;
		if (input.position !== undefined) updateData.position = input.position;

		if (Object.keys(updateData).length > 0) {
			await db.update(categories).set(updateData).where(eq(categories.id, id));
		}

		if (input.translations) {
			// Delete existing and insert new
			await db.delete(categoryTranslations).where(eq(categoryTranslations.categoryId, id));
			if (input.translations.length > 0) {
				await db.insert(categoryTranslations).values(
					input.translations.map((t) => ({
						categoryId: id,
						languageCode: t.languageCode,
						name: t.name
					}))
				);
			}
		}

		return this.getById(id);
	}

	/**
	 * Delete a category (children become orphans or get deleted based on DB constraint)
	 */
	async delete(id: number): Promise<void> {
		await db.delete(categories).where(eq(categories.id, id));
	}

	/**
	 * Assign product to category
	 */
	async addProduct(categoryId: number, productId: number): Promise<void> {
		await db.insert(productCategories).values({ categoryId, productId }).onConflictDoNothing();
	}

	/**
	 * Remove product from category
	 */
	async removeProduct(categoryId: number, productId: number): Promise<void> {
		await db
			.delete(productCategories)
			.where(
				and(
					eq(productCategories.categoryId, categoryId),
					eq(productCategories.productId, productId)
				)
			);
	}

	/**
	 * Get all categories for a product
	 */
	async getProductCategories(productId: number): Promise<CategoryWithTranslations[]> {
		const result = await db.query.productCategories.findMany({
			where: eq(productCategories.productId, productId),
			with: {
				category: {
					with: { translations: true }
				}
			}
		});

		return result.map((pc) => pc.category);
	}

	/**
	 * Set categories for a product (replaces existing)
	 */
	async setProductCategories(productId: number, categoryIds: number[]): Promise<void> {
		await db.delete(productCategories).where(eq(productCategories.productId, productId));

		if (categoryIds.length > 0) {
			await db
				.insert(productCategories)
				.values(categoryIds.map((categoryId) => ({ productId, categoryId })));
		}
	}

	/**
	 * Get products in category (including subcategories)
	 */
	async getProducts(
		categoryId: number,
		options: { limit?: number; offset?: number } = {}
	): Promise<{ products: number[]; total: number }> {
		const descendantIds = await this.getDescendantIds(categoryId);

		const [countResult] = await db
			.select({ count: sql<number>`count(distinct ${productCategories.productId})` })
			.from(productCategories)
			.where(inArray(productCategories.categoryId, descendantIds));

		const total = Number(countResult?.count ?? 0);

		const result = await db
			.selectDistinct({ productId: productCategories.productId })
			.from(productCategories)
			.where(inArray(productCategories.categoryId, descendantIds))
			.limit(options.limit ?? 20)
			.offset(options.offset ?? 0);

		return {
			products: result.map((r) => r.productId),
			total
		};
	}

	/**
	 * List all categories flat (for admin)
	 */
	async list(): Promise<CategoryWithTranslations[]> {
		return db.query.categories.findMany({
			with: { translations: true },
			orderBy: [asc(categories.position), asc(categories.id)]
		});
	}
}

export const categoryService = new CategoryService();
