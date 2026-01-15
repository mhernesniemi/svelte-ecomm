import { wishlistService } from "$lib/server/services/wishlist.js";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals }) => {
	const wishlistCount = await wishlistService.getCount({
		customerId: locals.customer?.id,
		guestToken: locals.wishlistToken
	});

	return { wishlistCount };
};
