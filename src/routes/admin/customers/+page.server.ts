import { customerService } from "$lib/server/services/customers.js";
import { customerGroupService } from "$lib/server/services/customerGroups.js";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async () => {
	const [customerResult, groups] = await Promise.all([
		customerService.list(1000, 0),
		customerGroupService.list()
	]);

	return {
		customers: customerResult.items,
		groups
	};
};

export const actions: Actions = {
	deleteSelected: async ({ request }) => {
		const data = await request.formData();
		const ids = data.getAll("ids").map(Number).filter(Boolean);

		if (ids.length === 0) {
			return fail(400, { error: "No customers selected" });
		}

		try {
			await Promise.all(ids.map((id) => customerService.delete(id)));
			return { success: true, message: "Customers deleted" };
		} catch {
			return fail(500, { error: "Failed to delete customers" });
		}
	},

	deleteSelectedGroups: async ({ request }) => {
		const data = await request.formData();
		const ids = data.getAll("ids").map(Number).filter(Boolean);

		if (ids.length === 0) {
			return fail(400, { error: "No groups selected" });
		}

		try {
			await Promise.all(ids.map((id) => customerGroupService.delete(id)));
			return { success: true, message: "Groups deleted" };
		} catch {
			return fail(500, { error: "Failed to delete groups" });
		}
	}
};
