import { productService } from "$lib/server/services/products.js";
import { wishlistService } from "$lib/server/services/wishlist.js";
import { reviewService } from "$lib/server/services/reviews.js";
import { error, fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
	const product = await productService.getBySlug(params.slug, "en");

	if (!product || !product.enabled) {
		throw error(404, "Product not found");
	}

	const [isWishlisted, rating, reviewsResult, customerReview] = await Promise.all([
		wishlistService.hasItem({
			productId: product.id,
			customerId: locals.customer?.id,
			guestToken: locals.wishlistToken
		}),
		reviewService.getProductRating(product.id),
		reviewService.getProductReviews(product.id, { limit: 10 }),
		locals.customer
			? reviewService.getCustomerReviewForProduct(locals.customer.id, product.id)
			: null
	]);

	return {
		product,
		isWishlisted,
		rating,
		reviews: reviewsResult.items,
		reviewsPagination: reviewsResult.pagination,
		customerReview,
		customerId: locals.customer?.id ?? null
	};
};

export const actions: Actions = {
	submitReview: async ({ request, locals, params }) => {
		if (!locals.customer) {
			return fail(401, { reviewError: "You must be logged in to submit a review" });
		}

		const product = await productService.getBySlug(params.slug, "en");
		if (!product) {
			return fail(404, { reviewError: "Product not found" });
		}

		const data = await request.formData();
		const nickname = (data.get("nickname") as string)?.trim();
		const rating = Number(data.get("rating"));
		const comment = data.get("comment") as string;

		if (!nickname) {
			return fail(400, { reviewError: "Please enter a nickname" });
		}

		if (!rating || rating < 1 || rating > 5) {
			return fail(400, { reviewError: "Please select a rating between 1 and 5" });
		}

		try {
			await reviewService.create({
				productId: product.id,
				customerId: locals.customer.id,
				nickname,
				rating,
				comment: comment || undefined
			});
			return { reviewSuccess: true };
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to submit review";
			return fail(400, { reviewError: message });
		}
	}
};
