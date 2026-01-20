/**
 * ImageKit upload authentication endpoint
 */
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { assetService } from "$lib/server/services/assets.js";

export const GET: RequestHandler = async () => {
	const auth = assetService.getUploadAuth();
	const config = assetService.getPublicConfig();

	return json({
		...auth,
		...config
	});
};
