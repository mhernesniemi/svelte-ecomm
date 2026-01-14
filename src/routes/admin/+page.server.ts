import { productService } from "$lib/server/services/products.js";
import { orderService } from "$lib/server/services/orders.js";
import { customerService } from "$lib/server/services/customers.js";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
	// Get counts for dashboard
	const [products, orders, customers] = await Promise.all([
		productService.list({ limit: 1 }),
		orderService.list(undefined, 1),
		customerService.list(1, 0)
	]);

	// Get recent orders
	const recentOrders = await orderService.list(undefined, 5);

	return {
		stats: {
			totalProducts: products.pagination.total,
			totalOrders: orders.length > 0 ? orders.length : 0, // Simplified for now
			totalCustomers: customers.pagination.total
		},
		recentOrders
	};
};
