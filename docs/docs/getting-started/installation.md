---
sidebar_position: 1
---

# Installation

## Prerequisites

- [Bun](https://bun.sh) runtime (v1.0+)
- PostgreSQL 15+
- Clerk account (for authentication)
- Stripe account (for payments)

## Setup

```bash
# Clone the repository
git clone <your-repo>
cd hoikka

# Install dependencies
bun install

# Copy environment file
cp .env.example .env
```

## Environment Variables

Edit `.env` with your configuration:

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/hoikka"

# Clerk Auth
PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."

# Stripe Payments
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

## Database Setup

```bash
# Generate migrations from schema
bun run db:generate

# Apply migrations
bun run db:migrate

# (Optional) Open Drizzle Studio
bun run db:studio
```

## Start Development

```bash
bun run dev
```

Your store is now running at `http://localhost:5173`

- Storefront: `http://localhost:5173`
- Admin: `http://localhost:5173/admin`
