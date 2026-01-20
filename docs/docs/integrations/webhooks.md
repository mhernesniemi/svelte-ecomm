---
sidebar_position: 5
---

# Webhooks

Handle incoming webhooks from external systems with signature verification.

## Creating a Webhook Handler

```typescript
// src/routes/api/webhooks/erp/+server.ts
import { createWebhookHandler, signatureVerifiers } from "$lib/server/integrations";

export const POST = createWebhookHandler({
	secret: process.env.ERP_WEBHOOK_SECRET,
	verifySignature: signatureVerifiers.hmacHeader("x-signature"),

	handlers: {
		"inventory.updated": async (payload) => {
			await updateStock(payload.sku, payload.quantity);
		},
		"order.shipped": async (payload) => {
			await markOrderShipped(payload.orderId, payload.trackingNumber);
		}
	}
});
```

## Signature Verifiers

### HMAC Header (Generic)

```typescript
signatureVerifiers.hmacHeader("x-webhook-signature");
signatureVerifiers.hmacHeader("x-signature", "sha256="); // with prefix
```

### Stripe

```typescript
signatureVerifiers.stripe;
// Uses stripe-signature header
```

### GitHub

```typescript
signatureVerifiers.github;
// Uses x-hub-signature-256 header
```

## Persistent Handlers

Run handlers via job queue for reliability:

```typescript
export const POST = createWebhookHandler({
	// ...
	persistent: true, // Handlers run via queue
	queue: "webhooks" // Queue name (default: 'webhooks')
});
```

## Custom Event Type Extraction

```typescript
export const POST = createWebhookHandler({
  // Extract event type from payload
  getEventType: (payload) => payload.type,  // default: payload.event

  handlers: { ... }
});
```

## Response Behavior

| Scenario             | Response                    |
| -------------------- | --------------------------- |
| Invalid JSON         | 400 Bad Request             |
| Invalid signature    | 401 Unauthorized            |
| No handler for event | 200 OK (event acknowledged) |
| Handler success      | 200 OK                      |
| Handler error        | 500 Internal Server Error   |

## Manual Verification

```typescript
import { verifyHmacSha256 } from "$lib/server/integrations";

const isValid = verifyHmacSha256(
	requestBody,
	signatureHeader,
	secret,
	"sha256=" // optional prefix
);
```
