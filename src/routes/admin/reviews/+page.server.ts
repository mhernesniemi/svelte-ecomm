import type { PageServerLoad, Actions } from "./$types";
import { reviewService } from "$lib/server/services/reviews.js";
import { fail } from "@sveltejs/kit";
import type { ReviewStatus } from "$lib/types.js";
import { resolveTranslation } from "$lib/server/i18n.js";

export const load: PageServerLoad = async ({ url, locals }) => {
	const status = url.searchParams.get("status") as ReviewStatus | null;

	const result = await reviewService.list({
		status: status ?? undefined,
		limit: 1000,
		offset: 0
	});

	// Resolve product names for display
	const reviews = result.items.map((review) => ({
		...review,
		product: {
			...review.product,
			name: resolveTranslation(review.product.translations, locals.language)?.name ?? "Unknown"
		}
	}));

	return {
		reviews,
		currentStatus: status
	};
};

export const actions: Actions = {
	bulkApprove: async ({ request }) => {
		const data = await request.formData();
		const ids = data.getAll("ids").map(Number).filter(Boolean);

		if (ids.length === 0) {
			return fail(400, { error: "No reviews selected" });
		}

		try {
			await Promise.all(ids.map((id) => reviewService.moderate(id, "approved")));
			return {
				success: true,
				message: `${ids.length} review${ids.length !== 1 ? "s" : ""} approved`
			};
		} catch {
			return fail(500, { error: "Failed to approve reviews" });
		}
	},

	bulkReject: async ({ request }) => {
		const data = await request.formData();
		const ids = data.getAll("ids").map(Number).filter(Boolean);

		if (ids.length === 0) {
			return fail(400, { error: "No reviews selected" });
		}

		try {
			await Promise.all(ids.map((id) => reviewService.moderate(id, "rejected")));
			return {
				success: true,
				message: `${ids.length} review${ids.length !== 1 ? "s" : ""} rejected`
			};
		} catch {
			return fail(500, { error: "Failed to reject reviews" });
		}
	},

	bulkDelete: async ({ request }) => {
		const data = await request.formData();
		const ids = data.getAll("ids").map(Number).filter(Boolean);

		if (ids.length === 0) {
			return fail(400, { error: "No reviews selected" });
		}

		try {
			await Promise.all(ids.map((id) => reviewService.delete(id)));
			return {
				success: true,
				message: `${ids.length} review${ids.length !== 1 ? "s" : ""} deleted`
			};
		} catch {
			return fail(500, { error: "Failed to delete reviews" });
		}
	}
};
