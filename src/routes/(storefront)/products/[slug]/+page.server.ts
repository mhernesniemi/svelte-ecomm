import { productService } from "$lib/server/services/products.js";
import { wishlistService } from "$lib/server/services/wishlist.js";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
	const product = await productService.getBySlug(params.slug, "en");

	if (!product || !product.enabled) {
		throw error(404, "Product not found");
	}

	const isWishlisted = await wishlistService.hasItem({
		productId: product.id,
		customerId: locals.customer?.id,
		guestToken: locals.wishlistToken
	});

	return { product, isWishlisted };
};
