/**
 * List images from ImageKit products folder
 */
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { assetService } from "$lib/server/services/assets.js";

export const GET: RequestHandler = async ({ url }) => {
	const folder = url.searchParams.get("folder") || "/products";

	try {
		const files = await assetService.listFromImageKit(folder);
		return json(files);
	} catch (error) {
		return json({ error: "Failed to list files" }, { status: 500 });
	}
};
