---
sidebar_position: 2
---

# Database

Hoikka uses PostgreSQL with Drizzle ORM. Schema is defined in TypeScript.

## Schema Location

```
src/lib/server/db/
├── index.ts      # Database client
└── schema.ts     # Table definitions
```

## Core Tables

### Products

```typescript
products
├── id: serial primary key
├── slug: varchar unique
├── featuredAssetId: integer
├── createdAt, updatedAt: timestamp

product_translations
├── id, productId, languageCode
├── name, description

product_variants
├── id, productId, sku, price, stock

product_variant_translations
├── id, variantId, languageCode, name
```

### Orders

```typescript
orders
├── id, code (unique order number)
├── customerId (nullable for guests)
├── state: created | payment_pending | paid | shipped | delivered | cancelled
├── subtotal, taxTotal, shipping, discount, total
├── currencyCode, exchangeRate
├── shippingFullName, shippingStreetLine1, shippingCity, etc.

order_lines
├── id, orderId, variantId
├── quantity, unitPrice, total

payments
├── id, orderId, paymentMethodId
├── amount, state, transactionId

order_shipping
├── id, orderId, shippingMethodId
├── price, status, trackingNumber
```

### Facets

```typescript
facets
├── id, code (e.g., "color", "size")

facet_values
├── id, facetId, code (e.g., "red", "xl")

product_facet_values (productId, facetValueId)
product_variant_facet_values (variantId, facetValueId)
```

### Jobs (Queue)

```typescript
jobs
├── id, queue, type
├── payload (jsonb)
├── status: pending | processing | completed | failed
├── attempts, maxAttempts
├── runAt, completedAt, lastError
```

## Migrations

```bash
# Generate from schema changes
bun run db:generate

# Apply migrations
bun run db:migrate

# Push directly (dev only)
bun run db:push
```

## Querying

```typescript
import { db } from "$lib/server/db";
import { products } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";

// Simple query
const product = await db.query.products.findFirst({
	where: eq(products.id, 123)
});

// With relations
const productWithVariants = await db.query.products.findFirst({
	where: eq(products.id, 123),
	with: {
		translations: true,
		variants: { with: { translations: true } }
	}
});
```
