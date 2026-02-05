import { customerService } from "$lib/server/services/customers.js";
import { customerGroupService } from "$lib/server/services/customerGroups.js";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async () => {
	const [customerResult, groups] = await Promise.all([
		customerService.list(1000, 0),
		customerGroupService.list()
	]);

	// For each group, get its customers
	const groupsWithCustomers = await Promise.all(
		groups.map(async (group) => {
			const customers = await customerGroupService.getCustomers(group.id);
			return {
				...group,
				customers
			};
		})
	);

	return {
		customers: customerResult.items,
		groups: groupsWithCustomers,
		allCustomers: customerResult.items
	};
};

export const actions: Actions = {
	createGroup: async ({ request }) => {
		const data = await request.formData();
		const name = data.get("name") as string;
		const description = data.get("description") as string;

		if (!name) {
			return fail(400, { error: "Name is required" });
		}

		try {
			await customerGroupService.create({ name, description: description || undefined });
			return { success: true, message: "Group created" };
		} catch (err) {
			return fail(500, { error: "Failed to create group" });
		}
	},

	deleteGroup: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get("id"));

		if (!id) {
			return fail(400, { error: "Group ID is required" });
		}

		try {
			await customerGroupService.delete(id);
			return { success: true, message: "Group deleted" };
		} catch (err) {
			return fail(500, { error: "Failed to delete group" });
		}
	},

	addCustomer: async ({ request }) => {
		const data = await request.formData();
		const groupId = Number(data.get("groupId"));
		const customerId = Number(data.get("customerId"));

		if (!groupId || !customerId) {
			return fail(400, { error: "Group ID and Customer ID are required" });
		}

		try {
			await customerGroupService.addCustomer(groupId, customerId);
			return { success: true, message: "Customer added to group" };
		} catch (err) {
			return fail(500, { error: "Failed to add customer to group" });
		}
	},

	removeCustomer: async ({ request }) => {
		const data = await request.formData();
		const groupId = Number(data.get("groupId"));
		const customerId = Number(data.get("customerId"));

		if (!groupId || !customerId) {
			return fail(400, { error: "Group ID and Customer ID are required" });
		}

		try {
			await customerGroupService.removeCustomer(groupId, customerId);
			return { success: true, message: "Customer removed from group" };
		} catch (err) {
			return fail(500, { error: "Failed to remove customer from group" });
		}
	},

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
	}
};
