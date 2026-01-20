<script lang="ts">
  let { data } = $props();

  function getTranslation(
    translations: {
      languageCode: string;
      name: string;
      slug?: string;
      description?: string | null;
    }[],
    lang: string
  ) {
    return translations.find((t) => t.languageCode === lang) ?? translations[0];
  }

  function getProductTranslation(
    translations: { languageCode: string; name: string; slug: string }[],
    lang: string
  ) {
    return translations.find((t) => t.languageCode === lang) ?? translations[0];
  }

  function getLowestPrice(variants: { price: number }[]): number {
    if (variants.length === 0) return 0;
    return Math.min(...variants.map((v) => v.price));
  }

  function formatPrice(cents: number): string {
    return (cents / 100).toFixed(2);
  }

  const collectionTrans = $derived(getTranslation(data.collection.translations, "en"));
</script>

<svelte:head>
  <title>{collectionTrans?.name ?? "Collection"}</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
  <!-- Collection Header -->
  <div class="mb-8">
    <nav class="mb-4">
      <a href="/collections" class="text-sm text-gray-500 hover:text-gray-700">
        &larr; Back to Collections
      </a>
    </nav>

    {#if data.collection.featuredAsset}
      <div class="mb-6 overflow-hidden rounded-lg">
        <img
          src="{data.collection.featuredAsset.source}?tr=w-1200,h-400,fo-auto"
          alt={collectionTrans?.name ?? "Collection"}
          class="h-48 w-full object-cover sm:h-64"
        />
      </div>
    {/if}

    <h1 class="text-3xl font-bold text-gray-900">{collectionTrans?.name ?? "Collection"}</h1>
    {#if collectionTrans?.description}
      <p class="mt-2 text-lg text-gray-600">{collectionTrans.description}</p>
    {/if}
    <p class="mt-2 text-sm text-gray-500">{data.pagination.total} products</p>
  </div>

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
      <h3 class="mt-4 text-lg font-medium text-gray-900">No products in this collection</h3>
      <p class="mt-2 text-gray-500">
        <a href="/products" class="text-blue-600 hover:text-blue-700">View all products</a>
      </p>
    </div>
  {:else}
    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {#each data.products as product}
        {@const trans = getProductTranslation(product.translations, "en")}
        {@const lowestPrice = getLowestPrice(product.variants)}
        <a
          href="/products/{trans?.slug}"
          class="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
        >
          {#if product.featuredAsset}
            <div
              class="aspect-square overflow-hidden"
              style="view-transition-name: product-image-{product.id}"
            >
              <img
                src="{product.featuredAsset.source}?tr=w-400,h-400,fo-auto"
                alt={trans?.name ?? "Product"}
                class="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </div>
          {:else}
            <div
              class="flex aspect-square items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200"
              style="view-transition-name: product-image-{product.id}"
            >
              <svg
                class="h-16 w-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          {/if}

          <div class="p-4">
            <h2 class="text-sm font-medium text-gray-900 group-hover:text-blue-600">
              {trans?.name ?? "Untitled"}
            </h2>
            <p class="mt-1 text-sm font-semibold text-gray-700">
              From {formatPrice(lowestPrice)} EUR
            </p>
          </div>
        </a>
      {/each}
    </div>

    <!-- Pagination -->
    {#if data.pagination.totalPages > 1}
      <div class="mt-8 flex items-center justify-center gap-4">
        {#if data.pagination.currentPage > 1}
          <a
            href="?page={data.pagination.currentPage - 1}"
            class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Previous
          </a>
        {/if}

        <span class="text-sm text-gray-600">
          Page {data.pagination.currentPage} of {data.pagination.totalPages}
        </span>

        {#if data.pagination.currentPage < data.pagination.totalPages}
          <a
            href="?page={data.pagination.currentPage + 1}"
            class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Next
          </a>
        {/if}
      </div>
    {/if}
  {/if}
</div>
