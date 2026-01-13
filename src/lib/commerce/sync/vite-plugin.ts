/**
 * Vite plugin for syncing commerce.config.ts with Drizzle schema
 * Watches for config changes and validates/regenerates schema as needed
 */
import type { Plugin, ViteDevServer } from 'vite';
import { existsSync, readFileSync, writeFileSync, watch } from 'fs';
import { resolve, dirname } from 'path';

export interface CommerceSyncOptions {
	/** Path to commerce.config.ts (relative to project root) */
	config?: string;
	/** Path to Drizzle schema file (relative to project root) */
	schema?: string;
	/** Whether to auto-regenerate schema on config change */
	autoSync?: boolean;
}

const defaultOptions: Required<CommerceSyncOptions> = {
	config: './commerce.config.ts',
	schema: './src/lib/server/db/schema.ts',
	autoSync: true
};

/**
 * Extract field definitions from commerce.config.ts
 * This is a simple parser - for a production version, use AST parsing
 */
function parseConfigFields(configPath: string): Map<string, Set<string>> {
	const fields = new Map<string, Set<string>>();

	if (!existsSync(configPath)) {
		return fields;
	}

	const content = readFileSync(configPath, 'utf-8');

	// Extract product fields
	const productFieldsMatch = content.match(/product:\s*\{[\s\S]*?fields:\s*\{([\s\S]*?)\}/);
	if (productFieldsMatch) {
		const fieldNames = [...productFieldsMatch[1].matchAll(/(\w+):/g)].map((m) => m[1]);
		fields.set('product', new Set(fieldNames));
	}

	// Extract product translated fields
	const productTransMatch = content.match(
		/product:\s*\{[\s\S]*?translatedFields:\s*\{([\s\S]*?)\}/
	);
	if (productTransMatch) {
		const fieldNames = [...productTransMatch[1].matchAll(/(\w+):/g)].map((m) => m[1]);
		fields.set('productTranslation', new Set(fieldNames));
	}

	// Extract variant fields
	const variantFieldsMatch = content.match(/productVariant:\s*\{[\s\S]*?fields:\s*\{([\s\S]*?)\}/);
	if (variantFieldsMatch) {
		const fieldNames = [...variantFieldsMatch[1].matchAll(/(\w+):/g)].map((m) => m[1]);
		fields.set('productVariant', new Set(fieldNames));
	}

	// Extract customer fields
	const customerFieldsMatch = content.match(/customer:\s*\{[\s\S]*?fields:\s*\{([\s\S]*?)\}/);
	if (customerFieldsMatch) {
		const fieldNames = [...customerFieldsMatch[1].matchAll(/(\w+):/g)].map((m) => m[1]);
		fields.set('customer', new Set(fieldNames));
	}

	// Extract facets
	const facetsMatch = content.match(/facets:\s*\{([\s\S]*?)\}/);
	if (facetsMatch) {
		const facetNames = [...facetsMatch[1].matchAll(/(\w+):\s*\{/g)].map((m) => m[1]);
		fields.set('facets', new Set(facetNames));
	}

	return fields;
}

/**
 * Check if schema has the required fields from config
 */
function validateSchemaSync(configPath: string, schemaPath: string): string[] {
	const warnings: string[] = [];
	const configFields = parseConfigFields(configPath);

	if (!existsSync(schemaPath)) {
		warnings.push(`Schema file not found: ${schemaPath}`);
		return warnings;
	}

	const schemaContent = readFileSync(schemaPath, 'utf-8');

	// Check product fields
	const productFields = configFields.get('product');
	if (productFields) {
		for (const field of productFields) {
			// Check if field exists in products table (as column definition)
			const fieldPattern = new RegExp(`${field}:\\s*(boolean|integer|varchar|text|timestamp)`);
			if (!fieldPattern.test(schemaContent) && !schemaContent.includes(`'${field}'`)) {
				// Skip validation for common fields that might be named differently
				if (!['enabled'].includes(field)) {
					warnings.push(`Product field "${field}" may not be in schema`);
				}
			}
		}
	}

	// Check translation fields
	const transFields = configFields.get('productTranslation');
	if (transFields) {
		for (const field of transFields) {
			if (!schemaContent.includes(`'${field}'`) && !schemaContent.includes(`${field}:`)) {
				warnings.push(`Product translation field "${field}" may not be in schema`);
			}
		}
	}

	return warnings;
}

/**
 * Log sync status with formatting
 */
function logSync(message: string, type: 'info' | 'warn' | 'error' = 'info') {
	const prefix = '[commerce-sync]';
	const colors = {
		info: '\x1b[36m', // cyan
		warn: '\x1b[33m', // yellow
		error: '\x1b[31m' // red
	};
	const reset = '\x1b[0m';

	console.log(`${colors[type]}${prefix}${reset} ${message}`);
}

/**
 * Create the commerce sync Vite plugin
 */
export function commerceSync(options: CommerceSyncOptions = {}): Plugin {
	const opts = { ...defaultOptions, ...options };
	let projectRoot: string;
	let configPath: string;
	let schemaPath: string;
	let server: ViteDevServer | null = null;

	return {
		name: 'commerce-sync',

		configResolved(config) {
			projectRoot = config.root;
			configPath = resolve(projectRoot, opts.config);
			schemaPath = resolve(projectRoot, opts.schema);
		},

		configureServer(devServer) {
			server = devServer;

			// Initial sync check
			logSync('Checking config/schema sync...');
			const warnings = validateSchemaSync(configPath, schemaPath);

			if (warnings.length > 0) {
				warnings.forEach((w) => logSync(w, 'warn'));
				logSync('Run "bun run db:push" after fixing schema issues', 'info');
			} else {
				logSync('Config and schema are in sync');
			}

			// Watch config file for changes
			if (existsSync(configPath)) {
				const watcher = watch(configPath, (eventType) => {
					if (eventType === 'change') {
						logSync('Config file changed, validating sync...');

						const newWarnings = validateSchemaSync(configPath, schemaPath);
						if (newWarnings.length > 0) {
							newWarnings.forEach((w) => logSync(w, 'warn'));
							logSync('Schema may need updating - check warnings above', 'warn');
						} else {
							logSync('Config and schema appear to be in sync');
						}

						// Trigger HMR to reload the app
						if (server) {
							server.ws.send({
								type: 'full-reload',
								path: '*'
							});
						}
					}
				});

				// Clean up on server close
				devServer.httpServer?.on('close', () => {
					watcher.close();
				});
			}
		},

		buildStart() {
			// Validate sync on production build
			if (!configPath || !schemaPath) return;

			const warnings = validateSchemaSync(configPath, schemaPath);

			if (warnings.length > 0) {
				logSync('Config/schema sync warnings:', 'warn');
				warnings.forEach((w) => logSync(`  - ${w}`, 'warn'));
				// Don't fail build, just warn
			}
		}
	};
}

export default commerceSync;
