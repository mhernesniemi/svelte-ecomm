import type { PageServerLoad } from "./$types";
import { categoryService } from "$lib/server/services/categories.js";

export const load: PageServerLoad = async ({ locals }) => {
	const tree = await categoryService.getTree(locals.language);

	return { tree };
};
