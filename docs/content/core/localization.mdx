# Localization

The database schema fully supports multiple languages via separate translation tables. The UI currently operates in **English only**.

## Translation Tables

| Parent Table       | Translation Table              | Fields                        |
| ------------------ | ------------------------------ | ----------------------------- |
| `products`         | `product_translations`         | `name`, `slug`, `description` |
| `product_variants` | `product_variant_translations` | `name`                        |
| `facets`           | `facet_translations`           | `name`                        |
| `facet_values`     | `facet_value_translations`     | `name`                        |
| `collections`      | `collection_translations`      | `name`, `slug`, `description` |
| `categories`       | `category_translations`        | `name`                        |

Each translation table has a `languageCode` column (ISO 639-1, e.g. `"en"`, `"fi"`) with a unique index on `(parentId, languageCode)`.

## Service Layer

Services accept an optional `language` parameter that defaults to `"en"`:

```typescript
const products = await productService.list({ language: "en" });
```

See `src/lib/server/db/schema.ts` for the full translation table definitions.
