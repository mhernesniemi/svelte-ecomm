# Hoikka

**Opinionated Commerce** - Lightweight but powerful e-commerce gear for SvelteKit that is truly 100% customizable and owned by you.

## Philosophy: Code Over Configuration

| Traditional Platforms               | Hoikka                      |
| ----------------------------------- | --------------------------- |
| XML/YAML configuration files        | TypeScript code             |
| Admin panels hiding business logic  | Logic in your codebase      |
| Plugin systems and hooks            | Just edit the code          |
| External dependencies (Redis, etc.) | PostgreSQL-native solutions |

**Your code, your rules.** No black boxes, no framework abstractions to learn.

## Tech Stack

- **Framework:** SvelteKit 2 + Svelte 5
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** Clerk
- **Payments:** Stripe (provider pattern)
- **Shipping:** Posti, Matkahuolto (provider pattern)
- **Images:** ImageKit
- **Styling:** TailwindCSS 4
- **Runtime:** Bun
- **Deployment:** Vercel (serverless)

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
│   ├── remote/              # RPC functions (server code callable from client)
│   ├── components/          # Shared UI components
│   └── types.ts             # TypeScript types
├── routes/
│   ├── (storefront)/        # Customer-facing store
│   ├── admin/               # Admin dashboard
│   └── api/                 # API endpoints
```

## Development

```bash
bun run dev           # Development server
bun run check         # Type checking
bun run db:generate   # Generate migrations
bun run db:migrate    # Run migrations
bun run db:studio     # Open Drizzle Studio
```

See `ARCHITECTURE.md` for how the codebase is structured and `docs/` for full documentation.

## License

MIT
