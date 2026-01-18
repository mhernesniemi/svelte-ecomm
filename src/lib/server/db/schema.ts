/**
 * Drizzle Schema for Hoikka
 */
import { relations } from "drizzle-orm";
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
} from "drizzle-orm/pg-core";

// ============================================================================
// PRODUCTS
// ============================================================================

export const products = pgTable(
	"products",
	{
		id: serial("id").primaryKey(),
		type: text("type", {
			enum: ["physical", "digital"]
		})
			.default("physical")
			.notNull(),
		visibility: text("visibility", {
			enum: ["public", "private", "hidden"]
		})
			.default("public")
			.notNull(),
		featuredAssetId: integer("featured_asset_id"),
		deletedAt: timestamp("deleted_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [index("products_visibility_idx").on(table.visibility)]
);

export const productTranslations = pgTable(
	"product_translations",
	{
		id: serial("id").primaryKey(),
		productId: integer("product_id")
			.references(() => products.id, { onDelete: "cascade" })
			.notNull(),
		languageCode: varchar("language_code", { length: 10 }).notNull(),
		name: varchar("name", { length: 255 }).notNull(),
		slug: varchar("slug", { length: 255 }).notNull(),
		description: text("description")
	},
	(table) => [
		uniqueIndex("product_translations_product_lang_idx").on(
			table.productId,
			table.languageCode
		),
		index("product_translations_slug_idx").on(table.slug)
	]
);

// ============================================================================
// PRODUCT VARIANTS
// ============================================================================

export const productVariants = pgTable(
	"product_variants",
	{
		id: serial("id").primaryKey(),
		productId: integer("product_id")
			.references(() => products.id, { onDelete: "cascade" })
			.notNull(),
		sku: varchar("sku", { length: 255 }).notNull(),
		price: integer("price").notNull(), // Price in cents
		stock: integer("stock").default(0).notNull(),
		featuredAssetId: integer("featured_asset_id"),
		deletedAt: timestamp("deleted_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [
		uniqueIndex("product_variants_sku_idx").on(table.sku),
		index("product_variants_product_idx").on(table.productId)
	]
);

export const productVariantTranslations = pgTable(
	"product_variant_translations",
	{
		id: serial("id").primaryKey(),
		variantId: integer("variant_id")
			.references(() => productVariants.id, { onDelete: "cascade" })
			.notNull(),
		languageCode: varchar("language_code", { length: 10 }).notNull(),
		name: varchar("name", { length: 255 })
	},
	(table) => [
		uniqueIndex("product_variant_translations_variant_lang_idx").on(
			table.variantId,
			table.languageCode
		)
	]
);

// B2B Group Pricing - groupId references customerGroups (defined later in file)
export const productVariantGroupPrices = pgTable(
	"product_variant_group_prices",
	{
		id: serial("id").primaryKey(),
		variantId: integer("variant_id")
			.references(() => productVariants.id, { onDelete: "cascade" })
			.notNull(),
		groupId: integer("group_id").notNull(),
		price: integer("price").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [
		uniqueIndex("variant_group_price_unique").on(table.variantId, table.groupId),
		index("variant_group_prices_variant_idx").on(table.variantId),
		index("variant_group_prices_group_idx").on(table.groupId)
	]
);

// ============================================================================
// FACETS & FACET VALUES
// ============================================================================

export const facets = pgTable("facets", {
	id: serial("id").primaryKey(),
	code: varchar("code", { length: 255 }).notNull().unique(),
	isPrivate: boolean("is_private").default(false).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull()
});

export const facetTranslations = pgTable(
	"facet_translations",
	{
		id: serial("id").primaryKey(),
		facetId: integer("facet_id")
			.references(() => facets.id, { onDelete: "cascade" })
			.notNull(),
		languageCode: varchar("language_code", { length: 10 }).notNull(),
		name: varchar("name", { length: 255 }).notNull()
	},
	(table) => [
		uniqueIndex("facet_translations_facet_lang_idx").on(table.facetId, table.languageCode)
	]
);

export const facetValues = pgTable(
	"facet_values",
	{
		id: serial("id").primaryKey(),
		facetId: integer("facet_id")
			.references(() => facets.id, { onDelete: "cascade" })
			.notNull(),
		code: varchar("code", { length: 255 }).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [
		uniqueIndex("facet_values_facet_code_idx").on(table.facetId, table.code),
		index("facet_values_facet_idx").on(table.facetId)
	]
);

export const facetValueTranslations = pgTable(
	"facet_value_translations",
	{
		id: serial("id").primaryKey(),
		facetValueId: integer("facet_value_id")
			.references(() => facetValues.id, { onDelete: "cascade" })
			.notNull(),
		languageCode: varchar("language_code", { length: 10 }).notNull(),
		name: varchar("name", { length: 255 }).notNull()
	},
	(table) => [
		uniqueIndex("facet_value_translations_value_lang_idx").on(
			table.facetValueId,
			table.languageCode
		)
	]
);

// Product-FacetValue many-to-many join
export const productFacetValues = pgTable(
	"product_facet_values",
	{
		productId: integer("product_id")
			.references(() => products.id, { onDelete: "cascade" })
			.notNull(),
		facetValueId: integer("facet_value_id")
			.references(() => facetValues.id, { onDelete: "cascade" })
			.notNull()
	},
	(table) => [
		primaryKey({ columns: [table.productId, table.facetValueId] }),
		index("product_facet_values_product_idx").on(table.productId),
		index("product_facet_values_value_idx").on(table.facetValueId)
	]
);

// Variant-FacetValue many-to-many join (for variant-specific facets like size/color)
export const variantFacetValues = pgTable(
	"variant_facet_values",
	{
		variantId: integer("variant_id")
			.references(() => productVariants.id, { onDelete: "cascade" })
			.notNull(),
		facetValueId: integer("facet_value_id")
			.references(() => facetValues.id, { onDelete: "cascade" })
			.notNull()
	},
	(table) => [
		primaryKey({ columns: [table.variantId, table.facetValueId] }),
		index("variant_facet_values_variant_idx").on(table.variantId),
		index("variant_facet_values_value_idx").on(table.facetValueId)
	]
);

// ============================================================================
// ASSETS
// ============================================================================

export const assets = pgTable("assets", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	type: text("type", { enum: ["image", "video", "document", "other"] }).notNull(),
	mimeType: varchar("mime_type", { length: 100 }).notNull(),
	width: integer("width").default(0),
	height: integer("height").default(0),
	fileSize: integer("file_size").default(0),
	source: varchar("source", { length: 500 }).notNull(), // File path or URL
	preview: varchar("preview", { length: 500 }), // Thumbnail path
	createdAt: timestamp("created_at").defaultNow().notNull()
});

export const productAssets = pgTable(
	"product_assets",
	{
		productId: integer("product_id")
			.references(() => products.id, { onDelete: "cascade" })
			.notNull(),
		assetId: integer("asset_id")
			.references(() => assets.id, { onDelete: "cascade" })
			.notNull(),
		position: integer("position").default(0).notNull()
	},
	(table) => [
		primaryKey({ columns: [table.productId, table.assetId] }),
		index("product_assets_product_idx").on(table.productId)
	]
);

export const productVariantAssets = pgTable(
	"product_variant_assets",
	{
		variantId: integer("variant_id")
			.references(() => productVariants.id, { onDelete: "cascade" })
			.notNull(),
		assetId: integer("asset_id")
			.references(() => assets.id, { onDelete: "cascade" })
			.notNull(),
		position: integer("position").default(0).notNull()
	},
	(table) => [
		primaryKey({ columns: [table.variantId, table.assetId] }),
		index("product_variant_assets_variant_idx").on(table.variantId)
	]
);

// ============================================================================
// CUSTOMER GROUPS (B2B)
// ============================================================================

export const customerGroups = pgTable(
	"customer_groups",
	{
		id: serial("id").primaryKey(),
		code: varchar("code", { length: 100 }).notNull().unique(),
		name: varchar("name", { length: 255 }).notNull(),
		description: text("description"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [uniqueIndex("customer_groups_code_idx").on(table.code)]
);

// Customer-Group many-to-many join
export const customerGroupMembers = pgTable(
	"customer_group_members",
	{
		customerId: integer("customer_id")
			.references(() => customers.id, { onDelete: "cascade" })
			.notNull(),
		groupId: integer("group_id")
			.references(() => customerGroups.id, { onDelete: "cascade" })
			.notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull()
	},
	(table) => [
		primaryKey({ columns: [table.customerId, table.groupId] }),
		index("customer_group_members_customer_idx").on(table.customerId),
		index("customer_group_members_group_idx").on(table.groupId)
	]
);

// ============================================================================
// CUSTOMERS
// ============================================================================

export const customers = pgTable(
	"customers",
	{
		id: serial("id").primaryKey(),
		clerkUserId: varchar("clerk_user_id", { length: 255 }).unique(),
		email: varchar("email", { length: 255 }).notNull(),
		firstName: varchar("first_name", { length: 100 }).notNull(),
		lastName: varchar("last_name", { length: 100 }).notNull(),
		phone: varchar("phone", { length: 50 }),
		isAdmin: boolean("is_admin").default(false).notNull(),
		b2bStatus: text("b2b_status", {
			enum: ["retail", "pending", "approved", "rejected"]
		})
			.default("retail")
			.notNull(),
		deletedAt: timestamp("deleted_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [
		uniqueIndex("customers_email_idx").on(table.email),
		uniqueIndex("customers_clerk_user_id_idx").on(table.clerkUserId),
		index("customers_name_idx").on(table.firstName, table.lastName),
		index("customers_b2b_status_idx").on(table.b2bStatus)
	]
);

export const addresses = pgTable(
	"addresses",
	{
		id: serial("id").primaryKey(),
		customerId: integer("customer_id")
			.references(() => customers.id, { onDelete: "cascade" })
			.notNull(),
		fullName: varchar("full_name", { length: 255 }),
		company: varchar("company", { length: 255 }),
		streetLine1: varchar("street_line_1", { length: 255 }).notNull(),
		streetLine2: varchar("street_line_2", { length: 255 }),
		city: varchar("city", { length: 100 }).notNull(),
		postalCode: varchar("postal_code", { length: 20 }).notNull(),
		country: varchar("country", { length: 100 }).notNull(),
		phoneNumber: varchar("phone_number", { length: 50 }),
		isDefault: boolean("is_default").default(false).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [index("addresses_customer_idx").on(table.customerId)]
);

// ============================================================================
// ORDERS
// ============================================================================

export const orders = pgTable(
	"orders",
	{
		id: serial("id").primaryKey(),
		code: varchar("code", { length: 50 }).notNull().unique(), // Customer-facing order reference
		customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
		cartToken: varchar("cart_token", { length: 64 }).unique(), // For guest cart tracking via cookies
		active: boolean("active").default(true).notNull(), // true = cart, false = completed order
		state: text("state", {
			enum: ["created", "payment_pending", "paid", "shipped", "delivered", "cancelled"]
		})
			.notNull()
			.default("created"),
		// Pricing (all in cents)
		subtotal: integer("subtotal").default(0).notNull(),
		shipping: integer("shipping").default(0).notNull(),
		discount: integer("discount").default(0).notNull(),
		total: integer("total").default(0).notNull(),
		currencyCode: varchar("currency_code", { length: 10 }).default("EUR").notNull(),
		// Shipping address snapshot
		shippingFullName: varchar("shipping_full_name", { length: 255 }),
		shippingStreetLine1: varchar("shipping_street_line_1", { length: 255 }),
		shippingStreetLine2: varchar("shipping_street_line_2", { length: 255 }),
		shippingCity: varchar("shipping_city", { length: 100 }),
		shippingPostalCode: varchar("shipping_postal_code", { length: 20 }),
		shippingCountry: varchar("shipping_country", { length: 100 }),
		// Contact email (for order confirmations and digital delivery)
		customerEmail: varchar("customer_email", { length: 255 }),
		// Timestamps
		orderPlacedAt: timestamp("order_placed_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [
		index("orders_customer_idx").on(table.customerId),
		index("orders_state_idx").on(table.state),
		index("orders_placed_at_idx").on(table.orderPlacedAt),
		index("orders_active_idx").on(table.active),
		index("orders_cart_token_idx").on(table.cartToken)
	]
);

export const orderLines = pgTable(
	"order_lines",
	{
		id: serial("id").primaryKey(),
		orderId: integer("order_id")
			.references(() => orders.id, { onDelete: "cascade" })
			.notNull(),
		variantId: integer("variant_id")
			.references(() => productVariants.id)
			.notNull(),
		quantity: integer("quantity").notNull(),
		// Price snapshot at time of order (in cents)
		unitPrice: integer("unit_price").notNull(),
		lineTotal: integer("line_total").notNull(),
		// Product info snapshot
		productName: varchar("product_name", { length: 255 }).notNull(),
		variantName: varchar("variant_name", { length: 255 }),
		sku: varchar("sku", { length: 255 }).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull()
	},
	(table) => [
		index("order_lines_order_idx").on(table.orderId),
		index("order_lines_variant_idx").on(table.variantId)
	]
);

// ============================================================================
// PAYMENTS
// ============================================================================

export const paymentMethods = pgTable(
	"payment_methods",
	{
		id: serial("id").primaryKey(),
		code: varchar("code", { length: 100 }).notNull().unique(), // 'stripe', 'paypal', 'klarna'
		name: varchar("name", { length: 255 }).notNull(), // 'Stripe', 'PayPal', 'Klarna'
		description: text("description"),
		active: boolean("active").default(true).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [
		uniqueIndex("payment_methods_code_idx").on(table.code),
		index("payment_methods_active_idx").on(table.active)
	]
);

export const payments = pgTable(
	"payments",
	{
		id: serial("id").primaryKey(),
		orderId: integer("order_id")
			.references(() => orders.id, { onDelete: "cascade" })
			.notNull(),
		paymentMethodId: integer("payment_method_id")
			.references(() => paymentMethods.id)
			.notNull(),
		method: varchar("method", { length: 100 }).notNull(), // Legacy: kept for backward compatibility
		amount: integer("amount").notNull(), // Amount in cents
		state: text("state", { enum: ["pending", "authorized", "settled", "declined", "refunded"] })
			.notNull()
			.default("pending"),
		transactionId: varchar("transaction_id", { length: 255 }), // External gateway ID
		errorMessage: text("error_message"),
		metadata: jsonb("metadata"), // Store provider-specific data (changed from text to jsonb)
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [
		index("payments_order_idx").on(table.orderId),
		index("payments_method_idx").on(table.paymentMethodId),
		index("payments_state_idx").on(table.state),
		index("payments_transaction_idx").on(table.transactionId)
	]
);

// ============================================================================
// SHIPPING
// ============================================================================

export const shippingMethods = pgTable(
	"shipping_methods",
	{
		id: serial("id").primaryKey(),
		code: varchar("code", { length: 100 }).notNull().unique(), // 'posti_standard', 'matkahuolto_express'
		name: varchar("name", { length: 255 }).notNull(), // 'Posti Standard', 'Matkahuolto Express'
		description: text("description"),
		active: boolean("active").default(true).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [
		uniqueIndex("shipping_methods_code_idx").on(table.code),
		index("shipping_methods_active_idx").on(table.active)
	]
);

export const orderShipping = pgTable(
	"order_shipping",
	{
		id: serial("id").primaryKey(),
		orderId: integer("order_id")
			.references(() => orders.id, { onDelete: "cascade" })
			.notNull(),
		shippingMethodId: integer("shipping_method_id")
			.references(() => shippingMethods.id)
			.notNull(),
		trackingNumber: varchar("tracking_number", { length: 255 }),
		status: text("status", { enum: ["pending", "shipped", "in_transit", "delivered", "error"] })
			.default("pending")
			.notNull(),
		price: integer("price").notNull(), // Price in cents
		metadata: jsonb("metadata"), // Store provider-specific data
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [
		index("order_shipping_order_idx").on(table.orderId),
		index("order_shipping_method_idx").on(table.shippingMethodId),
		index("order_shipping_status_idx").on(table.status),
		index("order_shipping_tracking_idx").on(table.trackingNumber)
	]
);

// ============================================================================
// PROMOTIONS
// ============================================================================

export const promotions = pgTable(
	"promotions",
	{
		id: serial("id").primaryKey(),
		code: varchar("code", { length: 50 }).notNull().unique(),
		discountType: text("discount_type", { enum: ["percentage", "fixed_amount"] }).notNull(),
		discountValue: integer("discount_value").notNull(), // Percentage (0-100) or amount in cents
		minOrderAmount: integer("min_order_amount"), // Minimum order amount for promotion
		usageLimit: integer("usage_limit"), // Max number of times this can be used
		usageCount: integer("usage_count").default(0).notNull(),
		enabled: boolean("enabled").default(true).notNull(),
		startsAt: timestamp("starts_at"),
		endsAt: timestamp("ends_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [
		index("promotions_code_idx").on(table.code),
		index("promotions_enabled_idx").on(table.enabled)
	]
);

// Applied promotions to orders
export const orderPromotions = pgTable(
	"order_promotions",
	{
		orderId: integer("order_id")
			.references(() => orders.id, { onDelete: "cascade" })
			.notNull(),
		promotionId: integer("promotion_id")
			.references(() => promotions.id)
			.notNull(),
		discountAmount: integer("discount_amount").notNull() // Actual discount applied (in cents)
	},
	(table) => [
		primaryKey({ columns: [table.orderId, table.promotionId] }),
		index("order_promotions_order_idx").on(table.orderId)
	]
);

// ============================================================================
// COLLECTIONS (Smart Collections - Vendure/Shopify style)
// ============================================================================

export const collections = pgTable(
	"collections",
	{
		id: serial("id").primaryKey(),
		code: varchar("code", { length: 255 }).notNull().unique(),
		enabled: boolean("enabled").default(true).notNull(),
		isPrivate: boolean("is_private").default(false).notNull(),
		featuredAssetId: integer("featured_asset_id").references(() => assets.id),
		position: integer("position").default(0).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [index("collections_enabled_idx").on(table.enabled)]
);

export const collectionTranslations = pgTable(
	"collection_translations",
	{
		id: serial("id").primaryKey(),
		collectionId: integer("collection_id")
			.references(() => collections.id, { onDelete: "cascade" })
			.notNull(),
		languageCode: varchar("language_code", { length: 10 }).notNull(),
		name: varchar("name", { length: 255 }).notNull(),
		slug: varchar("slug", { length: 255 }).notNull(),
		description: text("description")
	},
	(table) => [
		uniqueIndex("collection_translations_collection_lang_idx").on(
			table.collectionId,
			table.languageCode
		),
		index("collection_translations_slug_idx").on(table.slug)
	]
);

// Collection filters - rules stored as rows, products derived dynamically
export const collectionFilters = pgTable(
	"collection_filters",
	{
		id: serial("id").primaryKey(),
		collectionId: integer("collection_id")
			.references(() => collections.id, { onDelete: "cascade" })
			.notNull(),
		field: text("field", {
			enum: ["facet", "price", "stock", "visibility", "product", "variant"]
		}).notNull(),
		operator: text("operator", {
			enum: ["eq", "in", "gte", "lte", "gt", "contains"]
		}).notNull(),
		value: jsonb("value").notNull(), // flexible payload
		createdAt: timestamp("created_at").defaultNow().notNull()
	},
	(table) => [index("collection_filters_collection_idx").on(table.collectionId)]
);

// ============================================================================
// REVIEWS
// ============================================================================

export const reviews = pgTable(
	"reviews",
	{
		id: serial("id").primaryKey(),
		productId: integer("product_id")
			.references(() => products.id, { onDelete: "cascade" })
			.notNull(),
		customerId: integer("customer_id")
			.references(() => customers.id, { onDelete: "cascade" })
			.notNull(),
		nickname: varchar("nickname", { length: 100 }).notNull(),
		rating: integer("rating").notNull(),
		comment: text("comment"),
		isVerifiedPurchase: boolean("is_verified_purchase").default(false).notNull(),
		status: text("status", { enum: ["pending", "approved", "rejected"] })
			.default("pending")
			.notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [
		index("reviews_product_idx").on(table.productId),
		index("reviews_customer_idx").on(table.customerId),
		index("reviews_status_idx").on(table.status),
		uniqueIndex("reviews_product_customer_idx").on(table.productId, table.customerId)
	]
);

// ============================================================================
// WISHLISTS
// ============================================================================

export const wishlists = pgTable(
	"wishlists",
	{
		id: serial("id").primaryKey(),
		customerId: integer("customer_id").references(() => customers.id, { onDelete: "cascade" }),
		guestToken: varchar("guest_token", { length: 64 }).unique(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [
		index("wishlists_customer_idx").on(table.customerId),
		index("wishlists_guest_token_idx").on(table.guestToken)
	]
);

export const wishlistItems = pgTable(
	"wishlist_items",
	{
		id: serial("id").primaryKey(),
		wishlistId: integer("wishlist_id")
			.references(() => wishlists.id, { onDelete: "cascade" })
			.notNull(),
		productId: integer("product_id")
			.references(() => products.id, { onDelete: "cascade" })
			.notNull(),
		variantId: integer("variant_id").references(() => productVariants.id, {
			onDelete: "cascade"
		}),
		addedAt: timestamp("added_at").defaultNow().notNull()
	},
	(table) => [
		index("wishlist_items_wishlist_idx").on(table.wishlistId),
		index("wishlist_items_product_idx").on(table.productId),
		uniqueIndex("wishlist_items_wishlist_product_idx").on(table.wishlistId, table.productId)
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
	reviews: many(reviews),
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
	orderLines: many(orderLines),
	groupPrices: many(productVariantGroupPrices)
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

export const productVariantGroupPricesRelations = relations(
	productVariantGroupPrices,
	({ one }) => ({
		variant: one(productVariants, {
			fields: [productVariantGroupPrices.variantId],
			references: [productVariants.id]
		}),
		group: one(customerGroups, {
			fields: [productVariantGroupPrices.groupId],
			references: [customerGroups.id]
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

export const customerGroupsRelations = relations(customerGroups, ({ many }) => ({
	members: many(customerGroupMembers),
	groupPrices: many(productVariantGroupPrices)
}));

export const customerGroupMembersRelations = relations(customerGroupMembers, ({ one }) => ({
	customer: one(customers, {
		fields: [customerGroupMembers.customerId],
		references: [customers.id]
	}),
	group: one(customerGroups, {
		fields: [customerGroupMembers.groupId],
		references: [customerGroups.id]
	})
}));

export const customersRelations = relations(customers, ({ many }) => ({
	groupMemberships: many(customerGroupMembers),
	addresses: many(addresses),
	orders: many(orders),
	reviews: many(reviews)
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

export const paymentMethodsRelations = relations(paymentMethods, ({ many }) => ({
	payments: many(payments)
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
	order: one(orders, {
		fields: [payments.orderId],
		references: [orders.id]
	}),
	paymentMethod: one(paymentMethods, {
		fields: [payments.paymentMethodId],
		references: [paymentMethods.id]
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

export const collectionsRelations = relations(collections, ({ one, many }) => ({
	translations: many(collectionTranslations),
	filters: many(collectionFilters),
	featuredAsset: one(assets, {
		fields: [collections.featuredAssetId],
		references: [assets.id]
	})
}));

export const collectionTranslationsRelations = relations(collectionTranslations, ({ one }) => ({
	collection: one(collections, {
		fields: [collectionTranslations.collectionId],
		references: [collections.id]
	})
}));

export const collectionFiltersRelations = relations(collectionFilters, ({ one }) => ({
	collection: one(collections, {
		fields: [collectionFilters.collectionId],
		references: [collections.id]
	})
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
	product: one(products, {
		fields: [reviews.productId],
		references: [products.id]
	}),
	customer: one(customers, {
		fields: [reviews.customerId],
		references: [customers.id]
	})
}));

export const wishlistsRelations = relations(wishlists, ({ one, many }) => ({
	customer: one(customers, {
		fields: [wishlists.customerId],
		references: [customers.id]
	}),
	items: many(wishlistItems)
}));

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
	wishlist: one(wishlists, {
		fields: [wishlistItems.wishlistId],
		references: [wishlists.id]
	}),
	product: one(products, {
		fields: [wishlistItems.productId],
		references: [products.id]
	}),
	variant: one(productVariants, {
		fields: [wishlistItems.variantId],
		references: [productVariants.id]
	})
}));

// ============================================================================
// ADMIN USERS
// ============================================================================

export const users = pgTable(
	"users",
	{
		id: serial("id").primaryKey(),
		email: varchar("email", { length: 255 }).notNull().unique(),
		passwordHash: varchar("password_hash", { length: 255 }).notNull(),
		name: varchar("name", { length: 255 }).notNull(),
		role: text("role", { enum: ["admin", "staff"] })
			.default("staff")
			.notNull(),
		lastLoginAt: timestamp("last_login_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [uniqueIndex("users_email_idx").on(table.email)]
);

export const userSessions = pgTable(
	"user_sessions",
	{
		id: varchar("id", { length: 64 }).primaryKey(),
		userId: integer("user_id")
			.references(() => users.id, { onDelete: "cascade" })
			.notNull(),
		expiresAt: timestamp("expires_at").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull()
	},
	(table) => [
		index("user_sessions_user_idx").on(table.userId),
		index("user_sessions_expires_idx").on(table.expiresAt)
	]
);

export const usersRelations = relations(users, ({ many }) => ({
	sessions: many(userSessions)
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
	user: one(users, {
		fields: [userSessions.userId],
		references: [users.id]
	})
}));

// ============================================================================
// JOB QUEUE
// ============================================================================

export const jobs = pgTable(
	"jobs",
	{
		id: serial("id").primaryKey(),
		queue: varchar("queue", { length: 100 }).notNull().default("default"),
		type: varchar("type", { length: 100 }).notNull(),
		payload: jsonb("payload").notNull(),
		status: text("status", {
			enum: ["pending", "processing", "completed", "failed"]
		})
			.notNull()
			.default("pending"),
		attempts: integer("attempts").notNull().default(0),
		maxAttempts: integer("max_attempts").notNull().default(3),
		lastError: text("last_error"),
		runAt: timestamp("run_at").notNull().defaultNow(),
		startedAt: timestamp("started_at"),
		completedAt: timestamp("completed_at"),
		createdAt: timestamp("created_at").notNull().defaultNow()
	},
	(table) => [
		index("jobs_queue_run_at_idx").on(table.queue, table.runAt),
		index("jobs_status_idx").on(table.status)
	]
);
