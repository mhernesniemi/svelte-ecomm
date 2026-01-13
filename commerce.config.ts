/**
 * Commerce Configuration
 * This is the single source of truth for your commerce platform.
 * Changes here will sync with the database schema and admin UI.
 */
import { defineCommerce, v } from '$lib/commerce/define';

export default defineCommerce({
	// Language settings
	defaultLanguage: 'en',
	availableLanguages: ['en', 'fi'],

	// Product entity definition
	product: {
		fields: {
			enabled: v.optional(v.boolean(), true)
		},
		translatedFields: {
			name: v.pipe(v.string(), v.minLength(1), v.maxLength(255)),
			slug: v.string(),
			description: v.optional(v.string())
		},
		admin: {
			label: 'Products',
			listColumns: ['name', 'enabled', 'createdAt']
		}
	},

	// Product variant (SKU-level) definition
	productVariant: {
		fields: {
			sku: v.string(),
			price: v.pipe(v.number(), v.minValue(0)), // Price in cents
			stock: v.optional(v.number(), 0)
		},
		translatedFields: {
			name: v.optional(v.string())
		},
		admin: {
			label: 'Variants'
		}
	},

	// Facets for filtering products
	facets: {
		color: { type: 'string', filterable: true },
		size: { type: 'enum', options: ['XS', 'S', 'M', 'L', 'XL'], filterable: true },
		brand: { type: 'string', filterable: true },
		category: { type: 'string', filterable: true }
	},

	// Order state machine
	order: {
		states: ['created', 'payment_pending', 'paid', 'shipped', 'delivered', 'cancelled'],
		initialState: 'created'
	},

	// Customer entity definition
	customer: {
		fields: {
			email: v.pipe(v.string(), v.email()),
			firstName: v.string(),
			lastName: v.string(),
			phone: v.optional(v.string())
		},
		admin: {
			label: 'Customers',
			listColumns: ['email', 'firstName', 'lastName', 'createdAt']
		}
	},

	// Promotion/coupon configuration
	promotion: {
		types: ['percentage', 'fixed_amount'],
		fields: {
			code: v.pipe(v.string(), v.minLength(3), v.maxLength(50)),
			discountType: v.picklist(['percentage', 'fixed_amount']),
			discountValue: v.pipe(v.number(), v.minValue(0)),
			minOrderAmount: v.optional(v.number()),
			usageLimit: v.optional(v.number()),
			startsAt: v.optional(v.date()),
			endsAt: v.optional(v.date())
		}
	}
});
