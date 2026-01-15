import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import { sveltekit } from "@sveltejs/kit/vite";
import { paraglide } from "@inlang/paraglide-sveltekit/vite";

export default defineConfig({
	plugins: [
		tailwindcss(),
		paraglide({
			project: "./project.inlang",
			outdir: "./src/lib/paraglide"
		}),
		sveltekit()
	],

	test: {
		expect: { requireAssertions: true },

		projects: [
			{
				extends: "./vite.config.ts",

				test: {
					name: "server",
					environment: "node",
					include: ["src/**/*.{test,spec}.{js,ts}"],
					exclude: ["src/**/*.svelte.{test,spec}.{js,ts}"]
				}
			}
		]
	}
});
