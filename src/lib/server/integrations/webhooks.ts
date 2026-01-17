/**
 * Webhook Handler Utilities
 *
 * Helpers for handling incoming webhooks from external systems.
 * Includes signature verification for common providers.
 */

import { json } from "@sveltejs/kit";
import { enqueue } from "./queue.js";

export interface WebhookConfig<TPayload = unknown> {
	/** Secret for signature verification */
	secret?: string;

	/** Custom signature verification function */
	verifySignature?: (request: Request, body: string, secret: string) => boolean | Promise<boolean>;

	/** Function to extract event type from payload (default: payload.event) */
	getEventType?: (payload: TPayload) => string;

	/** Event handlers keyed by event type */
	handlers: Record<string, (payload: TPayload) => Promise<void>>;

	/** If true, handlers run via job queue (persistent, with retry) */
	persistent?: boolean;

	/** Queue name for persistent handlers (default: "webhooks") */
	queue?: string;
}

/**
 * Create a webhook handler for SvelteKit endpoints
 */
export function createWebhookHandler<TPayload = unknown>(config: WebhookConfig<TPayload>) {
	return async ({ request }: { request: Request }) => {
		const body = await request.text();
		let payload: TPayload;

		try {
			payload = JSON.parse(body);
		} catch {
			return json({ error: "Invalid JSON" }, { status: 400 });
		}

		// Verify signature if configured
		if (config.secret && config.verifySignature) {
			const isValid = await config.verifySignature(request, body, config.secret);
			if (!isValid) {
				console.warn("[Webhook] Invalid signature");
				return json({ error: "Invalid signature" }, { status: 401 });
			}
		}

		// Get event type
		const getEventType = config.getEventType || ((p) => (p as Record<string, unknown>).event as string);
		const eventType = getEventType(payload);

		if (!eventType) {
			return json({ error: "Missing event type" }, { status: 400 });
		}

		const handler = config.handlers[eventType];

		if (!handler) {
			// Return 200 for unhandled events (common webhook pattern)
			return json({ received: true, event: eventType, handled: false });
		}

		// Run handler via queue (persistent) or immediately
		if (config.persistent) {
			await enqueue(
				`webhook.${eventType}`,
				payload as Record<string, unknown>,
				{ queue: config.queue ?? "webhooks" }
			);
			return json({ received: true, event: eventType, queued: true });
		}

		try {
			await handler(payload);
			return json({ received: true, event: eventType });
		} catch (e) {
			console.error(`[Webhook] Handler error for ${eventType}:`, e);
			return json({ error: "Handler failed" }, { status: 500 });
		}
	};
}

/**
 * Verify HMAC-SHA256 signature
 */
export function verifyHmacSha256(
	body: string,
	signature: string,
	secret: string,
	prefix = ""
): boolean {
	const hasher = new Bun.CryptoHasher("sha256", secret);
	hasher.update(body);
	const expected = prefix + hasher.digest("hex");

	// Constant-time comparison
	if (signature.length !== expected.length) return false;
	return Bun.hash(signature) === Bun.hash(expected);
}

/**
 * Pre-built signature verifiers for common services
 */
export const signatureVerifiers = {
	/**
	 * Stripe webhook signature
	 */
	stripe: (request: Request, body: string, secret: string): boolean => {
		const signature = request.headers.get("stripe-signature");
		if (!signature) return false;

		const parts = signature.split(",").reduce(
			(acc, part) => {
				const [key, value] = part.split("=");
				acc[key] = value;
				return acc;
			},
			{} as Record<string, string>
		);

		const timestamp = parts["t"];
		const sig = parts["v1"];
		if (!timestamp || !sig) return false;

		const signedPayload = `${timestamp}.${body}`;
		return verifyHmacSha256(signedPayload, sig, secret);
	},

	/**
	 * GitHub webhook signature
	 */
	github: (request: Request, body: string, secret: string): boolean => {
		const signature = request.headers.get("x-hub-signature-256");
		if (!signature) return false;
		return verifyHmacSha256(body, signature, secret, "sha256=");
	},

	/**
	 * Generic HMAC-SHA256 in header
	 */
	hmacHeader:
		(headerName: string, prefix = "") =>
		(request: Request, body: string, secret: string): boolean => {
			const signature = request.headers.get(headerName);
			if (!signature) return false;
			return verifyHmacSha256(body, signature, secret, prefix);
		}
};
