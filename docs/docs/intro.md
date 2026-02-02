---
slug: /
sidebar_position: 1
---

# Introduction

**Hoikka** is a full-stack e-commerce platform built with SvelteKit. It includes both the storefront and admin panel, sharing types and business logic in a single codebase, ready to deploy serverless on Vercel.

Hoikka follows the principles outlined in the [Rails Doctrine](https://rubyonrails.org/doctrine).

## Philosophy: Code Over Configuration

| Traditional Platforms     | Hoikka                      |
| ------------------------- | --------------------------- |
| XML/YAML configuration    | TypeScript code             |
| Admin panels hiding logic | Logic in your codebase      |
| Plugin systems and hooks  | Just edit the code          |
| External dependencies     | PostgreSQL-native solutions |

## Key Features

- **Full-stack monolith** - Storefront, admin panel, and API in one codebase
- **Service-oriented architecture** - Clean separation of business logic
- **Provider pattern** - Easily swap payment and shipping providers
- **Multi-language support** - Built-in translation tables
- **Smart Collections** - Facet-based product filtering
- **Guest checkout** - Cookie-based cart tokens
- **PostgreSQL job queue** - No Redis needed
- **Transactional events** - Reliable event-driven integrations
- **AI-agent friendly** - Simple, readable codebase optimized for AI-assisted development

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
