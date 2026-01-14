import { orderService } from "$lib/server/services/orders.js";
import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	const cart = await orderService.getActiveCart({
		customerId: locals.customer?.id,
		cartToken: locals.cartToken
	});

	return {
		cart
	};
};

export const actions: Actions = {
	updateQuantity: async ({ request, locals }) => {
		const formData = await request.formData();
		const lineId = parseInt(formData.get("lineId") as string);
		const quantity = parseInt(formData.get("quantity") as string);

		if (isNaN(lineId) || isNaN(quantity)) {
			return fail(400, { error: "Invalid input" });
		}

		// Get the active cart
		const cart = await orderService.getActiveCart({
			customerId: locals.customer?.id,
			cartToken: locals.cartToken
		});

		if (!cart) {
			return fail(400, { error: "No active cart" });
		}

		try {
			if (quantity <= 0) {
				await orderService.removeLine(cart.id, lineId);
			} else {
				await orderService.updateLineQuantity(cart.id, lineId, quantity);
			}
			return { success: true };
		} catch (error) {
			return fail(500, { error: "Failed to update cart" });
		}
	},

	removeLine: async ({ request, locals }) => {
		const formData = await request.formData();
		const lineId = parseInt(formData.get("lineId") as string);

		if (isNaN(lineId)) {
			return fail(400, { error: "Invalid input" });
		}

		const cart = await orderService.getActiveCart({
			customerId: locals.customer?.id,
			cartToken: locals.cartToken
		});

		if (!cart) {
			return fail(400, { error: "No active cart" });
		}

		try {
			await orderService.removeLine(cart.id, lineId);
			return { success: true };
		} catch (error) {
			return fail(500, { error: "Failed to remove item" });
		}
	},

	applyPromotion: async ({ request, locals }) => {
		const formData = await request.formData();
		const code = formData.get("code") as string;

		if (!code) {
			return fail(400, { error: "Promotion code is required" });
		}

		const cart = await orderService.getActiveCart({
			customerId: locals.customer?.id,
			cartToken: locals.cartToken
		});

		if (!cart) {
			return fail(400, { error: "No active cart" });
		}

		const result = await orderService.applyPromotion(cart.id, code);

		if (!result.success) {
			return fail(400, { error: result.message });
		}

		return { success: true, message: result.message };
	}
};
