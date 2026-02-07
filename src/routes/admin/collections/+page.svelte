<script lang="ts">
  import type { ColumnDef } from "@tanstack/table-core";
  import { DataTable, renderSnippet, renderComponent } from "$lib/components/admin/data-table";
  import { Badge } from "$lib/components/admin/ui/badge";
  import { Button, buttonVariants } from "$lib/components/admin/ui/button";
  import DeleteConfirmDialog from "$lib/components/admin/DeleteConfirmDialog.svelte";
  import { Checkbox } from "$lib/components/admin/ui/checkbox";
  import FolderOpen from "@lucide/svelte/icons/folder-open";
  import PlusIcon from "@lucide/svelte/icons/plus";

  let { data } = $props();

  let showBulkDelete = $state(false);
  let pendingDeleteIds = $state<number[]>([]);
  let bulkDeleteTable: { resetRowSelection: () => void } | null = null;

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
      accessorFn: (row) => (row.isPrivate ? "Private" : "Public"),
      id: "status",
      header: "Status",
      cell: ({ row }) =>
        renderSnippet(statusCell, {
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

{#snippet collectionCell({ name, id }: { name: string; id: number })}
  <a href="/admin/collections/{id}" class="font-medium text-foreground hover:underline">
    {name}
  </a>
{/snippet}

{#snippet statusCell({ isPrivate }: { isPrivate: boolean })}
  {#if isPrivate}
    <Badge variant="outline">Private</Badge>
  {:else}
    <Badge variant="success">Public</Badge>
  {/if}
{/snippet}

<svelte:head><title>Collections | Admin</title></svelte:head>

<div>
  <div class="mb-6 flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-foreground">Collections</h1>
    </div>
    {#if data.collections.length > 0}
      <a href="/admin/collections/new" class={buttonVariants()}>
        <PlusIcon class="h-4 w-4" /> Add Collection</a
      >
    {/if}
  </div>

  <DataTable
    data={data.collections}
    {columns}
    searchPlaceholder="Filter collections..."
    enableRowSelection={true}
    emptyIcon={FolderOpen}
    emptyTitle="No collections"
    emptyDescription="Get started by creating a new collection."
  >
    {#snippet bulkActions({ selectedRows, table })}
      <Button
        variant="destructive"
        size="sm"
        onclick={() => {
          pendingDeleteIds = selectedRows.map((r) => r.id);
          bulkDeleteTable = table;
          showBulkDelete = true;
        }}
      >
        Delete ({selectedRows.length})
      </Button>
    {/snippet}
    {#snippet emptyAction()}
      <a href="/admin/collections/new" class={buttonVariants()}>Create Collection</a>
    {/snippet}
  </DataTable>
</div>

<DeleteConfirmDialog
  bind:open={showBulkDelete}
  title="Delete selected items?"
  description="Are you sure you want to delete {pendingDeleteIds.length} selected item(s)? This action cannot be undone."
  action="?/deleteSelected"
  ondeleted={() => bulkDeleteTable?.resetRowSelection()}
>
  {#each pendingDeleteIds as id}
    <input type="hidden" name="ids" value={id} />
  {/each}
</DeleteConfirmDialog>
