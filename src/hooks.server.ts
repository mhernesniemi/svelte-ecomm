/**
 * Server hooks for authentication, customer sync, and cart handling
 * Uses Clerk for authentication via svelte-clerk
 */
import { withClerkHandler } from "svelte-clerk/server";
import { sequence } from "@sveltejs/kit/hooks";
import type { Handle } from "@sveltejs/kit";
import { db } from "$lib/server/db/index.js";
import { customers } from "$lib/server/db/schema.js";
import { eq } from "drizzle-orm";
import { CLERK_SECRET_KEY } from "$env/static/private";
import { orderService } from "$lib/server/services/orders.js";
import { shippingService, paymentService, wishlistService } from "$lib/server/services/index.js";
import { authService } from "$lib/server/services/auth.js";

const CART_COOKIE_NAME = "cart_token";
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const WISHLIST_COOKIE_NAME = "wishlist_token";
const WISHLIST_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

const ADMIN_SESSION_COOKIE = "admin_session";

// Clerk authentication handler
const clerkHandler = withClerkHandler();

// Customer sync handler - links Clerk users to local customer records
const customerSync: Handle = async ({ event, resolve }) => {
	// Get auth from Clerk (set by clerkHandler) - auth is a function!
	const auth = event.locals.auth?.();
	const userId = auth?.userId;

	if (userId) {
		// Find customer record linked to this Clerk user
		let customer = await db.query.customers.findFirst({
			where: eq(customers.clerkUserId, userId)
		});

		if (!customer) {
			// First login - create customer record from Clerk user data
			try {
				const response = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
					headers: {
						Authorization: `Bearer ${CLERK_SECRET_KEY}`
					}
				});

				if (response.ok) {
					const clerkUser = await response.json();
					[customer] = await db
						.insert(customers)
						.values({
							clerkUserId: userId,
							email: clerkUser.email_addresses?.[0]?.email_address ?? "",
							firstName: clerkUser.first_name ?? "",
							lastName: clerkUser.last_name ?? ""
						})
						.returning();
				}
			} catch (error) {
				console.error("[hooks] Failed to sync Clerk user:", error);
			}
		}

		event.locals.customer = customer ?? null;
	} else {
		event.locals.customer = null;
	}

	return resolve(event);
};

// Cart handler - manages cart token for guest users and cart transfer on login
const cartHandler: Handle = async ({ event, resolve }) => {
	// Read cart token from cookie
	const cartToken = event.cookies.get(CART_COOKIE_NAME) ?? null;
	event.locals.cartToken = cartToken;

	// If logged-in customer has a guest cart token, transfer the cart
	if (event.locals.customer && cartToken) {
		try {
			await orderService.transferCartToCustomer(cartToken, event.locals.customer.id);
			// Clear the guest cart cookie after transfer
			event.cookies.delete(CART_COOKIE_NAME, { path: "/" });
			event.locals.cartToken = null;
		} catch (error) {
			// Transfer failed, likely no guest cart exists - ignore
		}
	}

	const response = await resolve(event);

	// If a new cart token was set during the request, set the cookie
	if (event.locals.newCartToken) {
		response.headers.append(
			"Set-Cookie",
			`${CART_COOKIE_NAME}=${event.locals.newCartToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${CART_COOKIE_MAX_AGE}`
		);
	}

	return response;
};

// Wishlist handler - manages wishlist token for guests and transfer on login
const wishlistHandler: Handle = async ({ event, resolve }) => {
	const wishlistToken = event.cookies.get(WISHLIST_COOKIE_NAME) ?? null;
	event.locals.wishlistToken = wishlistToken;

	// Transfer guest wishlist to customer on login
	if (event.locals.customer && wishlistToken) {
		try {
			await wishlistService.transferToCustomer(wishlistToken, event.locals.customer.id);
			event.cookies.delete(WISHLIST_COOKIE_NAME, { path: "/" });
			event.locals.wishlistToken = null;
		} catch {
			// Transfer failed - ignore
		}
	}

	const response = await resolve(event);

	// Set new wishlist token cookie if created
	if (event.locals.newWishlistToken) {
		response.headers.append(
			"Set-Cookie",
			`${WISHLIST_COOKIE_NAME}=${event.locals.newWishlistToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${WISHLIST_COOKIE_MAX_AGE}`
		);
	}

	return response;
};

// Shipping initialization handler - initializes default shipping methods on first startup
let shippingMethodsInitialized = false;

const shippingInit: Handle = async ({ event, resolve }) => {
	// Initialize shipping methods once on first request
	if (!shippingMethodsInitialized) {
		try {
			await shippingService.initializeDefaultMethods();
			shippingMethodsInitialized = true;
			console.log("[hooks] Shipping methods initialized");
		} catch (error) {
			console.error("[hooks] Failed to initialize shipping methods:", error);
			// Don't block requests if initialization fails
		}
	}

	return resolve(event);
};

// Payment initialization handler - initializes default payment methods on first startup
let paymentMethodsInitialized = false;

const paymentInit: Handle = async ({ event, resolve }) => {
	// Initialize payment methods once on first request
	if (!paymentMethodsInitialized) {
		try {
			await paymentService.initializeDefaultMethods();
			paymentMethodsInitialized = true;
			console.log("[hooks] Payment methods initialized");
		} catch (error) {
			console.error("[hooks] Failed to initialize payment methods:", error);
			// Don't block requests if initialization fails
		}
	}

	return resolve(event);
};

// Admin auth handler - validates admin session cookie
const adminAuth: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get(ADMIN_SESSION_COOKIE) ?? null;
	event.locals.adminSessionId = sessionId;
	event.locals.adminUser = null;

	if (sessionId) {
		const user = await authService.validateSession(sessionId);
		event.locals.adminUser = user;
	}

	return resolve(event);
};

// Combine handlers in sequence
export const handle = sequence(
	clerkHandler,
	customerSync,
	cartHandler,
	wishlistHandler,
	shippingInit,
	paymentInit,
	adminAuth
);
