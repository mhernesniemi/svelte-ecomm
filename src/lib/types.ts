/**
 * TypeScript types for the commerce platform
 * These types are inferred from the Drizzle schema for end-to-end type safety
 */
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type {
	products,
	productTranslations,
	productVariants,
	productVariantTranslations,
	facets,
	facetTranslations,
	facetValues,
	facetValueTranslations,
	assets,
	customers,
	addresses,
	orders,
	orderLines,
	payments,
	paymentMethods,
	promotions,
	shippingMethods,
	orderShipping,
	collections,
	collectionTranslations,
	collectionFilters
} from "$lib/server/db/schema.js";

// ============================================================================
// PRODUCT TYPES
// ============================================================================

export type Product = InferSelectModel<typeof products>;
export type NewProduct = InferInsertModel<typeof products>;

export type ProductTranslation = InferSelectModel<typeof productTranslations>;
export type NewProductTranslation = InferInsertModel<typeof productTranslations>;

export type ProductVariant = InferSelectModel<typeof productVariants>;
export type NewProductVariant = InferInsertModel<typeof productVariants>;

export type ProductVariantTranslation = InferSelectModel<typeof productVariantTranslations>;
export type NewProductVariantTranslation = InferInsertModel<typeof productVariantTranslations>;

/** Product with translations loaded */
export interface ProductWithTranslations extends Product {
	translations: ProductTranslation[];
}

/** Product with all related data */
export interface ProductWithRelations extends Product {
	translations: ProductTranslation[];
	variants: ProductVariantWithRelations[];
	facetValues: FacetValueWithTranslations[];
	assets: Asset[];
	featuredAsset?: Asset | null;
}

/** Variant with all related data */
export interface ProductVariantWithRelations extends ProductVariant {
	translations: ProductVariantTranslation[];
	facetValues: FacetValueWithTranslations[];
	assets: Asset[];
	featuredAsset?: Asset | null;
}

// ============================================================================
// FACET TYPES
// ============================================================================

export type Facet = InferSelectModel<typeof facets>;
export type NewFacet = InferInsertModel<typeof facets>;

export type FacetTranslation = InferSelectModel<typeof facetTranslations>;
export type NewFacetTranslation = InferInsertModel<typeof facetTranslations>;

export type FacetValue = InferSelectModel<typeof facetValues>;
export type NewFacetValue = InferInsertModel<typeof facetValues>;

export type FacetValueTranslation = InferSelectModel<typeof facetValueTranslations>;
export type NewFacetValueTranslation = InferInsertModel<typeof facetValueTranslations>;

/** Facet with translations */
export interface FacetWithTranslations extends Facet {
	translations: FacetTranslation[];
}

/** Facet with all values */
export interface FacetWithValues extends FacetWithTranslations {
	values: FacetValueWithTranslations[];
}

/** Facet value with translations */
export interface FacetValueWithTranslations extends FacetValue {
	translations: FacetValueTranslation[];
}

// ============================================================================
// ASSET TYPES
// ============================================================================

export type Asset = InferSelectModel<typeof assets>;
export type NewAsset = InferInsertModel<typeof assets>;

export type AssetType = "image" | "video" | "document" | "other";

// ============================================================================
// CUSTOMER TYPES
// ============================================================================

export type Customer = InferSelectModel<typeof customers>;
export type NewCustomer = InferInsertModel<typeof customers>;

export type Address = InferSelectModel<typeof addresses>;
export type NewAddress = InferInsertModel<typeof addresses>;

/** Customer with addresses */
export interface CustomerWithAddresses extends Customer {
	addresses: Address[];
}

// ============================================================================
// ORDER TYPES
// ============================================================================

export type Order = InferSelectModel<typeof orders>;
export type NewOrder = InferInsertModel<typeof orders>;

export type OrderLine = InferSelectModel<typeof orderLines>;
export type NewOrderLine = InferInsertModel<typeof orderLines>;

export type Payment = InferSelectModel<typeof payments>;
export type NewPayment = InferInsertModel<typeof payments>;

export type PaymentMethod = InferSelectModel<typeof paymentMethods>;
export type NewPaymentMethod = InferInsertModel<typeof paymentMethods>;

/** Payment with method details */
export interface PaymentWithMethod extends Payment {
	paymentMethod: PaymentMethod;
}

/** Order states from config */
export type OrderState =
	| "created"
	| "payment_pending"
	| "paid"
	| "shipped"
	| "delivered"
	| "cancelled";

/** Payment states */
export type PaymentState = "pending" | "authorized" | "settled" | "declined" | "refunded";

/** Order with all related data */
export interface OrderWithRelations extends Order {
	lines: OrderLineWithVariant[];
	payments: Payment[];
	customer?: Customer | null;
}

/** Order line with variant info */
export interface OrderLineWithVariant extends OrderLine {
	variant?: ProductVariant | null;
}

// ============================================================================
// PROMOTION TYPES
// ============================================================================

export type Promotion = InferSelectModel<typeof promotions>;
export type NewPromotion = InferInsertModel<typeof promotions>;

export type DiscountType = "percentage" | "fixed_amount";

// ============================================================================
// SHIPPING TYPES
// ============================================================================

export type ShippingMethod = InferSelectModel<typeof shippingMethods>;
export type NewShippingMethod = InferInsertModel<typeof shippingMethods>;

export type OrderShipping = InferSelectModel<typeof orderShipping>;
export type NewOrderShipping = InferInsertModel<typeof orderShipping>;

export type ShippingStatus = "pending" | "shipped" | "in_transit" | "delivered";

/** Order with shipping info */
export interface OrderWithShipping extends Omit<OrderWithRelations, "shipping"> {
	shipping?: OrderShippingWithMethod | null;
}

/** Order shipping with method details */
export interface OrderShippingWithMethod extends OrderShipping {
	shippingMethod: ShippingMethod;
}

// ============================================================================
// COLLECTION TYPES (Smart Collections - Vendure/Shopify style)
// ============================================================================

export type Collection = InferSelectModel<typeof collections>;
export type NewCollection = InferInsertModel<typeof collections>;

export type CollectionTranslation = InferSelectModel<typeof collectionTranslations>;
export type NewCollectionTranslation = InferInsertModel<typeof collectionTranslations>;

export type CollectionFilter = InferSelectModel<typeof collectionFilters>;
export type NewCollectionFilter = InferInsertModel<typeof collectionFilters>;

/** Collection filter field types */
export type CollectionFilterField =
	| "facet" // Filter by facet values
	| "enabled" // Filter by enabled status
	| "price" // Filter by variant price
	| "stock" // Filter by variant stock
	| "product" // Manual product selection
	| "variant"; // Manual variant selection

/** Collection filter operators */
export type CollectionFilterOperator =
	| "eq" // equals
	| "in" // in array
	| "gte" // greater than or equal
	| "lte" // less than or equal
	| "gt" // greater than
	| "contains"; // contains (for facet by code)

/** Collection with translations */
export interface CollectionWithTranslations extends Collection {
	translations: CollectionTranslation[];
}

/** Collection with all related data */
export interface CollectionWithRelations extends Collection {
	translations: CollectionTranslation[];
	filters: CollectionFilter[];
	featuredAsset?: Asset | null;
}

/** Collection with product count */
export interface CollectionWithCount extends CollectionWithTranslations {
	productCount: number;
}

// ============================================================================
// FILTER & QUERY TYPES
// ============================================================================

/** Facet filter for product queries */
export interface FacetFilter {
	[facetCode: string]: string[]; // e.g., { color: ['red', 'blue'], size: ['M', 'L'] }
}

/** Product list options */
export interface ProductListOptions {
	language?: string;
	facets?: FacetFilter;
	search?: string;
	enabled?: boolean;
	limit?: number;
	offset?: number;
}

/** Facet count result */
export interface FacetCount {
	facetCode: string;
	valueCode: string;
	valueName: string;
	count: number;
}

/** Pagination info */
export interface PaginationInfo {
	total: number;
	limit: number;
	offset: number;
	hasMore: boolean;
}

/** Paginated result */
export interface PaginatedResult<T> {
	items: T[];
	pagination: PaginationInfo;
}

// ============================================================================
// INPUT TYPES (for service methods)
// ============================================================================

export interface CreateProductInput {
	enabled?: boolean;
	translations: {
		languageCode: string;
		name: string;
		slug: string;
		description?: string;
	}[];
}

export interface UpdateProductInput {
	enabled?: boolean;
	translations?: {
		languageCode: string;
		name?: string;
		slug?: string;
		description?: string;
	}[];
}

export interface CreateVariantInput {
	productId: number;
	sku: string;
	price: number;
	stock?: number;
	translations?: {
		languageCode: string;
		name?: string;
	}[];
}

export interface UpdateVariantInput {
	sku?: string;
	price?: number;
	stock?: number;
	translations?: {
		languageCode: string;
		name?: string;
	}[];
}

export interface CreateOrderInput {
	customerId?: number;
	currencyCode?: string;
}

export interface AddOrderLineInput {
	variantId: number;
	quantity: number;
}

export interface CreateCustomerInput {
	clerkUserId?: string;
	email: string;
	firstName: string;
	lastName: string;
	phone?: string;
	isAdmin?: boolean;
}

export interface CreatePromotionInput {
	code: string;
	discountType: DiscountType;
	discountValue: number;
	minOrderAmount?: number;
	usageLimit?: number;
	startsAt?: Date;
	endsAt?: Date;
}

export interface CreateCollectionInput {
	code: string;
	enabled?: boolean;
	isPrivate?: boolean;
	position?: number;
	featuredAssetId?: number;
	translations: {
		languageCode: string;
		name: string;
		slug: string;
		description?: string;
	}[];
	filters?: {
		field: CollectionFilterField;
		operator: CollectionFilterOperator;
		value: unknown;
	}[];
}

export interface UpdateCollectionInput {
	code?: string;
	enabled?: boolean;
	isPrivate?: boolean;
	position?: number;
	featuredAssetId?: number | null;
	translations?: {
		languageCode: string;
		name?: string;
		slug?: string;
		description?: string;
	}[];
}

export interface AddCollectionFilterInput {
	collectionId: number;
	field: CollectionFilterField;
	operator: CollectionFilterOperator;
	value: unknown;
}
