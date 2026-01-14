import { productService } from "$lib/server/services/products.js";
import { orderService } from "$lib/server/services/orders.js";
import { error, fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
	const product = await productService.getBySlug(params.slug, "en");

	if (!product || !product.enabled) {
		throw error(404, "Product not found");
	}

	return { product };
};

export const actions: Actions = {
	addToCart: async ({ request, locals }) => {
		const formData = await request.formData();
		const variantId = parseInt(formData.get("variantId") as string);
		const quantity = parseInt(formData.get("quantity") as string) || 1;

		if (isNaN(variantId)) {
			return fail(400, { error: "Invalid variant" });
		}

		try {
			// Get or create active cart
			const { order, cartToken, isNew } = await orderService.getOrCreateActiveCart({
				customerId: locals.customer?.id,
				cartToken: locals.cartToken
			});

			// If a new guest cart was created, set the cookie token
			if (isNew && cartToken && !locals.customer) {
				locals.newCartToken = cartToken;
			}

			// Add item to cart
			await orderService.addLine(order.id, { variantId, quantity });

			return { success: true, message: "Added to cart" };
		} catch (err) {
			console.error("Add to cart error:", err);
			return fail(500, { error: "Failed to add item to cart" });
		}
	}
};
