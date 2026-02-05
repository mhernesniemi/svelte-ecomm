import { orderService } from "$lib/server/services/orders.js";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url }) => {
	const state = url.searchParams.get("state") as string | undefined;

	const orders = await orderService.list(state as any, 20, 0);

	return {
		orders,
		currentState: state
	};
};
