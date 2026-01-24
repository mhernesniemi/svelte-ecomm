import { productService } from "$lib/server/services/products.js";
import { collectionService } from "$lib/server/services/collections.js";
import { categoryService } from "$lib/server/services/categories.js";
import type { RequestHandler } from "./$types";

const SITE_URL = "https://hoikka.dev"; // TODO: Move to env

export const GET: RequestHandler = async () => {
	const [products, collections, categories] = await Promise.all([
		productService.list({ language: "en", visibility: "public", limit: 1000 }),
		collectionService.list({ language: "en" }),
		categoryService.getTree()
	]);

	const urls: { loc: string; lastmod?: string; changefreq?: string; priority?: string }[] = [];

	// Static pages
	urls.push({ loc: "/", changefreq: "daily", priority: "1.0" });
	urls.push({ loc: "/products", changefreq: "daily", priority: "0.9" });
	urls.push({ loc: "/collections", changefreq: "weekly", priority: "0.8" });
	urls.push({ loc: "/category", changefreq: "weekly", priority: "0.8" });

	// Products
	for (const product of products.items) {
		const slug = product.translations.find((t) => t.languageCode === "en")?.slug;
		if (slug) {
			urls.push({
				loc: `/products/${product.id}/${slug}`,
				lastmod: new Date(product.updatedAt).toISOString().split("T")[0],
				changefreq: "weekly",
				priority: "0.7"
			});
		}
	}

	// Collections
	for (const collection of collections) {
		const slug = collection.translations.find((t) => t.languageCode === "en")?.slug;
		if (slug) {
			urls.push({
				loc: `/collections/${collection.id}/${slug}`,
				changefreq: "weekly",
				priority: "0.6"
			});
		}
	}

	// Categories (flatten tree)
	function addCategories(
		nodes: typeof categories,
		parentPath: string[] = []
	) {
		for (const node of nodes) {
			const path = [...parentPath, node.slug].join("/");
			urls.push({
				loc: `/category/${path}`,
				changefreq: "weekly",
				priority: "0.6"
			});
			if (node.children.length > 0) {
				addCategories(node.children, [...parentPath, node.slug]);
			}
		}
	}
	addCategories(categories);

	// Build XML
	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
	.map(
		(url) => `  <url>
    <loc>${SITE_URL}${url.loc}</loc>
${url.lastmod ? `    <lastmod>${url.lastmod}</lastmod>\n` : ""}${url.changefreq ? `    <changefreq>${url.changefreq}</changefreq>\n` : ""}${url.priority ? `    <priority>${url.priority}</priority>\n` : ""}  </url>`
	)
	.join("\n")}
</urlset>`;

	return new Response(xml, {
		headers: {
			"Content-Type": "application/xml",
			"Cache-Control": "public, max-age=3600"
		}
	});
};
