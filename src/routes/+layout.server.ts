import { buildClerkProps } from "svelte-clerk/server";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = ({ locals }) => {
	return {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		...buildClerkProps(locals.auth() as any)
	};
};
