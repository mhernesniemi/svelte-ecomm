import type { PageServerLoad, Actions } from "./$types";
import { reviewService } from "$lib/server/services/reviews.js";
import { fail } from "@sveltejs/kit";
import type { ReviewStatus } from "$lib/types.js";

export const load: PageServerLoad = async ({ url }) => {
	const page = Number(url.searchParams.get("page")) || 1;
	const status = url.searchParams.get("status") as ReviewStatus | null;
	const limit = 20;
	const offset = (page - 1) * limit;

	const result = await reviewService.list({
		status: status ?? undefined,
		limit,
		offset
	});

	return {
		reviews: result.items,
		pagination: result.pagination,
		currentPage: page,
		currentStatus: status
	};
};

export const actions: Actions = {
	approve: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get("id"));

		if (!id) {
			return fail(400, { error: "Review ID is required" });
		}

		try {
			await reviewService.moderate(id, "approved");
			return { success: true };
		} catch {
			return fail(500, { error: "Failed to approve review" });
		}
	},

	reject: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get("id"));

		if (!id) {
			return fail(400, { error: "Review ID is required" });
		}

		try {
			await reviewService.moderate(id, "rejected");
			return { success: true };
		} catch {
			return fail(500, { error: "Failed to reject review" });
		}
	},

	delete: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get("id"));

		if (!id) {
			return fail(400, { error: "Review ID is required" });
		}

		try {
			await reviewService.delete(id);
			return { success: true };
		} catch {
			return fail(500, { error: "Failed to delete review" });
		}
	}
};
