/**
 * Admin Customer Detail Page Server
 */
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { customerService } from "$lib/server/services/customers";
import { orderService } from "$lib/server/services/orders";

export const load: PageServerLoad = async ({ params }) => {
	const customerId = Number(params.id);
	if (!customerId) {
		throw error(404, "Customer not found");
	}

	const customer = await customerService.getById(customerId);
	if (!customer) {
		throw error(404, "Customer not found");
	}

	// Get customer orders
	const orders = await orderService.listForCustomer(customerId, {
		limit: 10,
		offset: 0
	});

	return {
		customer,
		orders
	};
};
