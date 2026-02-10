import type { PageServerLoad, Actions } from "./$types";
import { reviewService } from "$lib/server/services/reviews.js";
import { fail } from "@sveltejs/kit";
import type { ReviewStatus } from "$lib/types.js";

export const load: PageServerLoad = async ({ url }) => {
	const status = url.searchParams.get("status") as ReviewStatus | null;

	const result = await reviewService.list({
		status: status ?? undefined,
		limit: 1000,
		offset: 0
	});

	return {
		reviews: result.items,
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
