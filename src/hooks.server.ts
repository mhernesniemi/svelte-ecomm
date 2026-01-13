/**
 * Server hooks for authentication and customer sync
 * Uses Clerk for authentication via svelte-clerk
 */
import { withClerkHandler } from 'svelte-clerk/server';
import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { customers } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';

// Clerk authentication handler
const clerkHandler = withClerkHandler();

// Customer sync handler - links Clerk users to local customer records
const customerSync: Handle = async ({ event, resolve }) => {
	// Get auth from Clerk (set by clerkHandler)
	const auth = event.locals.auth;
	const userId = auth?.userId;

	if (userId) {
		// Find customer record linked to this Clerk user
		let customer = await db.query.customers.findFirst({
			where: eq(customers.clerkUserId, userId)
		});

		if (!customer) {
			// First login - create customer record
			// Get user info from Clerk
			try {
				const response = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
					headers: {
						Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`
					}
				});

				if (response.ok) {
					const clerkUser = await response.json();
					const email = clerkUser.email_addresses?.[0]?.email_address ?? '';
					const firstName = clerkUser.first_name ?? '';
					const lastName = clerkUser.last_name ?? '';

					[customer] = await db
						.insert(customers)
						.values({
							clerkUserId: userId,
							email,
							firstName,
							lastName
						})
						.returning();
				}
			} catch (error) {
				console.error('[hooks] Failed to sync Clerk user:', error);
			}
		}

		event.locals.customer = customer ?? null;
	} else {
		event.locals.customer = null;
	}

	return resolve(event);
};

// Combine handlers in sequence
export const handle = sequence(clerkHandler, customerSync);
