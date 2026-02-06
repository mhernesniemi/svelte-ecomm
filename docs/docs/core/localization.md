# Localization

This document explains the localization architecture in Hoikka and how to add multi-language support.

## Current State

The UI currently operates in **English only**, but the database schema fully supports multiple languages. This design allows easy addition of localization in the future without database migrations.

## Database Schema

All translatable entities use a separate translation table pattern:

### Translation Tables

| Parent Table       | Translation Table              | Fields                        |
| ------------------ | ------------------------------ | ----------------------------- |
| `products`         | `product_translations`         | `name`, `slug`, `description` |
| `product_variants` | `product_variant_translations` | `name`                        |
| `facets`           | `facet_translations`           | `name`                        |
| `facet_values`     | `facet_value_translations`     | `name`                        |
| `collections`      | `collection_translations`      | `name`, `slug`, `description` |
| `categories`       | `category_translations`        | `name`                        |

### Schema Pattern

Each translation table follows this pattern:

```typescript
export const productTranslations = pgTable(
	"product_translations",
	{
		id: serial("id").primaryKey(),
		productId: integer("product_id")
			.references(() => products.id, { onDelete: "cascade" })
			.notNull(),
		languageCode: varchar("language_code", { length: 10 }).notNull(),
		name: varchar("name", { length: 255 }).notNull(),
		slug: varchar("slug", { length: 255 }).notNull(),
		description: text("description")
	},
	(table) => [
		// Ensures only one translation per language per entity
		uniqueIndex("product_translations_product_lang_idx").on(
			table.productId,
			table.languageCode
		),
		index("product_translations_slug_idx").on(table.slug)
	]
);
```

Key points:

- `languageCode` uses ISO 639-1 codes (e.g., "en", "fi", "sv")
- Unique index prevents duplicate translations for same language
- `onDelete: cascade` ensures translations are deleted with parent entity
- Slugs are indexed separately for URL lookups

## Service Layer

Services accept an optional `language` parameter that defaults to `"en"`:

```typescript
// In ProductService
private defaultLanguage = "en";

async list(options: ProductListOptions = {}) {
  const { language = this.defaultLanguage, ... } = options;
  // Query with language filter
}
```

## Adding Multi-Language Support

To re-enable localization, follow these steps:

### 1. Add Language Configuration

Create `src/lib/config/languages.ts`:

```typescript
export const SUPPORTED_LANGUAGES = ["en", "fi"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
	en: "English",
	fi: "Suomi"
};
```

### 2. Add Language Detection

Update `src/routes/(storefront)/+layout.server.ts`:

```typescript
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from "$lib/config/languages";

export const load = async ({ cookies, request }) => {
	// Check cookie first
	let language = cookies.get("language");

	// Fall back to Accept-Language header
	if (!language) {
		const acceptLanguage = request.headers.get("accept-language");
		language = parseAcceptLanguage(acceptLanguage, SUPPORTED_LANGUAGES);
	}

	return {
		language: language || DEFAULT_LANGUAGE
	};
};
```

### 3. Add Language Switcher Component

Create `src/lib/components/storefront/LanguageSwitcher.svelte`:

```svelte
<script lang="ts">
	import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES } from "$lib/config/languages";

	let { currentLanguage } = $props();

	async function setLanguage(lang: string) {
		document.cookie = `language=${lang};path=/;max-age=31536000`;
		window.location.reload();
	}
</script>

<select onchange={(e) => setLanguage(e.currentTarget.value)}>
	{#each SUPPORTED_LANGUAGES as lang}
		<option value={lang} selected={lang === currentLanguage}>
			{LANGUAGE_NAMES[lang]}
		</option>
	{/each}
</select>
```

### 4. Update Admin Forms

Re-add language tabs to admin forms. Example for product form:

```svelte
<script lang="ts">
	import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES } from "$lib/config/languages";

	let activeTab = $state<string>("en");
</script>

<!-- Language Tabs -->
<div class="flex border-b">
	{#each SUPPORTED_LANGUAGES as lang}
		<button type="button" onclick={() => (activeTab = lang)} class:active={activeTab === lang}>
			{LANGUAGE_NAMES[lang]}
		</button>
	{/each}
</div>

<!-- Fields for each language -->
{#each SUPPORTED_LANGUAGES as lang}
	<div class:hidden={activeTab !== lang}>
		<input name="name_{lang}" required={lang === "en"} />
		<input name="slug_{lang}" required={lang === "en"} />
		<textarea name="description_{lang}" />
	</div>
{/each}
```

### 5. Update Server Handlers

Process all language fields in form handlers:

```typescript
import { SUPPORTED_LANGUAGES } from "$lib/config/languages";

export const actions = {
  default: async ({ request }) => {
    const formData = await request.formData();

    const translations = SUPPORTED_LANGUAGES.map(lang => ({
      languageCode: lang,
      name: formData.get(`name_${lang}`) as string ||
            formData.get("name_en") as string, // Fallback to English
      slug: formData.get(`slug_${lang}`) as string ||
            formData.get("slug_en") as string,
      description: formData.get(`description_${lang}`) as string || undefined
    })).filter(t => t.name); // Only include languages with content

    await productService.create({ translations, ... });
  }
};
```

### 6. Pass Language to Services

Update storefront routes to pass the current language:

```typescript
// +page.server.ts
export const load = async ({ parent }) => {
	const { language } = await parent();

	const products = await productService.list({ language });

	return { products };
};
```

### 7. Update Storefront Components

Access translations by language:

```svelte
<script lang="ts">
	let { product, language } = $props();

	const translation = $derived(
		product.translations.find((t) => t.languageCode === language) ??
			product.translations.find((t) => t.languageCode === "en") ??
			product.translations[0]
	);
</script>

<h1>{translation?.name}</h1><p>{@html translation?.description}</p>
```

## SEO Considerations

For multi-language SEO:

1. Add `hreflang` tags to `<head>`:

```svelte
<svelte:head>
	{#each SUPPORTED_LANGUAGES as lang}
		<link
			rel="alternate"
			hreflang={lang}
			href="{baseUrl}/{lang}/products/{product.id}/{getSlug(product, lang)}"
		/>
	{/each}
	<link
		rel="alternate"
		hreflang="x-default"
		href="{baseUrl}/products/{product.id}/{englishSlug}"
	/>
</svelte:head>
```

2. Consider URL structure options:
    - Subdomain: `fi.example.com/products/...`
    - Path prefix: `example.com/fi/products/...`
    - Query parameter: `example.com/products/...?lang=fi`

The path prefix approach is recommended for most cases.

## Testing Localization

When testing multi-language support:

1. Verify all translation tables have data for each language
2. Test fallback to English when translation is missing
3. Test language detection from browser headers
4. Test language persistence via cookie
5. Verify SEO tags are correct for each language
6. Test admin form validation (English required, others optional)
