import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { commerceSync } from './src/lib/commerce/sync/vite-plugin.js';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		commerceSync({
			config: './commerce.config.ts',
			schema: './src/lib/server/db/schema.ts'
		})
	],

	test: {
		expect: { requireAssertions: true },

		projects: [
			{
				extends: './vite.config.ts',

				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
