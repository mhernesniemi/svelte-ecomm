<script lang="ts">
  import { Badge } from "$lib/components/admin/ui/badge";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  function getProductName(product: (typeof data.products)[0]): string {
    const enTrans = product.translations.find((t) => t.languageCode === "en");
    return enTrans?.name ?? "Untitled";
  }
</script>

<div>
  <div class="mb-8 flex items-center justify-between">
    <h1 class="text-2xl font-bold">Products</h1>
    <a
      href="/admin/products/new"
      class="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
    >
      Add Product
    </a>
  </div>

  <div class="overflow-hidden rounded-lg bg-white shadow">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th
            class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
          >
            Product
          </th>
          <th
            class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
          >
            Variants
          </th>
          <th
            class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
          >
            Status
          </th>
          <th
            class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
          >
            Created
          </th>
          <th
            class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
          >
            Actions
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200 bg-white">
        {#if data.products.length === 0}
          <tr>
            <td colspan="5" class="px-6 py-12 text-center text-gray-500">
              No products yet. <a href="/admin/products/new" class="text-blue-600 hover:underline"
                >Create your first product</a
              >
            </td>
          </tr>
        {:else}
          {#each data.products as product}
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4">
                <div class="flex items-center">
                  {#if product.featuredAsset}
                    <img
                      src={product.featuredAsset.preview ?? product.featuredAsset.source}
                      alt=""
                      class="mr-3 h-10 w-10 rounded object-cover"
                    />
                  {:else}
                    <div
                      class="mr-3 flex h-10 w-10 items-center justify-center rounded bg-gray-200"
                    >
                      <svg
                        class="h-5 w-5 text-gray-400"
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
                  <div>
                    <p class="font-medium text-gray-900">{getProductName(product)}</p>
                    <p class="text-sm text-gray-500">ID: {product.id}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">
                {product.variants.length} variant{product.variants.length !== 1 ? "s" : ""}
              </td>
              <td class="px-6 py-4">
                <Badge variant={product.enabled ? "success" : "secondary"}>
                  {product.enabled ? "Active" : "Disabled"}
                </Badge>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">
                {new Date(product.createdAt).toLocaleDateString()}
              </td>
              <td class="px-6 py-4 text-right text-sm font-medium">
                <a href="/admin/products/{product.id}" class="text-blue-600 hover:text-blue-900">
                  Edit
                </a>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>

    <!-- Pagination -->
    {#if data.pagination.total > data.pagination.limit}
      <div class="flex items-center justify-between border-t bg-gray-50 px-6 py-3">
        <div class="text-sm text-gray-500">
          Showing {data.pagination.offset + 1} to {Math.min(
            data.pagination.offset + data.pagination.limit,
            data.pagination.total
          )} of {data.pagination.total} products
        </div>
        <div class="flex gap-2">
          {#if data.currentPage > 1}
            <a
              href="?page={data.currentPage - 1}"
              class="rounded border px-3 py-1 text-sm hover:bg-gray-100"
            >
              Previous
            </a>
          {/if}
          {#if data.pagination.hasMore}
            <a
              href="?page={data.currentPage + 1}"
              class="rounded border px-3 py-1 text-sm hover:bg-gray-100"
            >
              Next
            </a>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>
