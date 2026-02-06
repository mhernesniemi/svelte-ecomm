import type { PageServerLoad, Actions } from "./$types";
import { promotionService } from "$lib/server/services/promotions.js";
import { productService } from "$lib/server/services/products.js";
import { collectionService } from "$lib/server/services/collections.js";
import { fail, redirect, isRedirect } from "@sveltejs/kit";

export const load: PageServerLoad = async () => {
	const { items: products } = await productService.list({
		language: "fi",
		visibility: ["public", "private", "draft"],
		limit: 100
	});

	const collections = await collectionService.list({ language: "fi" });

	return {
		products: products.map((p) => ({
			id: p.id,
			name: p.translations[0]?.name ?? `Product #${p.id}`
		})),
		collections: collections.map((c) => ({
			id: c.id,
			name: c.translations[0]?.name ?? `Collection #${c.id}`
		}))
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();

		const code = data.get("code") as string;
		const promotionType = data.get("promotionType") as "order" | "product" | "free_shipping";
		const discountType = data.get("discountType") as "percentage" | "fixed_amount";
		const discountValueRaw = Number(data.get("discountValue"));
		const appliesTo = data.get("appliesTo") as
			| "all"
			| "specific_products"
			| "specific_collections";
		const minOrderAmountRaw = data.get("minOrderAmount")
			? Number(data.get("minOrderAmount"))
			: undefined;
		const usageLimit = data.get("usageLimit") ? Number(data.get("usageLimit")) : undefined;
		const usageLimitPerCustomer = data.get("usageLimitPerCustomer")
			? Number(data.get("usageLimitPerCustomer"))
			: undefined;
		const combinesWithOtherPromotions = data.get("combinesWithOtherPromotions") === "on";
		const startsAt = data.get("startsAt")
			? new Date(data.get("startsAt") as string)
			: undefined;
		const endsAt = data.get("endsAt") ? new Date(data.get("endsAt") as string) : undefined;

		// Parse product/collection IDs from JSON hidden field
		const productIds = data.get("productIds")
			? JSON.parse(data.get("productIds") as string)
			: [];
		const collectionIds = data.get("collectionIds")
			? JSON.parse(data.get("collectionIds") as string)
			: [];

		if (!code || !promotionType) {
			return fail(400, { error: "Code and type are required" });
		}

		if (promotionType !== "free_shipping" && (isNaN(discountValueRaw) || !discountType)) {
			return fail(400, { error: "Discount type and value are required" });
		}

		// Convert to cents for fixed_amount
		const discountValue =
			promotionType === "free_shipping"
				? 0
				: discountType === "fixed_amount"
					? discountValueRaw * 100
					: discountValueRaw;

		const minOrderAmount = minOrderAmountRaw ? minOrderAmountRaw * 100 : undefined;

		try {
			const promotion = await promotionService.create({
				code,
				promotionType,
				discountType: promotionType === "free_shipping" ? "fixed_amount" : discountType,
				discountValue,
				appliesTo: promotionType === "product" ? appliesTo : "all",
				minOrderAmount,
				usageLimit,
				usageLimitPerCustomer,
				combinesWithOtherPromotions,
				startsAt,
				endsAt,
				productIds: appliesTo === "specific_products" ? productIds : [],
				collectionIds: appliesTo === "specific_collections" ? collectionIds : []
			});

			throw redirect(303, `/admin/promotions/${promotion.id}`);
		} catch (err) {
			if (isRedirect(err)) throw err;
			return fail(500, { error: "Failed to create promotion" });
		}
	}
};
