/**
 * Content Page Service
 * Simple CMS pages (About, FAQ, Terms, etc.)
 */
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { contentPages, contentPageTranslations } from "../db/schema.js";
import type { ContentPageWithTranslations, ResolvedContentPage } from "$lib/types.js";
import { DEFAULT_LANGUAGE } from "$lib/utils.js";
import { resolveContentPage } from "$lib/server/i18n.js";

export class ContentPageService {
	async list(language?: string): Promise<ResolvedContentPage[]> {
		const lang = language ?? DEFAULT_LANGUAGE;
		const pages = await db.query.contentPages.findMany({
			with: { translations: true },
			orderBy: [desc(contentPages.createdAt)]
		});
		return pages.map((p) => resolveContentPage(p, lang));
	}

	async getById(id: number, language?: string): Promise<ResolvedContentPage | null> {
		const lang = language ?? DEFAULT_LANGUAGE;
		const page = await db.query.contentPages.findFirst({
			where: eq(contentPages.id, id),
			with: { translations: true }
		});
		if (!page) return null;
		return resolveContentPage(page, lang);
	}

	async getPublishedById(id: number, language?: string): Promise<ResolvedContentPage | null> {
		const lang = language ?? DEFAULT_LANGUAGE;
		const page = await db.query.contentPages.findFirst({
			where: and(eq(contentPages.id, id), eq(contentPages.published, true)),
			with: { translations: true }
		});
		if (!page) return null;
		return resolveContentPage(page, lang);
	}

	async create(input: {
		published?: boolean;
		translations: { languageCode: string; title: string; slug: string; body?: string }[];
	}): Promise<ResolvedContentPage> {
		const [page] = await db
			.insert(contentPages)
			.values({ published: input.published ?? false })
			.returning();

		if (input.translations.length > 0) {
			await db.insert(contentPageTranslations).values(
				input.translations.map((t) => ({
					contentPageId: page.id,
					languageCode: t.languageCode,
					title: t.title,
					slug: t.slug,
					body: t.body ?? null
				}))
			);
		}

		return (await this.getById(page.id))!;
	}

	async update(
		id: number,
		input: {
			published?: boolean;
			translations?: { languageCode: string; title: string; slug: string; body?: string }[];
		}
	): Promise<ResolvedContentPage | null> {
		const existing = await this.getById(id);
		if (!existing) return null;

		if (input.published !== undefined) {
			await db
				.update(contentPages)
				.set({ published: input.published })
				.where(eq(contentPages.id, id));
		}

		if (input.translations) {
			for (const t of input.translations) {
				const existingTrans = existing.translations.find(
					(et) => et.languageCode === t.languageCode
				);

				if (existingTrans) {
					await db
						.update(contentPageTranslations)
						.set({ title: t.title, slug: t.slug, body: t.body ?? null })
						.where(eq(contentPageTranslations.id, existingTrans.id));
				} else {
					await db.insert(contentPageTranslations).values({
						contentPageId: id,
						languageCode: t.languageCode,
						title: t.title,
						slug: t.slug,
						body: t.body ?? null
					});
				}
			}
		}

		return (await this.getById(id))!;
	}

	async delete(id: number): Promise<void> {
		await db.delete(contentPages).where(eq(contentPages.id, id));
	}
}

export const contentPageService = new ContentPageService();
