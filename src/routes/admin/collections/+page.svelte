<script lang="ts">
  import { enhance } from "$app/forms";
  import type { ColumnDef } from "@tanstack/table-core";
  import { DataTable, renderSnippet, renderComponent } from "$lib/components/admin/data-table";
  import { Badge } from "$lib/components/admin/ui/badge";
  import { Button, buttonVariants } from "$lib/components/admin/ui/button";
  import { Checkbox } from "$lib/components/admin/ui/checkbox";
  import FolderOpen from "@lucide/svelte/icons/folder-open";
  import type { PageData } from "./$types";

  let { data } = $props();

  type CollectionRow = (typeof data.collections)[0];

  function getTranslation(
    translations: { languageCode: string; name: string; slug: string }[],
    lang: string
  ) {
    return translations.find((t) => t.languageCode === lang) ?? translations[0];
  }

  const columns: ColumnDef<CollectionRow>[] = [
    {
      id: "select",
      header: ({ table }) =>
        renderComponent(Checkbox, {
          checked: table.getIsAllPageRowsSelected(),
          indeterminate: table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected(),
          onCheckedChange: (value: boolean) => table.toggleAllPageRowsSelected(!!value),
          "aria-label": "Select all"
        }),
      cell: ({ row }) =>
        renderComponent(Checkbox, {
          checked: row.getIsSelected(),
          onCheckedChange: (value: boolean) => row.toggleSelected(!!value),
          "aria-label": "Select row"
        }),
      enableSorting: false
    },
    {
      accessorFn: (row) => getTranslation(row.translations, "en")?.name ?? "Untitled",
      id: "name",
      header: "Collection",
      cell: ({ row }) =>
        renderSnippet(collectionCell, {
          name: getTranslation(row.original.translations, "en")?.name ?? "Untitled",
          code: row.original.code,
          id: row.original.id
        })
    },
    {
      accessorFn: (row) => row.productCount,
      id: "productCount",
      header: "Products",
      cell: ({ row }) => `${row.original.productCount} products`
    },
    {
      accessorFn: (row) => (row.enabled ? "Enabled" : "Disabled"),
      id: "status",
      header: "Status",
      cell: ({ row }) =>
        renderSnippet(statusCell, {
          enabled: row.original.enabled,
          isPrivate: row.original.isPrivate
        })
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString()
    }
  ];
</script>

{#snippet collectionCell({ name, code, id }: { name: string; code: string; id: number })}
  <a href="/admin/collections/{id}" class="block">
    <div class="text-sm font-medium text-gray-900">{name}</div>
    <div class="text-sm text-gray-500">{code}</div>
  </a>
{/snippet}

{#snippet statusCell({ enabled, isPrivate }: { enabled: boolean; isPrivate: boolean })}
  <div class="flex gap-2">
    {#if enabled}
      <Badge variant="success">Enabled</Badge>
    {:else}
      <Badge variant="secondary">Disabled</Badge>
    {/if}
    {#if isPrivate}
      <Badge variant="outline">Private</Badge>
    {/if}
  </div>
{/snippet}

<svelte:head><title>Collections | Admin</title></svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Collections</h1>
      <p class="mt-1 text-sm text-gray-600">Manage product collections with dynamic filters</p>
    </div>
    <a href="/admin/collections/new" class={buttonVariants()}>Create Collection</a>
  </div>

  <DataTable
    data={data.collections}
    {columns}
    searchPlaceholder="Search collections..."
    enableRowSelection={true}
    emptyIcon={FolderOpen}
    emptyTitle="No collections"
    emptyDescription="Get started by creating a new collection."
  >
    {#snippet bulkActions({ selectedRows, table })}
      <form
        method="POST"
        action="?/deleteSelected"
        use:enhance={() => {
          return async ({ update }) => {
            table.resetRowSelection();
            await update();
          };
        }}
      >
        {#each selectedRows as row}
          <input type="hidden" name="ids" value={row.id} />
        {/each}
        <Button type="submit" variant="destructive" size="sm">
          Delete ({selectedRows.length})
        </Button>
      </form>
    {/snippet}
    {#snippet emptyAction()}
      <a href="/admin/collections/new" class={buttonVariants()}>Create Collection</a>
    {/snippet}
  </DataTable>
</div>
