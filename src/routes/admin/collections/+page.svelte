<script lang="ts">
  import { buttonVariants } from "$lib/components/admin/ui/button";
  import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell
  } from "$lib/components/admin/ui/table";
  import FolderOpen from "@lucide/svelte/icons/folder-open";

  let { data } = $props();

  function getTranslation(
    translations: { languageCode: string; name: string; slug: string }[],
    lang: string
  ) {
    return translations.find((t) => t.languageCode === lang) ?? translations[0];
  }
</script>

<svelte:head><title>Collections | Admin</title></svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Collections</h1>
      <p class="mt-1 text-sm text-gray-600">Manage product collections with dynamic filters</p>
    </div>
    <a href="/admin/collections/new" class={buttonVariants()}>
      Create Collection
    </a>
  </div>

  {#if data.collections.length === 0}
    <div class="rounded-lg border border-dashed border-gray-300 p-12 text-center">
      <FolderOpen class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900">No collections</h3>
      <p class="mt-1 text-sm text-gray-500">Get started by creating a new collection.</p>
      <div class="mt-6">
        <a href="/admin/collections/new" class={buttonVariants()}>
          Create Collection
        </a>
      </div>
    </div>
  {:else}
    <Table>
      <TableHeader>
        <TableRow class="hover:bg-transparent">
          <TableHead>Collection</TableHead>
          <TableHead>Products</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead class="text-right">
            <span class="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {#each data.collections as collection}
          {@const translation = getTranslation(collection.translations, "en")}
          <TableRow>
            <TableCell class="whitespace-nowrap">
              <div class="flex items-center">
                <div>
                  <div class="text-sm font-medium text-gray-900">
                    {translation?.name ?? "Untitled"}
                  </div>
                  <div class="text-sm text-gray-500">
                    {collection.code}
                  </div>
                </div>
              </div>
            </TableCell>
            <TableCell class="whitespace-nowrap">
              <span class="text-sm text-gray-900">{collection.productCount} products</span>
            </TableCell>
            <TableCell class="whitespace-nowrap">
              <div class="flex gap-2">
                {#if collection.enabled}
                  <span
                    class="inline-flex rounded-full bg-green-100 px-2 text-xs leading-5 font-semibold text-green-800"
                  >
                    Enabled
                  </span>
                {:else}
                  <span
                    class="inline-flex rounded-full bg-gray-100 px-2 text-xs leading-5 font-semibold text-gray-800"
                  >
                    Disabled
                  </span>
                {/if}
                {#if collection.isPrivate}
                  <span
                    class="inline-flex rounded-full bg-yellow-100 px-2 text-xs leading-5 font-semibold text-yellow-800"
                  >
                    Private
                  </span>
                {/if}
              </div>
            </TableCell>
            <TableCell class="text-sm whitespace-nowrap text-gray-500">
              {new Date(collection.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell class="text-right text-sm font-medium whitespace-nowrap">
              <a
                href="/admin/collections/{collection.id}"
                class="text-blue-600 hover:text-blue-900"
              >
                Edit
              </a>
            </TableCell>
          </TableRow>
        {/each}
      </TableBody>
    </Table>
  {/if}
</div>
