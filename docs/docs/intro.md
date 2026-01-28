---
slug: /
sidebar_position: 1
---

# Introduction

**Hoikka** is a lightweight e-commerce platform for SvelteKit that is 100% customizable and owned by you.

## Philosophy: Code Over Configuration

Hoikka follows the principles outlined in the [Rails Doctrine](https://rubyonrails.org/doctrine)—adapted for the modern TypeScript ecosystem.

| Traditional Platforms     | Hoikka                      |
| ------------------------- | --------------------------- |
| XML/YAML configuration    | TypeScript code             |
| Admin panels hiding logic | Logic in your codebase      |
| Plugin systems and hooks  | Just edit the code          |
| External dependencies     | PostgreSQL-native solutions |

## Tech Stack

- **Framework:** SvelteKit 2 + Svelte 5
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** Clerk
- **Payments:** Stripe (provider pattern)
- **Shipping:** Posti, Matkahuolto (provider pattern)
- **Styling:** TailwindCSS 4
- **Runtime:** Bun

## Key Features

- **Service-oriented architecture** - Clean separation of business logic
- **Provider pattern** - Easily swap payment and shipping providers
- **Multi-language support** - Built-in translation tables
- **Smart Collections** - Facet-based product filtering
- **Guest checkout** - Cookie-based cart tokens
- **PostgreSQL job queue** - No Redis needed
- **Transactional events** - Reliable event-driven integrations

## Quick Start

```bash
# Install dependencies
bun install

# Set up environment
cp .env.example .env

# Run migrations
bun run db:migrate

# Start dev server
bun run dev
```
