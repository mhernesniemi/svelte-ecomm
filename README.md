# Hoikka

**Opinionated Commerce** - Lightweight but powerful e-commerce gear for SvelteKit that is truly 100% customizable and owned by you.

## Philosophy: Code Over Configuration

Hoikka takes a different approach from traditional e-commerce platforms:

| Traditional Platforms | Hoikka |
|-----------------------|--------|
| XML/YAML configuration files | TypeScript code |
| Admin panels hiding business logic | Logic in your codebase |
| Plugin systems and hooks | Just edit the code |
| External dependencies (Redis, etc.) | PostgreSQL-native solutions |

**Your code, your rules.** No black boxes, no framework abstractions to learn.

## Tech Stack

- **Framework:** SvelteKit 2 + Svelte 5
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** Clerk
- **Payments:** Stripe (provider pattern)
- **Shipping:** Posti, Matkahuolto (provider pattern)
- **Styling:** TailwindCSS 4
- **Runtime:** Bun

## Getting Started

```bash
# Install dependencies
bun install

# Set up environment variables
cp .env.example .env

# Run database migrations
bun run db:migrate

# Start development server
bun run dev
```

## Project Structure

```
src/
├── lib/
│   ├── server/
│   │   ├── db/              # Database schema & client
│   │   ├── services/        # Business logic
│   │   └── integrations/    # External system integration utilities
│   ├── components/          # Shared UI components
│   └── types.ts             # TypeScript types
├── routes/
│   ├── (storefront)/        # Customer-facing store
│   ├── admin/               # Admin dashboard
│   └── api/                 # API endpoints
```

---

## Integration Utilities

Hoikka includes PostgreSQL-native utilities for integrating external systems (ERP, PIM, etc.) without Redis, job queues, or other external dependencies.

### Key Features

- **Persistent Job Queue** - Jobs survive server restarts
- **Transactional Outbox** - Events are created atomically with business logic
- **Automatic Retry** - Failed jobs retry with exponential backoff
- **Webhook Handling** - Signature verification for Stripe, GitHub, etc.
- **Sync Patterns** - Reusable patterns for data synchronization

---

### Job Queue

PostgreSQL-backed job queue with automatic retry:

```typescript
import { enqueue, registerHandler, startWorker } from "$lib/server/integrations";

// Register a job handler
registerHandler("email.send-confirmation", async (payload) => {
  await sendEmail(payload.to, payload.subject, payload.body);
});

// Enqueue a job
await enqueue("email.send-confirmation", {
  to: "customer@example.com",
  subject: "Order Confirmed",
  body: "Your order has been confirmed."
});

// Start the worker (in hooks.server.ts)
startWorker({ queue: "default", pollInterval: 1000 });
```

#### Transactional Job Creation

Ensure jobs are only created when the transaction commits:

```typescript
import { db } from "$lib/server/db";
import { enqueueInTransaction } from "$lib/server/integrations";

await db.transaction(async (tx) => {
  // Update order
  await tx.update(orders).set({ state: "paid" }).where(eq(orders.id, orderId));

  // Job is created atomically - if transaction fails, job is not created
  await enqueueInTransaction(tx, "erp.push-order", { orderId });
});
```

#### Job Options

```typescript
await enqueue("my-job", payload, {
  queue: "high-priority",     // Queue name (default: "default")
  runAt: new Date(Date.now() + 60000),  // Delay execution
  maxAttempts: 5              // Retry attempts (default: 3)
});
```

---

### Events (Transactional Outbox)

Two modes: immediate (in-memory) or persistent (via job queue).

#### In-Memory Events (Non-Critical)

```typescript
import { events } from "$lib/server/integrations";

// Subscribe
events.on("order.paid", async ({ orderId }) => {
  console.log(`Order ${orderId} was paid`);
});

// Emit
await events.emit("order.paid", { orderId: 123 });
```

#### Persistent Events (Critical)

Events that must not be lost (e.g., ERP sync):

```typescript
import { onPersistent, emitPersistent, emitInTransaction } from "$lib/server/integrations";

// Subscribe (handler runs via job queue with retry)
onPersistent("order.paid", async ({ orderId }) => {
  await erpService.pushOrder(orderId);
});

// Emit (creates a job)
await emitPersistent("order.paid", { orderId: 123 });

// Emit within transaction (atomic with business logic)
await db.transaction(async (tx) => {
  await tx.update(orders).set({ state: "paid" }).where(eq(orders.id, orderId));
  await emitInTransaction(tx, "order.paid", { orderId });
});
```

#### Available Events

- `order.created`, `order.paid`, `order.shipped`, `order.cancelled`
- `product.created`, `product.updated`, `product.deleted`
- `customer.created`, `customer.updated`
- `inventory.low`, `sync.completed`

---

### Sync Runner

Reusable pattern for synchronizing data from external systems:

```typescript
import { runSync, registerSyncJob, scheduleSyncJob, syncIntervals } from "$lib/server/integrations";

// Define a sync job
const pimProductSync: SyncJob<PimProduct, LocalProduct> = {
  name: "pim-products",

  fetchExternal: () => pimClient.getAllProducts(),

  getExternalId: (item) => item.id,

  findLocal: async (externalId) => {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.externalId, externalId));
    return product || null;
  },

  create: async (item) => {
    await db.insert(products).values({
      externalId: item.id,
      name: item.name,
      price: item.price
    });
  },

  update: async (item, local) => {
    await db.update(products)
      .set({ name: item.name, price: item.price })
      .where(eq(products.id, local.id));
  }
};

// Run immediately
const results = await runSync(pimProductSync);
// { name: "pim-products", created: 10, updated: 45, errors: [], durationMs: 1234 }

// Or register for queue-based execution
registerSyncJob(pimProductSync);

// Schedule to run every hour
await scheduleSyncJob("pim-products", syncIntervals.hours(1));
```

---

### Webhook Handlers

Handle incoming webhooks with signature verification:

```typescript
import { createWebhookHandler, signatureVerifiers } from "$lib/server/integrations";

// src/routes/api/webhooks/erp/+server.ts
export const POST = createWebhookHandler({
  secret: process.env.ERP_WEBHOOK_SECRET,
  verifySignature: signatureVerifiers.hmacHeader("x-signature"),

  handlers: {
    "inventory.updated": async (payload) => {
      await updateStock(payload.sku, payload.quantity);
    },
    "order.shipped": async (payload) => {
      await markOrderShipped(payload.orderId);
    }
  },

  // Optional: run handlers via job queue for persistence
  persistent: true
});
```

#### Built-in Signature Verifiers

- `signatureVerifiers.stripe` - Stripe webhooks
- `signatureVerifiers.github` - GitHub webhooks
- `signatureVerifiers.hmacHeader(headerName)` - Generic HMAC-SHA256

---

### Retry Utility

Retry failed operations with exponential backoff:

```typescript
import { withRetry, isTransientError, createRetryFetch } from "$lib/server/integrations";

// Basic usage
const result = await withRetry(
  () => externalApi.createOrder(order),
  { maxAttempts: 3, delayMs: 1000 }
);

// With options
await withRetry(
  () => erpClient.pushOrder(order),
  {
    maxAttempts: 5,
    delayMs: 1000,
    backoff: true,           // Exponential backoff
    maxDelayMs: 30000,       // Cap delay at 30s
    isRetryable: isTransientError,
    onRetry: (attempt, error, delay) => {
      console.log(`Retry ${attempt}, waiting ${delay}ms`);
    }
  }
);

// Create a fetch with automatic retry
const retryFetch = createRetryFetch({ maxAttempts: 3 });
const response = await retryFetch("https://api.example.com/data");
```

---

## Complete Example: ERP Integration

```typescript
// src/lib/server/integrations/erp/index.ts
import {
  registerHandler,
  onPersistent,
  registerSyncJob,
  scheduleSyncJob,
  syncIntervals,
  withRetry,
  type SyncJob
} from "$lib/server/integrations";

// Initialize ERP client
const erpClient = new ErpClient({
  apiKey: process.env.ERP_API_KEY,
  baseUrl: process.env.ERP_BASE_URL
});

// 1. Define inventory sync job
const inventorySync: SyncJob<ErpItem, LocalVariant> = {
  name: "erp-inventory",
  fetchExternal: () => erpClient.getInventory(),
  getExternalId: (item) => item.sku,
  findLocal: (sku) => variantService.getBySku(sku),
  create: async () => { /* products managed in Hoikka */ },
  update: async (item, local) => {
    await variantService.updateStock(local.id, item.quantity);
  }
};

// 2. Register sync job
registerSyncJob(inventorySync);

// 3. Push orders to ERP when paid
onPersistent("order.paid", async ({ orderId }) => {
  const order = await orderService.getById(orderId);

  await withRetry(
    () => erpClient.createOrder({
      reference: order.code,
      items: order.lines.map(line => ({
        sku: line.sku,
        quantity: line.quantity
      }))
    }),
    { maxAttempts: 5, delayMs: 2000 }
  );
});

// 4. Initialize on server start
export async function initErpIntegration() {
  // Schedule inventory sync every hour
  await scheduleSyncJob("erp-inventory", syncIntervals.hours(1));

  console.log("ERP integration initialized");
}
```

```typescript
// src/hooks.server.ts
import { startWorker } from "$lib/server/integrations";
import { initErpIntegration } from "$lib/server/integrations/erp";

// Start job worker
startWorker();

// Initialize ERP integration
initErpIntegration();
```

---

## Why PostgreSQL for Jobs?

| Aspect | Redis/BullMQ | PostgreSQL (Hoikka) |
|--------|--------------|---------------------|
| Persistence | Requires AOF/RDB | Built-in |
| Transactions | Separate from DB | Same transaction as data |
| Infrastructure | Additional service | Already have it |
| Throughput | ~10,000 jobs/sec | ~1,000 jobs/sec |
| Complexity | More moving parts | Single database |

For most e-commerce workloads, PostgreSQL handles job queues easily. Only consider Redis if you need >1,000 jobs/second.

---

## Database Migration

After updating to include the jobs table:

```bash
bun run db:generate
bun run db:migrate
```

---

## Development

```bash
# Run development server
bun run dev

# Type checking
bun run check

# Database commands
bun run db:generate  # Generate migrations
bun run db:migrate   # Run migrations
bun run db:studio    # Open Drizzle Studio
```

## Building

```bash
# Build the library
bun run package

# Build the showcase app
bun run build

# Preview production build
bun run preview
```

## License

MIT
