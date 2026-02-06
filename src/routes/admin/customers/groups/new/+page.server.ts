import { customerGroupService } from "$lib/server/services/customerGroups.js";
import { fail, redirect, isRedirect } from "@sveltejs/kit";
import type { Actions } from "./$types";

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get("name") as string;

		if (!name) {
			return fail(400, {
				error: "Name is required",
				values: { name }
			});
		}

		try {
			const group = await customerGroupService.create({ name });
			throw redirect(303, `/admin/customers/groups/${group.id}`);
		} catch (error) {
			if (isRedirect(error)) throw error;
			return fail(500, {
				error: "Failed to create group",
				values: { name }
			});
		}
	}
};
