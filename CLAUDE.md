# Hoikka

## Goals

- Keep the codebase lightweight and easy to understand.
- When adding a new feature, consider whether it is also needed in the admin panel and storefront.
- This project uses Svelte 5. Avoid outdated Svelte 4 patterns.
- Add tests where appropriate when adding a new feature or modifying existing code.

## Tools

- Use Bun APIs when possible.
- Run `./scripts/svelte-check.sh --threshold error` for type checking. This wrapper prevents the Vite dev server from crashing by preserving `.svelte-kit/generated/` timestamps that `svelte-check` would otherwise overwrite.
- After modifying files, run `bunx prettier --write <files>` on the changed files to format them.

## UI Guidelines

- Use shadcn/svelte for UI components and install new ones as needed.
- Prefer existing UI components (e.g. `<Button>` over `<button>`).
- Use `cn()` for conditional Tailwind classes.
- Use `<AdminCard>` for card sections on admin detail pages. It supports `title`, `description`, `variant` (main/sidebar), `noPadding`, `headerActions`, `headerExtra`, and `children` snippets.
