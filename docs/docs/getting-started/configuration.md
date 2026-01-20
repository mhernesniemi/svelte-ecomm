---
sidebar_position: 2
---

# Configuration

Hoikka uses environment variables for configuration. No XML, YAML, or admin panels needed.

## Required Variables

### Database

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/hoikka"
```

### Authentication (Clerk)

```bash
PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
```

Get these from your [Clerk Dashboard](https://dashboard.clerk.com).

### Payments (Stripe) - Optional

```bash
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

Stripe is optional for getting started. A mock payment provider is available for development and testing. When ready for production, get credentials from your [Stripe Dashboard](https://dashboard.stripe.com).

### Images (ImageKit)

```bash
IMAGEKIT_PUBLIC_KEY="public_..."
IMAGEKIT_PRIVATE_KEY="private_..."
IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/your_id"
```

Get these from your [ImageKit Dashboard](https://imagekit.io/dashboard):

1. Go to Developer Options
2. Copy Public Key, Private Key, and URL Endpoint

## Optional Variables

### Shipping Providers

```bash
# Posti (Finnish Post)
POSTI_API_KEY="..."
POSTI_API_SECRET="..."

# Matkahuolto
MATKAHUOLTO_API_KEY="..."
```

### External Integrations

```bash
# ERP Integration
ERP_BASE_URL="https://erp.example.com/api"
ERP_API_KEY="..."
ERP_WEBHOOK_SECRET="..."

# Log aggregation (Axiom, Logtail, etc.)
AXIOM_TOKEN="..."
AXIOM_DATASET="..."
```

## Development vs Production

```bash
# .env (development)
NODE_ENV="development"
DATABASE_URL="postgresql://localhost:5432/hoikka_dev"

# Production (set in your hosting platform)
NODE_ENV="production"
DATABASE_URL="postgresql://..."
```

## Type Safety

Environment variables are validated at startup. Missing required variables will throw clear errors:

```
Error: Missing required environment variable: STRIPE_SECRET_KEY
```
