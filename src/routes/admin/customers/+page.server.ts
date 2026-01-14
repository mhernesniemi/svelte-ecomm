import { customerService } from "$lib/server/services/customers.js";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url }) => {
	const page = Number(url.searchParams.get("page")) || 1;
	const limit = 20;
	const offset = (page - 1) * limit;

	const result = await customerService.list(limit, offset);

	return {
		customers: result.items,
		pagination: result.pagination,
		currentPage: page
	};
};
