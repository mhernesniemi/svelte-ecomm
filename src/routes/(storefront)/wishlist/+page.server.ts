import { wishlistService } from "$lib/server/services/wishlist.js";
import { productService } from "$lib/server/services/products.js";
import { orderService } from "$lib/server/services/orders.js";
import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	// Get wishlist items (just IDs)
	const items = await wishlistService.getItems({
		customerId: locals.customer?.id,
		guestToken: locals.wishlistToken
	});

	// Load products using ProductService (view composition at route level)
	const products = await Promise.all(
		items.map(async (item) => {
			const product = await productService.getById(item.productId, "en");
			return product ? { item, product } : null;
		})
	);

	// Filter out deleted products
	const wishlistProducts = products.filter((p) => p !== null);

	return { wishlistProducts };
};

export const actions: Actions = {
	remove: async ({ request, locals }) => {
		const formData = await request.formData();
		const productId = parseInt(formData.get("productId") as string);

		if (isNaN(productId)) {
			return fail(400, { error: "Invalid product ID" });
		}

		await wishlistService.removeItem({
			productId,
			customerId: locals.customer?.id,
			guestToken: locals.wishlistToken
		});

		return { success: true };
	},

	addToCart: async ({ request, locals }) => {
		const formData = await request.formData();
		const variantId = parseInt(formData.get("variantId") as string);

		if (isNaN(variantId)) {
			return fail(400, { error: "Invalid variant ID" });
		}

		const { order, cartToken, isNew } = await orderService.getOrCreateActiveCart({
			customerId: locals.customer?.id,
			cartToken: locals.cartToken
		});

		if (isNew && cartToken && !locals.customer) {
			locals.newCartToken = cartToken;
		}

		await orderService.addLine(order.id, { variantId, quantity: 1 });

		return { success: true, addedToCart: true };
	},

	clear: async ({ locals }) => {
		await wishlistService.clear({
			customerId: locals.customer?.id,
			guestToken: locals.wishlistToken
		});

		return { success: true };
	}
};
