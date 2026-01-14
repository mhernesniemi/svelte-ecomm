/**
 * Drizzle Schema for Commerce Platform
 * Based on Vendure's proven data model, adapted for lightweight SvelteKit implementation
 */
import { relations } from 'drizzle-orm';
import {
	pgTable,
	serial,
	text,
	boolean,
	integer,
	timestamp,
	varchar,
	primaryKey,
	index,
	uniqueIndex,
	numeric,
	jsonb
} from 'drizzle-orm/pg-core';

// ============================================================================
// PRODUCTS
// ============================================================================

export const products = pgTable(
	'products',
	{
		id: serial('id').primaryKey(),
		enabled: boolean('enabled').default(true).notNull(),
		featuredAssetId: integer('featured_asset_id'),
		deletedAt: timestamp('deleted_at'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => [index('products_enabled_idx').on(table.enabled)]
);

export const productTranslations = pgTable(
	'product_translations',
	{
		id: serial('id').primaryKey(),
		productId: integer('product_id')
			.references(() => products.id, { onDelete: 'cascade' })
			.notNull(),
		languageCode: varchar('language_code', { length: 10 }).notNull(),
		name: varchar('name', { length: 255 }).notNull(),
		slug: varchar('slug', { length: 255 }).notNull(),
		description: text('description')
	},
	(table) => [
		uniqueIndex('product_translations_product_lang_idx').on(table.productId, table.languageCode),
		index('product_translations_slug_idx').on(table.slug)
	]
);

// ============================================================================
// PRODUCT VARIANTS
// ============================================================================

export const productVariants = pgTable(
	'product_variants',
	{
		id: serial('id').primaryKey(),
		productId: integer('product_id')
			.references(() => products.id, { onDelete: 'cascade' })
			.notNull(),
		sku: varchar('sku', { length: 255 }).notNull(),
		price: integer('price').notNull(), // Price in cents
		stock: integer('stock').default(0).notNull(),
		featuredAssetId: integer('featured_asset_id'),
		deletedAt: timestamp('deleted_at'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => [
		uniqueIndex('product_variants_sku_idx').on(table.sku),
		index('product_variants_product_idx').on(table.productId)
	]
);

export const productVariantTranslations = pgTable(
	'product_variant_translations',
	{
		id: serial('id').primaryKey(),
		variantId: integer('variant_id')
			.references(() => productVariants.id, { onDelete: 'cascade' })
			.notNull(),
		languageCode: varchar('language_code', { length: 10 }).notNull(),
		name: varchar('name', { length: 255 })
	},
	(table) => [
		uniqueIndex('product_variant_translations_variant_lang_idx').on(
			table.variantId,
			table.languageCode
		)
	]
);

// ============================================================================
// FACETS & FACET VALUES
// ============================================================================

export const facets = pgTable('facets', {
	id: serial('id').primaryKey(),
	code: varchar('code', { length: 255 }).notNull().unique(),
	isPrivate: boolean('is_private').default(false).notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const facetTranslations = pgTable(
	'facet_translations',
	{
		id: serial('id').primaryKey(),
		facetId: integer('facet_id')
			.references(() => facets.id, { onDelete: 'cascade' })
			.notNull(),
		languageCode: varchar('language_code', { length: 10 }).notNull(),
		name: varchar('name', { length: 255 }).notNull()
	},
	(table) => [
		uniqueIndex('facet_translations_facet_lang_idx').on(table.facetId, table.languageCode)
	]
);

export const facetValues = pgTable(
	'facet_values',
	{
		id: serial('id').primaryKey(),
		facetId: integer('facet_id')
			.references(() => facets.id, { onDelete: 'cascade' })
			.notNull(),
		code: varchar('code', { length: 255 }).notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => [
		uniqueIndex('facet_values_facet_code_idx').on(table.facetId, table.code),
		index('facet_values_facet_idx').on(table.facetId)
	]
);

export const facetValueTranslations = pgTable(
	'facet_value_translations',
	{
		id: serial('id').primaryKey(),
		facetValueId: integer('facet_value_id')
			.references(() => facetValues.id, { onDelete: 'cascade' })
			.notNull(),
		languageCode: varchar('language_code', { length: 10 }).notNull(),
		name: varchar('name', { length: 255 }).notNull()
	},
	(table) => [
		uniqueIndex('facet_value_translations_value_lang_idx').on(
			table.facetValueId,
			table.languageCode
		)
	]
);

// Product-FacetValue many-to-many join
export const productFacetValues = pgTable(
	'product_facet_values',
	{
		productId: integer('product_id')
			.references(() => products.id, { onDelete: 'cascade' })
			.notNull(),
		facetValueId: integer('facet_value_id')
			.references(() => facetValues.id, { onDelete: 'cascade' })
			.notNull()
	},
	(table) => [
		primaryKey({ columns: [table.productId, table.facetValueId] }),
		index('product_facet_values_product_idx').on(table.productId),
		index('product_facet_values_value_idx').on(table.facetValueId)
	]
);

// Variant-FacetValue many-to-many join (for variant-specific facets like size/color)
export const variantFacetValues = pgTable(
	'variant_facet_values',
	{
		variantId: integer('variant_id')
			.references(() => productVariants.id, { onDelete: 'cascade' })
			.notNull(),
		facetValueId: integer('facet_value_id')
			.references(() => facetValues.id, { onDelete: 'cascade' })
			.notNull()
	},
	(table) => [
		primaryKey({ columns: [table.variantId, table.facetValueId] }),
		index('variant_facet_values_variant_idx').on(table.variantId),
		index('variant_facet_values_value_idx').on(table.facetValueId)
	]
);

// ============================================================================
// ASSETS
// ============================================================================

export const assets = pgTable('assets', {
	id: serial('id').primaryKey(),
	name: varchar('name', { length: 255 }).notNull(),
	type: varchar('type', { length: 50 }).notNull(), // 'image', 'video', etc.
	mimeType: varchar('mime_type', { length: 100 }).notNull(),
	width: integer('width').default(0),
	height: integer('height').default(0),
	fileSize: integer('file_size').default(0),
	source: varchar('source', { length: 500 }).notNull(), // File path or URL
	preview: varchar('preview', { length: 500 }), // Thumbnail path
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const productAssets = pgTable(
	'product_assets',
	{
		productId: integer('product_id')
			.references(() => products.id, { onDelete: 'cascade' })
			.notNull(),
		assetId: integer('asset_id')
			.references(() => assets.id, { onDelete: 'cascade' })
			.notNull(),
		position: integer('position').default(0).notNull()
	},
	(table) => [
		primaryKey({ columns: [table.productId, table.assetId] }),
		index('product_assets_product_idx').on(table.productId)
	]
);

export const productVariantAssets = pgTable(
	'product_variant_assets',
	{
		variantId: integer('variant_id')
			.references(() => productVariants.id, { onDelete: 'cascade' })
			.notNull(),
		assetId: integer('asset_id')
			.references(() => assets.id, { onDelete: 'cascade' })
			.notNull(),
		position: integer('position').default(0).notNull()
	},
	(table) => [
		primaryKey({ columns: [table.variantId, table.assetId] }),
		index('product_variant_assets_variant_idx').on(table.variantId)
	]
);

// ============================================================================
// CUSTOMERS
// ============================================================================

export const customers = pgTable(
	'customers',
	{
		id: serial('id').primaryKey(),
		clerkUserId: varchar('clerk_user_id', { length: 255 }).unique(),
		email: varchar('email', { length: 255 }).notNull(),
		firstName: varchar('first_name', { length: 100 }).notNull(),
		lastName: varchar('last_name', { length: 100 }).notNull(),
		phone: varchar('phone', { length: 50 }),
		isAdmin: boolean('is_admin').default(false).notNull(),
		deletedAt: timestamp('deleted_at'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => [
		uniqueIndex('customers_email_idx').on(table.email),
		uniqueIndex('customers_clerk_user_id_idx').on(table.clerkUserId),
		index('customers_name_idx').on(table.firstName, table.lastName)
	]
);

export const addresses = pgTable(
	'addresses',
	{
		id: serial('id').primaryKey(),
		customerId: integer('customer_id')
			.references(() => customers.id, { onDelete: 'cascade' })
			.notNull(),
		fullName: varchar('full_name', { length: 255 }),
		company: varchar('company', { length: 255 }),
		streetLine1: varchar('street_line_1', { length: 255 }).notNull(),
		streetLine2: varchar('street_line_2', { length: 255 }),
		city: varchar('city', { length: 100 }).notNull(),
		postalCode: varchar('postal_code', { length: 20 }).notNull(),
		country: varchar('country', { length: 100 }).notNull(),
		phoneNumber: varchar('phone_number', { length: 50 }),
		isDefault: boolean('is_default').default(false).notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => [index('addresses_customer_idx').on(table.customerId)]
);

// ============================================================================
// ORDERS
// ============================================================================

export const orders = pgTable(
	'orders',
	{
		id: serial('id').primaryKey(),
		code: varchar('code', { length: 50 }).notNull().unique(), // Customer-facing order reference
		customerId: integer('customer_id').references(() => customers.id, { onDelete: 'set null' }),
		cartToken: varchar('cart_token', { length: 64 }).unique(), // For guest cart tracking via cookies
		active: boolean('active').default(true).notNull(), // true = cart, false = completed order
		state: varchar('state', { length: 50 }).notNull().default('created'),
		// Pricing (all in cents)
		subtotal: integer('subtotal').default(0).notNull(),
		shipping: integer('shipping').default(0).notNull(),
		discount: integer('discount').default(0).notNull(),
		total: integer('total').default(0).notNull(),
		currencyCode: varchar('currency_code', { length: 10 }).default('EUR').notNull(),
		// Shipping address snapshot
		shippingFullName: varchar('shipping_full_name', { length: 255 }),
		shippingStreetLine1: varchar('shipping_street_line_1', { length: 255 }),
		shippingStreetLine2: varchar('shipping_street_line_2', { length: 255 }),
		shippingCity: varchar('shipping_city', { length: 100 }),
		shippingPostalCode: varchar('shipping_postal_code', { length: 20 }),
		shippingCountry: varchar('shipping_country', { length: 100 }),
		// Timestamps
		orderPlacedAt: timestamp('order_placed_at'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => [
		index('orders_customer_idx').on(table.customerId),
		index('orders_state_idx').on(table.state),
		index('orders_placed_at_idx').on(table.orderPlacedAt),
		index('orders_active_idx').on(table.active),
		index('orders_cart_token_idx').on(table.cartToken)
	]
);

export const orderLines = pgTable(
	'order_lines',
	{
		id: serial('id').primaryKey(),
		orderId: integer('order_id')
			.references(() => orders.id, { onDelete: 'cascade' })
			.notNull(),
		variantId: integer('variant_id')
			.references(() => productVariants.id)
			.notNull(),
		quantity: integer('quantity').notNull(),
		// Price snapshot at time of order (in cents)
		unitPrice: integer('unit_price').notNull(),
		lineTotal: integer('line_total').notNull(),
		// Product info snapshot
		productName: varchar('product_name', { length: 255 }).notNull(),
		variantName: varchar('variant_name', { length: 255 }),
		sku: varchar('sku', { length: 255 }).notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(table) => [
		index('order_lines_order_idx').on(table.orderId),
		index('order_lines_variant_idx').on(table.variantId)
	]
);

// ============================================================================
// PAYMENTS
// ============================================================================

export const payments = pgTable(
	'payments',
	{
		id: serial('id').primaryKey(),
		orderId: integer('order_id')
			.references(() => orders.id, { onDelete: 'cascade' })
			.notNull(),
		method: varchar('method', { length: 100 }).notNull(), // 'mock', 'stripe', etc.
		amount: integer('amount').notNull(), // Amount in cents
		state: varchar('state', { length: 50 }).notNull().default('pending'),
		transactionId: varchar('transaction_id', { length: 255 }), // External gateway ID
		errorMessage: text('error_message'),
		metadata: text('metadata'), // JSON string for gateway-specific data
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => [
		index('payments_order_idx').on(table.orderId),
		index('payments_state_idx').on(table.state)
	]
);

// ============================================================================
// SHIPPING
// ============================================================================

export const shippingMethods = pgTable(
	'shipping_methods',
	{
		id: serial('id').primaryKey(),
		code: varchar('code', { length: 100 }).notNull().unique(), // 'posti_standard', 'matkahuolto_express'
		name: varchar('name', { length: 255 }).notNull(), // 'Posti Standard', 'Matkahuolto Express'
		description: text('description'),
		active: boolean('active').default(true).notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => [
		uniqueIndex('shipping_methods_code_idx').on(table.code),
		index('shipping_methods_active_idx').on(table.active)
	]
);

export const orderShipping = pgTable(
	'order_shipping',
	{
		id: serial('id').primaryKey(),
		orderId: integer('order_id')
			.references(() => orders.id, { onDelete: 'cascade' })
			.notNull(),
		shippingMethodId: integer('shipping_method_id')
			.references(() => shippingMethods.id)
			.notNull(),
		trackingNumber: varchar('tracking_number', { length: 255 }),
		status: varchar('status', { length: 50 }).default('pending').notNull(), // pending, shipped, in_transit, delivered
		price: integer('price').notNull(), // Price in cents
		metadata: jsonb('metadata'), // Store provider-specific data
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => [
		index('order_shipping_order_idx').on(table.orderId),
		index('order_shipping_method_idx').on(table.shippingMethodId),
		index('order_shipping_status_idx').on(table.status),
		index('order_shipping_tracking_idx').on(table.trackingNumber)
	]
);

// ============================================================================
// PROMOTIONS
// ============================================================================

export const promotions = pgTable(
	'promotions',
	{
		id: serial('id').primaryKey(),
		code: varchar('code', { length: 50 }).notNull().unique(),
		discountType: varchar('discount_type', { length: 50 }).notNull(), // 'percentage' or 'fixed_amount'
		discountValue: integer('discount_value').notNull(), // Percentage (0-100) or amount in cents
		minOrderAmount: integer('min_order_amount'), // Minimum order amount for promotion
		usageLimit: integer('usage_limit'), // Max number of times this can be used
		usageCount: integer('usage_count').default(0).notNull(),
		enabled: boolean('enabled').default(true).notNull(),
		startsAt: timestamp('starts_at'),
		endsAt: timestamp('ends_at'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => [
		index('promotions_code_idx').on(table.code),
		index('promotions_enabled_idx').on(table.enabled)
	]
);

// Applied promotions to orders
export const orderPromotions = pgTable(
	'order_promotions',
	{
		orderId: integer('order_id')
			.references(() => orders.id, { onDelete: 'cascade' })
			.notNull(),
		promotionId: integer('promotion_id')
			.references(() => promotions.id)
			.notNull(),
		discountAmount: integer('discount_amount').notNull() // Actual discount applied (in cents)
	},
	(table) => [
		primaryKey({ columns: [table.orderId, table.promotionId] }),
		index('order_promotions_order_idx').on(table.orderId)
	]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const productsRelations = relations(products, ({ one, many }) => ({
	translations: many(productTranslations),
	variants: many(productVariants),
	facetValues: many(productFacetValues),
	assets: many(productAssets),
	featuredAsset: one(assets, {
		fields: [products.featuredAssetId],
		references: [assets.id]
	})
}));

export const productTranslationsRelations = relations(productTranslations, ({ one }) => ({
	product: one(products, {
		fields: [productTranslations.productId],
		references: [products.id]
	})
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
	product: one(products, {
		fields: [productVariants.productId],
		references: [products.id]
	}),
	translations: many(productVariantTranslations),
	facetValues: many(variantFacetValues),
	assets: many(productVariantAssets),
	featuredAsset: one(assets, {
		fields: [productVariants.featuredAssetId],
		references: [assets.id]
	}),
	orderLines: many(orderLines)
}));

export const productVariantTranslationsRelations = relations(
	productVariantTranslations,
	({ one }) => ({
		variant: one(productVariants, {
			fields: [productVariantTranslations.variantId],
			references: [productVariants.id]
		})
	})
);

export const facetsRelations = relations(facets, ({ many }) => ({
	translations: many(facetTranslations),
	values: many(facetValues)
}));

export const facetTranslationsRelations = relations(facetTranslations, ({ one }) => ({
	facet: one(facets, {
		fields: [facetTranslations.facetId],
		references: [facets.id]
	})
}));

export const facetValuesRelations = relations(facetValues, ({ one, many }) => ({
	facet: one(facets, {
		fields: [facetValues.facetId],
		references: [facets.id]
	}),
	translations: many(facetValueTranslations),
	products: many(productFacetValues),
	variants: many(variantFacetValues)
}));

export const facetValueTranslationsRelations = relations(facetValueTranslations, ({ one }) => ({
	facetValue: one(facetValues, {
		fields: [facetValueTranslations.facetValueId],
		references: [facetValues.id]
	})
}));

export const productFacetValuesRelations = relations(productFacetValues, ({ one }) => ({
	product: one(products, {
		fields: [productFacetValues.productId],
		references: [products.id]
	}),
	facetValue: one(facetValues, {
		fields: [productFacetValues.facetValueId],
		references: [facetValues.id]
	})
}));

export const variantFacetValuesRelations = relations(variantFacetValues, ({ one }) => ({
	variant: one(productVariants, {
		fields: [variantFacetValues.variantId],
		references: [productVariants.id]
	}),
	facetValue: one(facetValues, {
		fields: [variantFacetValues.facetValueId],
		references: [facetValues.id]
	})
}));

export const assetsRelations = relations(assets, ({ many }) => ({
	productAssets: many(productAssets),
	variantAssets: many(productVariantAssets)
}));

export const productAssetsRelations = relations(productAssets, ({ one }) => ({
	product: one(products, {
		fields: [productAssets.productId],
		references: [products.id]
	}),
	asset: one(assets, {
		fields: [productAssets.assetId],
		references: [assets.id]
	})
}));

export const productVariantAssetsRelations = relations(productVariantAssets, ({ one }) => ({
	variant: one(productVariants, {
		fields: [productVariantAssets.variantId],
		references: [productVariants.id]
	}),
	asset: one(assets, {
		fields: [productVariantAssets.assetId],
		references: [assets.id]
	})
}));

export const customersRelations = relations(customers, ({ many }) => ({
	addresses: many(addresses),
	orders: many(orders)
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
	customer: one(customers, {
		fields: [addresses.customerId],
		references: [customers.id]
	})
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
	customer: one(customers, {
		fields: [orders.customerId],
		references: [customers.id]
	}),
	lines: many(orderLines),
	payments: many(payments),
	promotions: many(orderPromotions),
	shipping: one(orderShipping)
}));

export const orderLinesRelations = relations(orderLines, ({ one }) => ({
	order: one(orders, {
		fields: [orderLines.orderId],
		references: [orders.id]
	}),
	variant: one(productVariants, {
		fields: [orderLines.variantId],
		references: [productVariants.id]
	})
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
	order: one(orders, {
		fields: [payments.orderId],
		references: [orders.id]
	})
}));

export const promotionsRelations = relations(promotions, ({ many }) => ({
	orderPromotions: many(orderPromotions)
}));

export const orderPromotionsRelations = relations(orderPromotions, ({ one }) => ({
	order: one(orders, {
		fields: [orderPromotions.orderId],
		references: [orders.id]
	}),
	promotion: one(promotions, {
		fields: [orderPromotions.promotionId],
		references: [promotions.id]
	})
}));

export const shippingMethodsRelations = relations(shippingMethods, ({ many }) => ({
	orderShippings: many(orderShipping)
}));

export const orderShippingRelations = relations(orderShipping, ({ one }) => ({
	order: one(orders, {
		fields: [orderShipping.orderId],
		references: [orders.id]
	}),
	shippingMethod: one(shippingMethods, {
		fields: [orderShipping.shippingMethodId],
		references: [shippingMethods.id]
	})
}));
