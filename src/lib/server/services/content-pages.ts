/**
 * Content Page Service
 * Simple CMS pages (About, FAQ, Terms, etc.)
 */
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { contentPages } from "../db/schema.js";
import type { ContentPage } from "$lib/types.js";

export class ContentPageService {
	async list(): Promise<ContentPage[]> {
		return db.query.contentPages.findMany({
			orderBy: [desc(contentPages.createdAt)]
		});
	}

	async getById(id: number): Promise<ContentPage | null> {
		const page = await db.query.contentPages.findFirst({
			where: eq(contentPages.id, id)
		});
		return page ?? null;
	}

	async getPublishedById(id: number): Promise<ContentPage | null> {
		const page = await db.query.contentPages.findFirst({
			where: and(eq(contentPages.id, id), eq(contentPages.published, true))
		});
		return page ?? null;
	}

	async create(input: {
		title: string;
		slug: string;
		body?: string;
		published?: boolean;
	}): Promise<ContentPage> {
		const [page] = await db
			.insert(contentPages)
			.values({
				title: input.title,
				slug: input.slug,
				body: input.body ?? null,
				published: input.published ?? false
			})
			.returning();

		return page;
	}

	async update(
		id: number,
		input: {
			title?: string;
			slug?: string;
			body?: string;
			published?: boolean;
		}
	): Promise<ContentPage | null> {
		const existing = await this.getById(id);
		if (!existing) return null;

		const updateData: Record<string, unknown> = {};
		if (input.published !== undefined) updateData.published = input.published;
		if (input.title !== undefined) updateData.title = input.title;
		if (input.slug !== undefined) updateData.slug = input.slug;
		if (input.body !== undefined) updateData.body = input.body;

		if (Object.keys(updateData).length > 0) {
			await db.update(contentPages).set(updateData).where(eq(contentPages.id, id));
		}

		return this.getById(id);
	}

	async delete(id: number): Promise<void> {
		await db.delete(contentPages).where(eq(contentPages.id, id));
	}
}

export const contentPageService = new ContentPageService();
