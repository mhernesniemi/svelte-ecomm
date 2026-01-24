import { productService } from "$lib/server/services/products.js";
import { facetService } from "$lib/server/services/facets.js";
import { assetService } from "$lib/server/services/assets.js";
import { categoryService } from "$lib/server/services/categories.js";
import { taxService } from "$lib/server/services/tax.js";
import {
	revalidateProduct,
	revalidateListingPages
} from "$lib/server/services/revalidation.js";
import { error, fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

/** Get the English slug for a product, used for revalidation */
async function getProductSlug(productId: number): Promise<string | null> {
	const product = await productService.getById(productId, "en");
	return product?.translations.find((t) => t.languageCode === "en")?.slug ?? null;
}

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);

	if (isNaN(id)) {
		throw error(404, "Invalid product ID");
	}

	const product = await productService.getById(id, "en");

	if (!product) {
		throw error(404, "Product not found");
	}

	const [facets, categoryTree, productCategories, taxRates] = await Promise.all([
		facetService.list("en"),
		categoryService.getTree(),
		categoryService.getProductCategories(id),
		taxService.getAllTaxRates()
	]);

	return {
		product,
		facets,
		categoryTree,
		productCategories,
		taxRates
	};
};

export const actions: Actions = {
	update: async ({ params, request }) => {
		const id = Number(params.id);
		const formData = await request.formData();

		const nameEn = formData.get("name_en") as string;
		const nameFi = formData.get("name_fi") as string;
		const slugEn = formData.get("slug_en") as string;
		const slugFi = formData.get("slug_fi") as string;
		const descriptionEn = formData.get("description_en") as string;
		const descriptionFi = formData.get("description_fi") as string;
		const type = formData.get("type") as "physical" | "digital";
		const visibility = formData.get("visibility") as "public" | "private" | "hidden";
		const taxCode = formData.get("taxCode") as string;

		if (!nameEn || !slugEn) {
			return fail(400, { error: "English name and slug are required" });
		}

		try {
			await productService.update(id, {
				type,
				visibility,
				taxCode: taxCode || "standard",
				translations: [
					{
						languageCode: "en",
						name: nameEn,
						slug: slugEn,
						description: descriptionEn || undefined
					},
					{
						languageCode: "fi",
						name: nameFi || nameEn,
						slug: slugFi || slugEn,
						description: descriptionFi || undefined
					}
				]
			});

			// Revalidate product page and listing pages
			await Promise.all([revalidateProduct(id, slugEn), revalidateListingPages()]);

			return { success: true };
		} catch (e) {
			return fail(500, { error: "Failed to update product" });
		}
	},

	delete: async ({ params }) => {
		const id = Number(params.id);

		// Get slug before deletion for revalidation
		const slug = await getProductSlug(id);

		await productService.delete(id);

		// Revalidate listing pages and product page (product removed)
		await revalidateListingPages();
		if (slug) {
			await revalidateProduct(id, slug);
		}

		throw redirect(303, "/admin/products");
	},

	updateFacetValues: async ({ params, request }) => {
		const productId = Number(params.id);
		const formData = await request.formData();
		const facetValueIds = formData.getAll("facetValueIds").map(Number);

		try {
			// Get current facet values
			const product = await productService.getById(productId, "en");
			if (!product) {
				return fail(404, { error: "Product not found" });
			}

			const currentIds = product.facetValues.map((fv) => fv.id);

			// Remove unchecked values
			for (const id of currentIds) {
				if (!facetValueIds.includes(id)) {
					await productService.removeFacetValue(productId, id);
				}
			}

			// Add newly checked values
			for (const id of facetValueIds) {
				if (!currentIds.includes(id)) {
					await productService.addFacetValue(productId, id);
				}
			}

			// Revalidate product page and listing pages (facets affect filtering)
			const slug = await getProductSlug(productId);
			if (slug) {
				await Promise.all([revalidateProduct(productId, slug), revalidateListingPages()]);
			}

			return { facetSuccess: true };
		} catch (e) {
			return fail(500, { error: "Failed to update facet values" });
		}
	},

	updateVariantFacetValues: async ({ params, request }) => {
		const productId = Number(params.id);
		const formData = await request.formData();
		const variantId = Number(formData.get("variantId"));
		const facetValueIds = formData.getAll("facetValueIds").map(Number);

		if (isNaN(variantId)) {
			return fail(400, { error: "Invalid variant ID" });
		}

		try {
			// Get current facet values for this variant
			const variant = await productService.getVariantById(variantId, "en");
			if (!variant) {
				return fail(404, { error: "Variant not found" });
			}

			const currentIds = variant.facetValues.map((fv) => fv.id);

			// Remove unchecked values
			for (const id of currentIds) {
				if (!facetValueIds.includes(id)) {
					await productService.removeVariantFacetValue(variantId, id);
				}
			}

			// Add newly checked values
			for (const id of facetValueIds) {
				if (!currentIds.includes(id)) {
					await productService.addVariantFacetValue(variantId, id);
				}
			}

			// Revalidate product page (variant facets changed)
			const slug = await getProductSlug(productId);
			if (slug) {
				await revalidateProduct(productId, slug);
			}

			return { variantFacetSuccess: true };
		} catch (e) {
			return fail(500, { error: "Failed to update variant facet values" });
		}
	},

	addVariant: async ({ params, request }) => {
		const productId = Number(params.id);
		const formData = await request.formData();

		const sku = formData.get("sku") as string;
		const price = Number(formData.get("price")) * 100; // Convert to cents
		const stock = Number(formData.get("stock")) || 0;
		const nameEn = formData.get("variant_name_en") as string;

		if (!sku || isNaN(price)) {
			return fail(400, { variantError: "SKU and price are required" });
		}

		try {
			await productService.createVariant({
				productId,
				sku,
				price,
				stock,
				translations: nameEn ? [{ languageCode: "en", name: nameEn }] : []
			});

			// Revalidate product page and listing pages (new variant may affect price display)
			const slug = await getProductSlug(productId);
			if (slug) {
				await Promise.all([revalidateProduct(productId, slug), revalidateListingPages()]);
			}

			return { variantSuccess: true };
		} catch (e) {
			return fail(500, { variantError: "Failed to create variant" });
		}
	},

	updateVariant: async ({ params, request }) => {
		const formData = await request.formData();
		const productId = Number(params.id);

		const variantId = Number(formData.get("variantId"));
		const sku = formData.get("sku") as string;
		const price = Number(formData.get("price")) * 100; // Convert to cents
		const stock = Number(formData.get("stock")) || 0;
		const nameEn = formData.get("variant_name_en") as string;

		if (!variantId || !sku || isNaN(price)) {
			return fail(400, { variantError: "Variant ID, SKU and price are required" });
		}

		try {
			await productService.updateVariant(variantId, {
				sku,
				price,
				stock,
				translations: [{ languageCode: "en", name: nameEn || undefined }]
			});

			// Revalidate product page (stock changed)
			const slug = await getProductSlug(productId);
			if (slug) {
				await revalidateProduct(productId, slug);
			}

			return { variantSuccess: true };
		} catch (e) {
			return fail(500, { variantError: "Failed to update variant" });
		}
	},

	addImage: async ({ params, request }) => {
		const productId = Number(params.id);
		const formData = await request.formData();

		const url = formData.get("url") as string;
		const name = formData.get("name") as string;
		const fileId = formData.get("fileId") as string;
		const width = Number(formData.get("width")) || 0;
		const height = Number(formData.get("height")) || 0;
		const fileSize = Number(formData.get("fileSize")) || 0;

		if (!url || !name) {
			return fail(400, { imageError: "Image data is required" });
		}

		try {
			const asset = await assetService.create({ name, url, fileId, width, height, fileSize });
			await assetService.addToProduct(productId, asset.id);

			// Revalidate product page
			const slug = await getProductSlug(productId);
			if (slug) {
				await revalidateProduct(productId, slug);
			}

			return { imageSuccess: true };
		} catch (e) {
			return fail(500, { imageError: "Failed to add image" });
		}
	},

	removeImage: async ({ params, request }) => {
		const productId = Number(params.id);
		const formData = await request.formData();
		const assetId = Number(formData.get("assetId"));

		if (isNaN(assetId)) {
			return fail(400, { imageError: "Invalid asset ID" });
		}

		try {
			await assetService.removeFromProduct(productId, assetId);
			await assetService.delete(assetId);

			// Revalidate product page
			const slug = await getProductSlug(productId);
			if (slug) {
				await revalidateProduct(productId, slug);
			}

			return { imageRemoved: true };
		} catch (e) {
			return fail(500, { imageError: "Failed to remove image" });
		}
	},

	setFeaturedImage: async ({ params, request }) => {
		const productId = Number(params.id);
		const formData = await request.formData();
		const assetId = Number(formData.get("assetId"));

		if (isNaN(assetId)) {
			return fail(400, { imageError: "Invalid asset ID" });
		}

		try {
			await assetService.setFeaturedAsset(productId, assetId);

			// Revalidate product page and listing pages (featured image affects listings)
			const slug = await getProductSlug(productId);
			if (slug) {
				await Promise.all([revalidateProduct(productId, slug), revalidateListingPages()]);
			}

			return { featuredSet: true };
		} catch (e) {
			return fail(500, { imageError: "Failed to set featured image" });
		}
	},

	updateCategories: async ({ params, request }) => {
		const productId = Number(params.id);
		const formData = await request.formData();
		const categoryIds = formData
			.getAll("categoryIds")
			.map(Number)
			.filter((id) => !isNaN(id));

		try {
			await categoryService.setProductCategories(productId, categoryIds);

			// Revalidate product page and listing pages (category pages affected)
			const slug = await getProductSlug(productId);
			if (slug) {
				await Promise.all([revalidateProduct(productId, slug), revalidateListingPages()]);
			}

			return { categorySuccess: true };
		} catch (e) {
			return fail(500, { categoryError: "Failed to update categories" });
		}
	}
};
