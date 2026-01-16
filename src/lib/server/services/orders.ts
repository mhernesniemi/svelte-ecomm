/**
 * Order Service
 * Handles order lifecycle, line items, and state transitions
 *
 * Cart Pattern (following Vendure):
 * - Orders with `active=true` are carts (can be modified)
 * - Orders with `active=false` are completed orders
 * - Guest users get a `cartToken` stored in cookies
 * - Logged-in users have carts linked to `customerId`
 */
import { eq, and, desc, sql, isNull } from "drizzle-orm";
import { db } from "../db/index.js";
import {
	orders,
	orderLines,
	orderPromotions,
	productVariants,
	productTranslations,
	productVariantTranslations,
	promotions,
	orderShipping
} from "../db/schema.js";
import type {
	Order,
	OrderWithRelations,
	OrderLine,
	CreateOrderInput,
	AddOrderLineInput,
	OrderState
} from "$lib/types.js";
import { nanoid } from "nanoid";

// Generate a secure cart token for guest users
function generateCartToken(): string {
	return nanoid(32);
}

// Valid state transitions
const STATE_TRANSITIONS: Record<OrderState, OrderState[]> = {
	created: ["payment_pending", "cancelled"],
	payment_pending: ["paid", "cancelled"],
	paid: ["shipped", "cancelled"],
	shipped: ["delivered"],
	delivered: [],
	cancelled: []
};

export class OrderService {
	/**
	 * Create a new order/cart
	 */
	async create(input: CreateOrderInput & { cartToken?: string } = {}): Promise<Order> {
		const code = this.generateOrderCode();

		const [order] = await db
			.insert(orders)
			.values({
				code,
				customerId: input.customerId ?? null,
				cartToken: input.cartToken ?? null,
				active: true,
				state: "created",
				currencyCode: input.currencyCode ?? "EUR",
				subtotal: 0,
				shipping: 0,
				discount: 0,
				total: 0
			})
			.returning();

		return order;
	}

	/**
	 * Get or create an active cart for a customer or guest
	 * Returns { order, cartToken } - cartToken is set for new guest carts
	 */
	async getOrCreateActiveCart(options: {
		customerId?: number | null;
		cartToken?: string | null;
	}): Promise<{ order: OrderWithRelations; cartToken: string | null; isNew: boolean }> {
		const { customerId, cartToken } = options;

		// Try to find existing active cart
		let order: Order | undefined;

		if (customerId) {
			// Logged-in user: find by customerId
			[order] = await db
				.select()
				.from(orders)
				.where(and(eq(orders.customerId, customerId), eq(orders.active, true)));
		} else if (cartToken) {
			// Guest user: find by cartToken
			[order] = await db
				.select()
				.from(orders)
				.where(and(eq(orders.cartToken, cartToken), eq(orders.active, true)));
		}

		if (order) {
			return {
				order: await this.loadOrderRelations(order),
				cartToken: order.cartToken,
				isNew: false
			};
		}

		// Create new cart
		const newCartToken = customerId ? null : generateCartToken();
		const newOrder = await this.create({
			customerId: customerId ?? undefined,
			cartToken: newCartToken ?? undefined
		});

		return {
			order: await this.loadOrderRelations(newOrder),
			cartToken: newCartToken,
			isNew: true
		};
	}

	/**
	 * Get active cart without creating one
	 */
	async getActiveCart(options: {
		customerId?: number | null;
		cartToken?: string | null;
	}): Promise<OrderWithRelations | null> {
		const { customerId, cartToken } = options;

		let order: Order | undefined;

		if (customerId) {
			[order] = await db
				.select()
				.from(orders)
				.where(and(eq(orders.customerId, customerId), eq(orders.active, true)));
		} else if (cartToken) {
			[order] = await db
				.select()
				.from(orders)
				.where(and(eq(orders.cartToken, cartToken), eq(orders.active, true)));
		}

		if (!order) return null;
		return this.loadOrderRelations(order);
	}

	/**
	 * Transfer guest cart to customer (on login)
	 * Merges items if customer already has an active cart
	 */
	async transferCartToCustomer(cartToken: string, customerId: number): Promise<Order | null> {
		// Get guest cart
		const [guestCart] = await db
			.select()
			.from(orders)
			.where(and(eq(orders.cartToken, cartToken), eq(orders.active, true)));

		if (!guestCart) return null;

		// Check if customer already has an active cart
		const [existingCart] = await db
			.select()
			.from(orders)
			.where(and(eq(orders.customerId, customerId), eq(orders.active, true)));

		if (existingCart) {
			// Merge guest cart items into existing cart
			const guestLines = await db
				.select()
				.from(orderLines)
				.where(eq(orderLines.orderId, guestCart.id));

			for (const line of guestLines) {
				await this.addLine(existingCart.id, {
					variantId: line.variantId,
					quantity: line.quantity
				});
			}

			// Delete the guest cart
			await db.delete(orders).where(eq(orders.id, guestCart.id));

			return existingCart;
		} else {
			// Transfer ownership of guest cart to customer
			const [updated] = await db
				.update(orders)
				.set({
					customerId,
					cartToken: null // Clear guest token
				})
				.where(eq(orders.id, guestCart.id))
				.returning();

			return updated;
		}
	}

	/**
	 * Get order by ID with all relations
	 */
	async getById(id: number): Promise<OrderWithRelations | null> {
		const [order] = await db.select().from(orders).where(eq(orders.id, id));

		if (!order) return null;

		return this.loadOrderRelations(order);
	}

	/**
	 * Get order by code
	 */
	async getByCode(code: string): Promise<OrderWithRelations | null> {
		const [order] = await db.select().from(orders).where(eq(orders.code, code));

		if (!order) return null;

		return this.loadOrderRelations(order);
	}

	/**
	 * List orders for a customer (excludes active carts by default)
	 */
	async listForCustomer(
		customerId: number,
		options: { includeActive?: boolean; limit?: number; offset?: number } = {}
	): Promise<OrderWithRelations[]> {
		const { includeActive = false, limit = 20, offset = 0 } = options;

		const conditions = [eq(orders.customerId, customerId)];
		if (!includeActive) {
			conditions.push(eq(orders.active, false));
		}

		const orderList = await db
			.select()
			.from(orders)
			.where(and(...conditions))
			.orderBy(desc(orders.createdAt))
			.limit(limit)
			.offset(offset);

		return Promise.all(orderList.map((o) => this.loadOrderRelations(o)));
	}

	/**
	 * List all orders with optional state filter
	 */
	async list(state?: OrderState, limit = 20, offset = 0): Promise<OrderWithRelations[]> {
		const conditions = state ? [eq(orders.state, state)] : [];

		const orderList = await db
			.select()
			.from(orders)
			.where(and(...conditions))
			.orderBy(desc(orders.createdAt))
			.limit(limit)
			.offset(offset);

		return Promise.all(orderList.map((o) => this.loadOrderRelations(o)));
	}

	/**
	 * Add a line item to the order (cart must be active)
	 */
	async addLine(orderId: number, input: AddOrderLineInput): Promise<OrderLine> {
		const order = await this.getById(orderId);
		if (!order) throw new Error("Order not found");
		if (!order.active) throw new Error("Cannot modify completed order");

		// Get variant with current price
		const [variant] = await db
			.select()
			.from(productVariants)
			.where(eq(productVariants.id, input.variantId));

		if (!variant) throw new Error("Variant not found");

		// Check stock availability
		const existingLine = order.lines.find((l) => l.variantId === input.variantId);
		const existingQuantity = existingLine?.quantity ?? 0;
		const totalQuantity = existingQuantity + input.quantity;

		if (totalQuantity > variant.stock) {
			throw new Error(
				`Only ${variant.stock} items available${existingQuantity > 0 ? ` (${existingQuantity} already in cart)` : ""}`
			);
		}

		// Get product name for snapshot
		const [productTrans] = await db
			.select()
			.from(productTranslations)
			.where(eq(productTranslations.productId, variant.productId))
			.limit(1);

		// Get variant name
		const [variantTrans] = await db
			.select()
			.from(productVariantTranslations)
			.where(eq(productVariantTranslations.variantId, variant.id))
			.limit(1);

		// Update existing line or create new one
		if (existingLine) {
			// Update quantity
			const newQuantity = existingLine.quantity + input.quantity;
			const [updated] = await db
				.update(orderLines)
				.set({
					quantity: newQuantity,
					lineTotal: variant.price * newQuantity
				})
				.where(eq(orderLines.id, existingLine.id))
				.returning();

			await this.recalculateTotals(orderId);
			return updated;
		}

		// Create new line
		const [line] = await db
			.insert(orderLines)
			.values({
				orderId,
				variantId: input.variantId,
				quantity: input.quantity,
				unitPrice: variant.price,
				lineTotal: variant.price * input.quantity,
				productName: productTrans?.name ?? "Unknown Product",
				variantName: variantTrans?.name ?? null,
				sku: variant.sku
			})
			.returning();

		await this.recalculateTotals(orderId);
		return line;
	}

	/**
	 * Update line quantity
	 */
	async updateLineQuantity(
		orderId: number,
		lineId: number,
		quantity: number
	): Promise<OrderLine> {
		const order = await this.getById(orderId);
		if (!order) throw new Error("Order not found");
		if (!order.active) throw new Error("Cannot modify completed order");

		if (quantity <= 0) {
			await this.removeLine(orderId, lineId);
			throw new Error("Line removed due to zero quantity");
		}

		const [line] = await db.select().from(orderLines).where(eq(orderLines.id, lineId));

		if (!line) throw new Error("Line not found");

		// Check stock availability
		const [variant] = await db
			.select()
			.from(productVariants)
			.where(eq(productVariants.id, line.variantId));

		if (variant && quantity > variant.stock) {
			throw new Error(`Only ${variant.stock} items available`);
		}

		const [updated] = await db
			.update(orderLines)
			.set({
				quantity,
				lineTotal: line.unitPrice * quantity
			})
			.where(eq(orderLines.id, lineId))
			.returning();

		await this.recalculateTotals(orderId);
		return updated;
	}

	/**
	 * Remove a line item
	 */
	async removeLine(orderId: number, lineId: number): Promise<void> {
		const order = await this.getById(orderId);
		if (!order) throw new Error("Order not found");
		if (!order.active) throw new Error("Cannot modify completed order");

		await db.delete(orderLines).where(eq(orderLines.id, lineId));
		await this.recalculateTotals(orderId);
	}

	/**
	 * Apply a promotion code
	 */
	async applyPromotion(
		orderId: number,
		code: string
	): Promise<{ success: boolean; message: string }> {
		const order = await this.getById(orderId);
		if (!order) return { success: false, message: "Order not found" };
		if (!order.active) return { success: false, message: "Cannot modify completed order" };

		// Find promotion
		const [promotion] = await db
			.select()
			.from(promotions)
			.where(and(eq(promotions.code, code), eq(promotions.enabled, true)));

		if (!promotion) return { success: false, message: "Invalid promotion code" };

		// Check usage limit
		if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
			return { success: false, message: "Promotion code has reached its usage limit" };
		}

		// Check dates
		const now = new Date();
		if (promotion.startsAt && promotion.startsAt > now) {
			return { success: false, message: "Promotion is not yet active" };
		}
		if (promotion.endsAt && promotion.endsAt < now) {
			return { success: false, message: "Promotion has expired" };
		}

		// Check minimum order amount
		if (promotion.minOrderAmount && order.subtotal < promotion.minOrderAmount) {
			return {
				success: false,
				message: `Minimum order amount of ${promotion.minOrderAmount / 100} not met`
			};
		}

		// Calculate discount
		let discountAmount = 0;
		if (promotion.discountType === "percentage") {
			discountAmount = Math.round(order.subtotal * (promotion.discountValue / 100));
		} else {
			discountAmount = Math.min(promotion.discountValue, order.subtotal);
		}

		// Apply promotion
		await db
			.insert(orderPromotions)
			.values({
				orderId,
				promotionId: promotion.id,
				discountAmount
			})
			.onConflictDoNothing();

		await this.recalculateTotals(orderId);

		return { success: true, message: `Discount of ${discountAmount / 100} applied` };
	}

	/**
	 * Remove a promotion
	 */
	async removePromotion(orderId: number, promotionId: number): Promise<void> {
		await db
			.delete(orderPromotions)
			.where(
				and(
					eq(orderPromotions.orderId, orderId),
					eq(orderPromotions.promotionId, promotionId)
				)
			);

		await this.recalculateTotals(orderId);
	}

	/**
	 * Transition order to a new state
	 */
	async transitionState(orderId: number, newState: OrderState): Promise<Order> {
		const order = await this.getById(orderId);
		if (!order) throw new Error("Order not found");

		const currentState = order.state;
		const allowedTransitions = STATE_TRANSITIONS[currentState];

		if (!allowedTransitions.includes(newState)) {
			throw new Error(`Cannot transition from ${currentState} to ${newState}`);
		}

		const updateData: Partial<Order> = {
			state: newState
		};

		// When transitioning to payment_pending, mark cart as no longer active (becomes an order)
		if (newState === "payment_pending") {
			updateData.active = false;
			if (!order.orderPlacedAt) {
				updateData.orderPlacedAt = new Date();
			}
		}

		const [updated] = await db
			.update(orders)
			.set(updateData)
			.where(eq(orders.id, orderId))
			.returning();

		// Update promotion usage counts when order is paid
		if (newState === "paid") {
			// Validate stock one final time before payment completion
			const stockCheck = await this.validateStock(orderId);
			if (!stockCheck.valid) {
				throw new Error(`Stock unavailable: ${stockCheck.errors.join(", ")}`);
			}

			const appliedPromotions = await db
				.select()
				.from(orderPromotions)
				.where(eq(orderPromotions.orderId, orderId));

			for (const op of appliedPromotions) {
				await db
					.update(promotions)
					.set({ usageCount: sql`${promotions.usageCount} + 1` })
					.where(eq(promotions.id, op.promotionId));
			}

			// Decrease stock for variants
			for (const line of order.lines) {
				await db
					.update(productVariants)
					.set({ stock: sql`${productVariants.stock} - ${line.quantity}` })
					.where(eq(productVariants.id, line.variantId));
			}
		}

		return updated;
	}

	/**
	 * Set shipping address
	 */
	async setShippingAddress(
		orderId: number,
		address: {
			fullName: string;
			streetLine1: string;
			streetLine2?: string;
			city: string;
			postalCode: string;
			country: string;
		}
	): Promise<Order> {
		const [updated] = await db
			.update(orders)
			.set({
				shippingFullName: address.fullName,
				shippingStreetLine1: address.streetLine1,
				shippingStreetLine2: address.streetLine2 ?? null,
				shippingCity: address.city,
				shippingPostalCode: address.postalCode,
				shippingCountry: address.country
			})
			.where(eq(orders.id, orderId))
			.returning();

		return updated;
	}

	/**
	 * Set customer email for order confirmations and digital delivery
	 */
	async setCustomerEmail(orderId: number, email: string): Promise<Order> {
		const [updated] = await db
			.update(orders)
			.set({ customerEmail: email })
			.where(eq(orders.id, orderId))
			.returning();

		return updated;
	}

	/**
	 * Validate stock availability for all items in the order
	 * Used before completing checkout
	 */
	async validateStock(orderId: number): Promise<{ valid: boolean; errors: string[] }> {
		const order = await this.getById(orderId);
		if (!order) return { valid: false, errors: ["Order not found"] };

		const errors: string[] = [];

		for (const line of order.lines) {
			const [variant] = await db
				.select()
				.from(productVariants)
				.where(eq(productVariants.id, line.variantId));

			if (!variant) {
				errors.push(`${line.productName} is no longer available`);
			} else if (line.quantity > variant.stock) {
				errors.push(`${line.productName}: only ${variant.stock} available`);
			}
		}

		return { valid: errors.length === 0, errors };
	}

	// ============================================================================
	// PRIVATE HELPERS
	// ============================================================================

	private async loadOrderRelations(order: Order): Promise<OrderWithRelations> {
		const lines = await db.select().from(orderLines).where(eq(orderLines.orderId, order.id));

		// Note: We're not loading full variant data here to keep it lightweight
		// The line already contains snapshot data (productName, variantName, sku)

		return {
			...order,
			lines: lines.map((l) => ({ ...l, variant: null })),
			payments: [], // Load payments separately if needed
			customer: null,
			shipping: null // Load shipping separately if needed
		};
	}

	private async recalculateTotals(orderId: number): Promise<void> {
		// Get all lines
		const lines = await db.select().from(orderLines).where(eq(orderLines.orderId, orderId));

		const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);

		// Get applied discounts
		const appliedPromotions = await db
			.select()
			.from(orderPromotions)
			.where(eq(orderPromotions.orderId, orderId));

		const discount = appliedPromotions.reduce((sum, op) => sum + op.discountAmount, 0);

		// Get shipping cost from order_shipping table
		const [shippingRecord] = await db
			.select()
			.from(orderShipping)
			.where(eq(orderShipping.orderId, orderId))
			.limit(1);
		const shipping = shippingRecord?.price ?? 0;

		const total = Math.max(0, subtotal - discount + shipping);

		await db
			.update(orders)
			.set({ subtotal, discount, shipping, total })
			.where(eq(orders.id, orderId));
	}

	private generateOrderCode(): string {
		// Generate a unique order code like "ORD-XXXXX"
		return `ORD-${nanoid(8).toUpperCase()}`;
	}
}

// Export singleton instance
export const orderService = new OrderService();
