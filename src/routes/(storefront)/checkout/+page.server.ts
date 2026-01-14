/**
 * Checkout page server actions
 */
import { fail, redirect } from "@sveltejs/kit";
import { orderService, shippingService, paymentService } from "$lib/server/services/index.js";
import type { PageServerLoad, Actions } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
	// Use locals.cartToken and locals.customer?.id (set by hooks.server.ts)
	const cart = await orderService.getActiveCart({
		customerId: locals.customer?.id,
		cartToken: locals.cartToken
	});
	if (!cart) {
		return {
			cart: null,
			shippingRates: []
		};
	}

	// Get available shipping rates
	const shippingRates = await shippingService.getAvailableRates(cart);

	// Get available payment methods
	const paymentMethods = await paymentService.getActiveMethods();

	// Check if shipping method is already set
	const orderShipping = await shippingService.getOrderShipping(cart.id);

	// Check if payment is already created
	const orderPayments = await paymentService.getByOrderId(cart.id);
	const existingPayment = orderPayments[0] || null;
	let paymentInfo = null;
	if (existingPayment && existingPayment.metadata) {
		paymentInfo = {
			providerTransactionId: existingPayment.transactionId || "",
			clientSecret: (existingPayment.metadata as any)?.clientSecret,
			metadata: existingPayment.metadata as Record<string, unknown>
		};
	}

	return {
		cart,
		shippingRates,
		paymentMethods,
		orderShipping,
		existingPayment,
		paymentInfo
	};
};

export const actions: Actions = {
	setShippingAddress: async ({ request, locals }) => {
		const cart = await orderService.getActiveCart({
			customerId: locals.customer?.id,
			cartToken: locals.cartToken
		});
		if (!cart) {
			return fail(404, { error: "Cart not found" });
		}

		const data = await request.formData();
		const fullName = data.get("fullName")?.toString();
		const streetLine1 = data.get("streetLine1")?.toString();
		const streetLine2 = data.get("streetLine2")?.toString();
		const city = data.get("city")?.toString();
		const postalCode = data.get("postalCode")?.toString();
		const country = data.get("country")?.toString() || "FI";

		if (!fullName || !streetLine1 || !city || !postalCode) {
			return fail(400, { error: "Missing required address fields" });
		}

		await orderService.setShippingAddress(cart.id, {
			fullName,
			streetLine1,
			streetLine2: streetLine2 || undefined,
			city,
			postalCode,
			country
		});

		// Reload cart to get updated shipping rates
		const updatedCart = await orderService.getActiveCart({
			customerId: locals.customer?.id,
			cartToken: locals.cartToken
		});
		const shippingRates = updatedCart
			? await shippingService.getAvailableRates(updatedCart)
			: [];

		return {
			success: true,
			cart: updatedCart,
			shippingRates
		};
	},

	setShippingMethod: async ({ request, locals }) => {
		const cart = await orderService.getActiveCart({
			customerId: locals.customer?.id,
			cartToken: locals.cartToken
		});
		if (!cart) {
			return fail(404, { error: "Cart not found" });
		}

		const data = await request.formData();
		const methodId = data.get("methodId")?.toString();
		const rateId = data.get("rateId")?.toString();
		const price = data.get("price")?.toString();

		if (!methodId || !rateId || !price) {
			return fail(400, { error: "Missing shipping method information" });
		}

		await shippingService.setShippingMethod(
			cart.id,
			parseInt(methodId),
			rateId,
			parseInt(price)
		);

		// Recalculate totals with new shipping cost
		await orderService.getById(cart.id);

		const updatedCart = await orderService.getActiveCart({
			customerId: locals.customer?.id,
			cartToken: locals.cartToken
		});

		// Get the shipping method we just set
		const orderShipping = await shippingService.getOrderShipping(cart.id);

		// Get payment methods so they can be displayed
		const paymentMethods = await paymentService.getActiveMethods();

		return {
			success: true,
			cart: updatedCart,
			orderShipping,
			paymentMethods
		};
	},

	createPayment: async ({ request, locals }) => {
		const cart = await orderService.getActiveCart({
			customerId: locals.customer?.id,
			cartToken: locals.cartToken
		});
		if (!cart) {
			return fail(404, { error: "Cart not found" });
		}

		// Cart must have shipping address and method set
		if (!cart.shippingPostalCode) {
			return fail(400, { error: "Shipping address required" });
		}

		const data = await request.formData();
		const paymentMethodId = data.get("paymentMethodId")?.toString();

		if (!paymentMethodId) {
			return fail(400, { error: "Payment method required" });
		}

		try {
			// Check if payment already exists for this order
			const existingPayments = await paymentService.getByOrderId(cart.id);
			let payment;
			let paymentInfo;

			if (existingPayments.length > 0) {
				// Payment already exists, return it
				payment = existingPayments[0];
				const method = await paymentService.getMethodById(payment.paymentMethodId);
				if (method && payment.metadata) {
					paymentInfo = {
						providerTransactionId: payment.transactionId || "",
						clientSecret: (payment.metadata as any)?.clientSecret,
						metadata: payment.metadata as Record<string, unknown>
					};
				} else {
					paymentInfo = {
						providerTransactionId: payment.transactionId || "",
						metadata: payment.metadata as Record<string, unknown>
					};
				}
			} else {
				// Load full order relations for payment
				const order = await orderService.getById(cart.id);
				if (!order) {
					return fail(404, { error: "Order not found" });
				}

				// Create payment via provider
				const result = await paymentService.createPayment(order, parseInt(paymentMethodId));
				payment = result.payment;
				paymentInfo = result.paymentInfo;
			}

			return {
				success: true,
				payment,
				paymentInfo
			};
		} catch (error) {
			return fail(400, { error: (error as Error).message });
		}
	},

	completeOrder: async ({ request, cookies, locals }) => {
		const cart = await orderService.getActiveCart({
			customerId: locals.customer?.id,
			cartToken: locals.cartToken
		});
		if (!cart) {
			return fail(404, { error: "Cart not found" });
		}

		// Validate that all required information is present
		if (!cart.shippingPostalCode) {
			return fail(400, { error: "Shipping address required" });
		}

		// Check if shipping method is set
		const orderShipping = await shippingService.getOrderShipping(cart.id);
		if (!orderShipping) {
			return fail(400, { error: "Shipping method required" });
		}

		// Check if payment exists
		const orderPayments = await paymentService.getByOrderId(cart.id);
		if (orderPayments.length === 0) {
			return fail(400, { error: "Payment required" });
		}

		try {
			// Transition order to payment_pending (marks cart as inactive)
			await orderService.transitionState(cart.id, "payment_pending");

			// Confirm payment (for mock provider, this will mark it as completed)
			const payment = orderPayments[0];
			const paymentStatus = await paymentService.confirmPayment(payment.id);

			// If payment is completed, transition order to paid
			if (paymentStatus === "completed") {
				await orderService.transitionState(cart.id, "paid");

				// Create shipment
				const order = await orderService.getById(cart.id);
				if (order) {
					try {
						await shippingService.createShipment(order);
					} catch (e) {
						console.error("Error creating shipment:", e);
						// Don't fail the order if shipment creation fails
					}
				}
			}

			// Get final order with code for redirect
			const finalOrder = await orderService.getById(cart.id);
			if (!finalOrder) {
				return fail(500, { error: "Failed to retrieve order" });
			}

			// Clear cart token cookie
			cookies.delete("cartToken", { path: "/" });

			// Redirect to thank you page
			throw redirect(303, `/checkout/thank-you?order=${finalOrder.code}`);
		} catch (error) {
			if (error && typeof error === "object" && "status" in error && error.status === 303) {
				throw error; // Re-throw redirect
			}
			return fail(400, { error: (error as Error).message });
		}
	}
};
