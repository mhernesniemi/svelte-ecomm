<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  function getName(translations: { languageCode: string; name: string }[]): string {
    return translations.find((t) => t.languageCode === "en")?.name ?? "";
  }

  function getProductName(product: (typeof data.products)[0]): string {
    return product?.translations?.find((t) => t.languageCode === "en")?.name ?? "Untitled";
  }

  function getProductSlug(product: (typeof data.products)[0]): string {
    return product?.translations?.find((t) => t.languageCode === "en")?.slug ?? "";
  }

  function getLowestPrice(product: (typeof data.products)[0]): number | null {
    if (!product?.variants?.length) return null;
    return Math.min(...product.variants.map((v) => v.price));
  }

  function buildCategoryPath(breadcrumbs: typeof data.breadcrumbs, upToIndex: number): string {
    return "/category/" + breadcrumbs.slice(0, upToIndex + 1).map((b) => b.slug).join("/");
  }
</script>

<svelte:head>
  <title>{getName(data.category.translations)} | Hoikka</title>
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
            <a href={buildCategoryPath(data.breadcrumbs, index)} class="text-gray-500 hover:text-gray-700">
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
      <svg
        class="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      </svg>
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
          <a
            href="/products/{getProductSlug(product)}"
            class="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            <div
              class="aspect-square overflow-hidden bg-gray-100"
              style="view-transition-name: product-image-{product.id}"
            >
              {#if product.featuredAsset}
                <img
                  src="{product.featuredAsset.source}?tr=w-400,h-400,fo-auto"
                  alt={getProductName(product)}
                  class="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              {:else}
                <div class="flex h-full items-center justify-center text-gray-400">
                  <svg class="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              {/if}
            </div>
            <div class="p-4">
              <h3 class="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                {getProductName(product)}
              </h3>
              {#if getLowestPrice(product) !== null}
                <p class="mt-1 text-sm font-semibold text-gray-700">
                  From {(getLowestPrice(product)! / 100).toFixed(2)} EUR
                </p>
              {/if}
            </div>
          </a>
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
