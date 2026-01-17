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
