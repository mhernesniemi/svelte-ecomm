# Project Overview: Hoikka

This is a **full-stack e-commerce platform** built with:

- **Framework:** SvelteKit 2.49 + Svelte 5
- **Database:** PostgreSQL with Drizzle ORM
- **Auth:** Clerk
- **Payments:** Stripe
- **Shipping:** Posti, Matkahuolto (Finnish carriers)
- **Styling:** TailwindCSS 4

## Implementation Goals

- This should be lightweight and easy to understand and maintain.

## Tools

- Use Bun everywhere when possible.

## UI Guidelines

- Use shadcn/svelte for UI components where they provide value and install a new one only if it's not available.
- No dark theme
- Use global focus styles for all interactive elements

## Key Structure

| Directory                  | Purpose                                            |
| -------------------------- | -------------------------------------------------- |
| `src/lib/server/db/`       | Database schema & client                           |
| `src/lib/server/services/` | Business logic (products, orders, customers, etc.) |
| `src/routes/(storefront)/` | Customer-facing store                              |
| `src/routes/admin/`        | Admin dashboard                                    |

## Architecture Highlights

- Service-oriented with singleton services
- Multi-language support via translation tables
- Smart Collections with facet-based filtering
- Guest carts with cookie-based tokens
- Provider pattern for payments/shipping
