---
sidebar_position: 3
---

# Project Structure

```
src/
├── lib/
│   ├── server/
│   │   ├── db/              # Database schema & client
│   │   │   ├── index.ts     # Drizzle client
│   │   │   └── schema.ts    # Table definitions
│   │   ├── services/        # Business logic
│   │   │   ├── products.ts
│   │   │   ├── orders.ts
│   │   │   ├── cart.ts
│   │   │   ├── customers.ts
│   │   │   ├── collections.ts
│   │   │   ├── payments/    # Payment provider pattern
│   │   │   └── shipping/    # Shipping provider pattern
│   │   └── integrations/    # External system utilities
│   │       ├── queue.ts     # PostgreSQL job queue
│   │       ├── events.ts    # Event system
│   │       ├── sync.ts      # Sync runner
│   │       ├── webhooks.ts  # Webhook handlers
│   │       └── retry.ts     # Retry utility
│   ├── components/          # Shared UI components
│   └── types.ts             # TypeScript types
├── routes/
│   ├── (storefront)/        # Customer-facing store
│   │   ├── +page.svelte     # Homepage
│   │   ├── products/        # Product pages
│   │   ├── cart/            # Cart page
│   │   └── checkout/        # Checkout flow
│   ├── admin/               # Admin dashboard
│   │   ├── +layout.svelte   # Admin layout
│   │   ├── products/        # Product management
│   │   ├── orders/          # Order management
│   │   └── collections/     # Collection management
│   └── api/                 # API endpoints
│       ├── search/          # Product search
│       ├── cart/            # Cart operations
│       └── webhooks/        # Webhook handlers
```

## Key Directories

### `/src/lib/server/db`

Database schema using Drizzle ORM. All tables are defined in TypeScript.

### `/src/lib/server/services`

Business logic as singleton services. Each service handles one domain (products, orders, etc.).

### `/src/lib/server/integrations`

Utilities for external system integration - job queue, events, sync patterns.

### `/src/routes/(storefront)`

Customer-facing pages using SvelteKit's route groups.

### `/src/routes/admin`

Admin dashboard with protected routes.

### `/src/routes/api`

API endpoints for AJAX operations and webhooks.

## Architecture Overview

Hoikka follows a **service-oriented architecture** that maps to MVC concepts, adapted for SvelteKit's patterns:

### Model Layer

**`src/lib/server/db/`** - Database schema and client using Drizzle ORM. Defines data structure for products, variants, categories, orders, etc.

### Controller Layer

Split into two parts:

**1. Services (`src/lib/server/services/`)** - Business logic, reusable across routes:

```typescript
productService.getById(), .create(), .update()
categoryService.getTree(), .setProductCategories()
orderService.create(), .updateStatus()
```

**2. Route handlers (`+page.server.ts`)** - Thin controllers that wire HTTP to services:

```typescript
export const load = async ({ params }) => {
  const product = await productService.getById(id);
  return { product };
};

export const actions = {
  update: async ({ request }) => {
    await productService.update(id, data);
  }
};
```

### View Layer

**`src/routes/**/+page.svelte`** - Svelte components that receive data from load functions and render UI.

### Request Flow

```
┌─────────────────────────────────────────────────────────┐
│  REQUEST                                                │
└────────────────────────┬────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────┐
│  +page.server.ts (thin controller)                      │
│  - load() → fetch data                                  │
│  - actions → handle form submissions                    │
└────────────────────────┬────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────┐
│  services/*.ts (business logic)                         │
│  - productService, orderService, etc.                   │
│  - validation, complex operations                       │
└────────────────────────┬────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────┐
│  db/schema.ts + Drizzle ORM (model)                     │
│  - data structure, relationships                        │
└─────────────────────────────────────────────────────────┘
                         ▲
                         │ data
                         ▼
┌─────────────────────────────────────────────────────────┐
│  +page.svelte (view)                                    │
│  - renders UI with data from load()                     │
│  - forms POST to actions                                │
└─────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Services are singletons** - One instance shared across requests
2. **Route handlers are thin** - Just validate input and call services
3. **Views receive typed data** - Via `PageData` from load functions
4. **Forms use progressive enhancement** - Work without JS via `use:enhance`
