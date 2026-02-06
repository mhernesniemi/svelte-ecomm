<script lang="ts">
  import Package from "@lucide/svelte/icons/package";
  import ProductCard from "$lib/components/storefront/ProductCard.svelte";
  import { stripHtml } from "$lib/utils";

  let { data } = $props();

  type CollectionTranslation = {
    languageCode: string;
    name: string;
    slug?: string;
    description?: string | null;
  };

  function getTranslation(translations: CollectionTranslation[], lang: string) {
    return (
      translations.find((t: CollectionTranslation) => t.languageCode === lang) ?? translations[0]
    );
  }

  const collectionTrans = $derived(getTranslation(data.collection.translations, "en"));
</script>

<svelte:head>
  <title>{collectionTrans?.name ?? "Collection"} | Hoikka</title>
  <meta
    name="description"
    content={stripHtml(collectionTrans?.description)?.slice(0, 160) ||
      `Browse our ${collectionTrans?.name} collection.`}
  />
  <meta property="og:title" content="{collectionTrans?.name ?? 'Collection'} | Hoikka" />
  <meta
    property="og:description"
    content={stripHtml(collectionTrans?.description)?.slice(0, 160) ||
      `Browse our ${collectionTrans?.name} collection.`}
  />
  <meta property="og:type" content="website" />
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
  <!-- Collection Header -->
  <div class="mb-8">
    <nav class="mb-4">
      <a href="/collections" class="text-sm text-gray-500 hover:text-gray-700">
        &larr; Back to Collections
      </a>
    </nav>

    <h1 class="text-3xl font-bold text-gray-900">{collectionTrans?.name ?? "Collection"}</h1>
    {#if collectionTrans?.description}
      <div class="prose prose-lg mt-2 max-w-none prose-gray">
        {@html collectionTrans.description}
      </div>
    {/if}
    <p class="mt-2 text-sm text-gray-500">{data.pagination.total} products</p>
  </div>

  <!-- Products Grid -->
  {#if data.products.length === 0}
    <div class="py-16 text-center">
      <Package class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-4 text-lg font-medium text-gray-900">No products in this collection</h3>
      <p class="mt-2 text-gray-500">
        <a href="/products" class="text-blue-600 hover:text-blue-700">View all products</a>
      </p>
    </div>
  {:else}
    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {#each data.products as product}
        <ProductCard {product} activeDiscounts={data.activeDiscounts} />
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
