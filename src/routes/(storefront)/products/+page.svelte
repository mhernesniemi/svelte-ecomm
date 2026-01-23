<script lang="ts">
  import { page } from "$app/stores";
  import { Input } from "$lib/components/storefront/ui/input";
  import { Button } from "$lib/components/storefront/ui/button";
  import { formatPrice } from "$lib/utils";
  import type { PageData } from "./$types";
  import Check from "@lucide/svelte/icons/check";
  import ImageIcon from "@lucide/svelte/icons/image";

  let { data }: { data: PageData } = $props();

  const pageTitle = $derived(data.search ? `Search: ${data.search} | Hoikka` : "Products | Hoikka");

  function getProductName(product: (typeof data.products)[0]): string {
    return product.translations.find((t) => t.languageCode === "en")?.name ?? "Untitled";
  }

  function getProductSlug(product: (typeof data.products)[0]): string {
    return product.translations.find((t) => t.languageCode === "en")?.slug ?? "";
  }

  function getLowestPrice(product: (typeof data.products)[0]): number | null {
    if (product.variants.length === 0) return null;
    return Math.min(...product.variants.map((v) => v.price));
  }

  function getFacetName(facet: (typeof data.facets)[0]): string {
    return facet.translations.find((t) => t.languageCode === "en")?.name ?? facet.code;
  }

  function isFilterActive(facetCode: string, valueCode: string): boolean {
    return data.activeFilters[facetCode]?.includes(valueCode) ?? false;
  }

  function getFilterUrl(facetCode: string, valueCode: string, add: boolean): string {
    const params = new URLSearchParams($page.url.searchParams);

    if (add) {
      params.append(`facet_${facetCode}`, valueCode);
    } else {
      // Remove this specific value
      const values = params.getAll(`facet_${facetCode}`).filter((v) => v !== valueCode);
      params.delete(`facet_${facetCode}`);
      values.forEach((v) => params.append(`facet_${facetCode}`, v));
    }

    // Reset to page 1 when changing filters
    params.delete("page");

    const paramString = params.toString();
    return paramString ? `?${paramString}` : "/products";
  }

  function clearAllFilters(): string {
    const params = new URLSearchParams();
    if (data.search) {
      params.set("q", data.search);
    }
    const paramString = params.toString();
    return paramString ? `?${paramString}` : "/products";
  }

  const hasActiveFilters = $derived(Object.keys(data.activeFilters).length > 0);
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta
    name="description"
    content="Browse our collection of products. Filter by category, brand, and more."
  />
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
  <h1 class="mb-8 text-2xl font-bold">Products</h1>

  <div class="flex gap-8">
    <!-- Sidebar Filters -->
    <aside class="w-64 flex-shrink-0">
      <!-- Search -->
      <form method="GET" class="mb-6">
        <Input type="text" name="q" value={data.search ?? ""} placeholder="Search products..." />
      </form>

      {#if hasActiveFilters}
        <div class="mb-6">
          <a href={clearAllFilters()} class="text-sm text-blue-600 hover:underline">
            Clear all filters
          </a>
        </div>
      {/if}

      <!-- Facet Filters -->
      {#each data.facets as facet}
        {@const counts = data.facetCounts[facet.code] ?? []}
        {#if counts.length > 0}
          <div class="mb-6">
            <h3 class="mb-3 font-semibold">{getFacetName(facet)}</h3>
            <div class="space-y-2">
              {#each counts as value}
                {@const active = isFilterActive(facet.code, value.code)}
                <a
                  href={getFilterUrl(facet.code, value.code, !active)}
                  class="flex items-center justify-between text-sm {active
                    ? 'font-medium text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'}"
                >
                  <span class="flex items-center gap-2">
                    <span
                      class="flex h-4 w-4 items-center justify-center rounded border {active
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-gray-300'}"
                    >
                      {#if active}
                        <Check class="h-3 w-3 text-white" />
                      {/if}
                    </span>
                    {value.name}
                  </span>
                  <span class="text-gray-400">({value.count})</span>
                </a>
              {/each}
            </div>
          </div>
        {/if}
      {/each}
    </aside>

    <!-- Products Grid -->
    <div class="flex-1">
      {#if data.products.length === 0}
        <div class="py-12 text-center text-gray-500">
          <p>No products found matching your criteria.</p>
          {#if hasActiveFilters}
            <a href={clearAllFilters()} class="mt-2 inline-block text-blue-600 hover:underline">
              Clear filters
            </a>
          {/if}
        </div>
      {:else}
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {#each data.products as product}
            <a
              href="/products/{product.id}/{getProductSlug(product)}"
              class="group overflow-hidden rounded-lg border border-gray-300 bg-white transition-shadow hover:shadow-lg"
            >
              <div
                class="relative aspect-square bg-gray-100"
                style="view-transition-name: product-image-{product.id}"
              >
                {#if product.featuredAsset}
                  <img
                    src="{product.featuredAsset.source}?tr=w-400,h-400,fo-auto"
                    alt={getProductName(product)}
                    class="h-full w-full object-cover"
                  />
                {:else}
                  <div class="flex h-full w-full items-center justify-center text-gray-400">
                    <ImageIcon class="h-12 w-12" />
                  </div>
                {/if}
              </div>
              <div class="p-4">
                <h3 class="font-medium transition-colors group-hover:text-blue-600">
                  {getProductName(product)}
                </h3>
                {#if getLowestPrice(product) !== null}
                  <p class="mt-1 text-gray-600">
                    From {formatPrice(getLowestPrice(product)!)}
                  </p>
                {/if}
              </div>
            </a>
          {/each}
        </div>

        <!-- Pagination -->
        {#if data.pagination.total > data.pagination.limit}
          <div class="mt-8 flex justify-center gap-2">
            {#if data.currentPage > 1}
              <a
                href="?page={data.currentPage - 1}"
                class="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
              >
                Previous
              </a>
            {/if}
            <span class="px-4 py-2 text-gray-500">
              Page {data.currentPage} of {Math.ceil(data.pagination.total / data.pagination.limit)}
            </span>
            {#if data.pagination.hasMore}
              <a
                href="?page={data.currentPage + 1}"
                class="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
              >
                Next
              </a>
            {/if}
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>
