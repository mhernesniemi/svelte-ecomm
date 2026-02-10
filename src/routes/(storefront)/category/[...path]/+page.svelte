<script lang="ts">
  import type { PageData } from "./$types";
  import { getTranslation } from "$lib/utils";
  import Package from "@lucide/svelte/icons/package";
  import ProductCard from "$lib/components/storefront/ProductCard.svelte";

  let { data }: { data: PageData } = $props();

  function getName(translations: { languageCode: string; name: string }[]): string {
    return getTranslation(translations)?.name ?? "";
  }

  function buildCategoryPath(breadcrumbs: typeof data.breadcrumbs, upToIndex: number): string {
    return (
      "/category/" +
      breadcrumbs
        .slice(0, upToIndex + 1)
        .map((b) => b.slug)
        .join("/")
    );
  }
</script>

<svelte:head>
  <title>{getName(data.category.translations)} | Hoikka</title>
  <meta
    name="description"
    content="Browse {getName(
      data.category.translations
    )} products. Find the best selection at Hoikka."
  />
  <meta property="og:title" content="{getName(data.category.translations)} | Hoikka" />
  <meta
    property="og:description"
    content="Browse {getName(
      data.category.translations
    )} products. Find the best selection at Hoikka."
  />
  <meta property="og:type" content="website" />
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
  <!-- Breadcrumbs -->
  <nav class="mb-6">
    <ol class="flex items-center gap-2 text-sm">
      <li>
        <a href="/" class="text-gray-500 hover:text-gray-700">Home</a>
      </li>
      {#each data.breadcrumbs as crumb, index}
        <li class="flex items-center gap-2">
          <span class="text-gray-400">/</span>
          {#if index === data.breadcrumbs.length - 1}
            <span class="font-medium text-gray-900">{crumb.name}</span>
          {:else}
            <a
              href={buildCategoryPath(data.breadcrumbs, index)}
              class="text-gray-500 hover:text-gray-700"
            >
              {crumb.name}
            </a>
          {/if}
        </li>
      {/each}
    </ol>
  </nav>

  <!-- Category Header -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900">{getName(data.category.translations)}</h1>
    {#if data.pagination.total > 0}
      <p class="mt-2 text-sm text-gray-600">{data.pagination.total} products</p>
    {/if}
  </div>

  <!-- Subcategories -->
  {#if data.children.length > 0}
    <div class="mb-8">
      <h2 class="mb-4 text-lg font-semibold text-gray-900">Subcategories</h2>
      <div class="flex flex-wrap gap-3">
        {#each data.children as child}
          <a
            href="/category/{data.breadcrumbs.map((b) => b.slug).join('/')}/{child.slug}"
            class="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
          >
            {getName(child.translations)}
          </a>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Products Grid -->
  {#if data.products.length === 0}
    <div class="py-16 text-center">
      <Package class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-4 text-lg font-medium text-gray-900">No products in this category</h3>
      <p class="mt-2 text-gray-500">
        {#if data.children.length > 0}
          Browse the subcategories above to find products.
        {:else}
          <a href="/products" class="text-blue-600 hover:text-blue-700">View all products</a>
        {/if}
      </p>
    </div>
  {:else}
    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {#each data.products as product}
        {#if product}
          <ProductCard {product} activeDiscounts={data.activeDiscounts} />
        {/if}
      {/each}
    </div>

    <!-- Pagination -->
    {#if data.pagination.totalPages > 1}
      <div class="mt-8 flex items-center justify-center gap-4">
        {#if data.pagination.page > 1}
          <a
            href="?page={data.pagination.page - 1}"
            class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Previous
          </a>
        {/if}

        <span class="text-sm text-gray-600">
          Page {data.pagination.page} of {data.pagination.totalPages}
        </span>

        {#if data.pagination.page < data.pagination.totalPages}
          <a
            href="?page={data.pagination.page + 1}"
            class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Next
          </a>
        {/if}
      </div>
    {/if}
  {/if}
</div>
