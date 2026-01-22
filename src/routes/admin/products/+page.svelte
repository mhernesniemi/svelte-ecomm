<script lang="ts">
  import { Badge } from "$lib/components/admin/ui/badge";
  import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell
  } from "$lib/components/admin/ui/table";
  import type { PageData } from "./$types";
  import Package from "@lucide/svelte/icons/package";
  import ImageIcon from "@lucide/svelte/icons/image";

  let { data }: { data: PageData } = $props();

  function getProductName(product: (typeof data.products)[0]): string {
    const enTrans = product.translations.find((t) => t.languageCode === "en");
    return enTrans?.name ?? "Untitled";
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Products</h1>
      <p class="mt-1 text-sm text-gray-600">Manage your product catalog</p>
    </div>
    <a
      href="/admin/products/new"
      class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
    >
      Add Product
    </a>
  </div>

  {#if data.products.length === 0}
    <div class="rounded-lg border border-dashed border-gray-300 p-12 text-center">
      <Package class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900">No products</h3>
      <p class="mt-1 text-sm text-gray-500">Get started by creating a new product.</p>
      <div class="mt-6">
        <a
          href="/admin/products/new"
          class="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add Product
        </a>
      </div>
    </div>
  {:else}
    <Table>
      <TableHeader>
        <TableRow class="hover:bg-transparent">
          <TableHead>Product</TableHead>
          <TableHead>Variants</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead class="text-right">
            <span class="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {#each data.products as product}
          <TableRow>
            <TableCell>
              <div class="flex items-center">
                {#if product.featuredAsset}
                  <img
                    src={product.featuredAsset.preview ?? product.featuredAsset.source}
                    alt=""
                    class="mr-3 h-10 w-10 rounded object-cover"
                  />
                {:else}
                  <div class="mr-3 flex h-10 w-10 items-center justify-center rounded bg-gray-200">
                    <ImageIcon class="h-5 w-5 text-gray-400" />
                  </div>
                {/if}
                <div>
                  <p class="font-medium text-gray-900">{getProductName(product)}</p>
                  <p class="text-sm text-gray-500">ID: {product.id}</p>
                </div>
              </div>
            </TableCell>
            <TableCell class="text-sm text-gray-500">
              {product.variants.length} variant{product.variants.length !== 1 ? "s" : ""}
            </TableCell>
            <TableCell>
              <Badge
                variant={product.visibility === "public"
                  ? "success"
                  : product.visibility === "private"
                    ? "outline"
                    : "secondary"}
              >
                {product.visibility === "public"
                  ? "Public"
                  : product.visibility === "private"
                    ? "Private"
                    : "Hidden"}
              </Badge>
            </TableCell>
            <TableCell class="text-sm text-gray-500">
              {new Date(product.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell class="text-right text-sm font-medium">
              <a href="/admin/products/{product.id}" class="text-blue-600 hover:text-blue-900">
                Edit
              </a>
            </TableCell>
          </TableRow>
        {/each}
      </TableBody>
    </Table>

    {#if data.pagination.total > data.pagination.limit}
      <div class="flex items-center justify-between rounded-lg bg-white px-6 py-3 shadow">
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
  {/if}
</div>
