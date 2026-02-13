# Hoikka

## General Guidelines

- When adding a new feature or data field, always implement it in **both** the admin panel and the storefront. For example, adding an image field to a model means updating the admin edit page, the server actions, **and** the storefront page that renders it (including relevant meta tags).
- This project uses Svelte 5. Avoid outdated Svelte 4 patterns.
- Add tests where appropriate when adding a new feature or modifying existing code.

## Tools

- Use Bun APIs when possible.
- Run `./scripts/svelte-check.sh --threshold error` for type checking. This wrapper prevents the Vite dev server from crashing by preserving `.svelte-kit/generated/` timestamps that `svelte-check` would otherwise overwrite.
- After modifying files, run `bunx prettier --write <files>` on the changed files to format them.

## UI Guidelines

- Use shadcn/svelte for UI components and install new ones as needed. The project has **two separate UI component sets**: `src/lib/components/admin/ui/` (admin panel) and `src/lib/components/storefront/ui/` (storefront). The `components.json` `ui` alias points to storefront, so `bunx shadcn-svelte@next add <component>` installs there by default. After installing, copy the component to the correct path (admin or storefront) and delete the copy you don't need.
- Prefer existing UI components (e.g. `<Button>` over `<button>`).
- Use `cn()` for conditional Tailwind classes.
- Use `<AdminCard>` for card sections on admin detail pages.
- Admin UI components that use portals (dialogs, tooltips, popovers, etc.) must portal into `[data-admin]` (e.g. `to="[data-admin]"`) so that the admin theme CSS variables are available.
