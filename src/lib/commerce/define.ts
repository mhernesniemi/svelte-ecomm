/**
 * Commerce configuration definition helper
 * This file provides type-safe configuration for the commerce platform
 */
import type * as v from 'valibot';

// Language code type
export type LanguageCode = string;

// Facet definition types
export type FacetType = 'string' | 'enum' | 'number' | 'boolean';

export interface FacetDefinition {
	type: FacetType;
	options?: string[]; // For enum type
	filterable?: boolean;
}

// Admin configuration for entities
export interface AdminConfig {
	label: string;
	listColumns?: string[];
	description?: string;
}

// Entity definition with fields and optional translations
export interface EntityDefinition {
	fields: Record<string, v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>>;
	translatedFields?: Record<string, v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>>;
	admin?: AdminConfig;
}

// Order state configuration
export interface OrderConfig {
	states: readonly string[];
	initialState: string;
}

// Promotion configuration
export interface PromotionConfig {
	types: readonly string[];
	fields: Record<string, v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>>;
}

// Main commerce configuration shape
export interface CommerceConfig {
	defaultLanguage: LanguageCode;
	availableLanguages: LanguageCode[];
	product: EntityDefinition;
	productVariant: EntityDefinition;
	facets: Record<string, FacetDefinition>;
	order: OrderConfig;
	customer: EntityDefinition;
	promotion: PromotionConfig;
}

/**
 * Define commerce configuration with full type safety
 * This is the main entry point for configuring the commerce platform
 */
export function defineCommerce<T extends CommerceConfig>(config: T): T {
	// Validate that initialState is in states array
	if (!config.order.states.includes(config.order.initialState)) {
		throw new Error(
			`Invalid order config: initialState "${config.order.initialState}" is not in states array`
		);
	}

	// Validate that defaultLanguage is in availableLanguages
	if (!config.availableLanguages.includes(config.defaultLanguage)) {
		throw new Error(
			`Invalid config: defaultLanguage "${config.defaultLanguage}" is not in availableLanguages`
		);
	}

	return config;
}

// Re-export valibot for convenience
export * as v from 'valibot';
