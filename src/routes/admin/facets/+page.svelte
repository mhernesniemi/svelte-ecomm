<script lang="ts">
  import { enhance } from "$app/forms";
  import type { ColumnDef } from "@tanstack/table-core";
  import { DataTable, renderSnippet, renderComponent } from "$lib/components/admin/data-table";
  import { Button, buttonVariants } from "$lib/components/admin/ui/button";
  import { Checkbox } from "$lib/components/admin/ui/checkbox";
  import Tag from "@lucide/svelte/icons/tag";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  type FacetRow = (typeof data.facets)[0];

  function getName(translations: { languageCode: string; name: string }[]): string {
    return translations.find((t) => t.languageCode === "en")?.name ?? "";
  }

  const columns: ColumnDef<FacetRow>[] = [
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
      accessorFn: (row) => getName(row.translations),
      id: "name",
      header: "Name",
      cell: ({ row }) =>
        renderSnippet(nameCell, {
          id: row.original.id,
          name: getName(row.original.translations)
        })
    },
    {
      accessorKey: "code",
      header: "Code"
    },
    {
      accessorFn: (row) => row.values.length,
      id: "values",
      header: "Values",
      cell: ({ row }) =>
        `${row.original.values.length} value${row.original.values.length !== 1 ? "s" : ""}`
    }
  ];
</script>

{#snippet nameCell({ id, name }: { id: number; name: string })}
  <a href="/admin/facets/{id}" class="font-medium text-gray-900 hover:text-blue-600">
    {name}
  </a>
{/snippet}

<svelte:head><title>Facets | Admin</title></svelte:head>

<div>
  <div class="mb-6 flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Facets</h1>
    </div>
    <a href="/admin/facets/new" class={buttonVariants()}><PlusIcon class="h-4 w-4" /> Add Facet</a>
  </div>

  <DataTable
    data={data.facets}
    {columns}
    searchPlaceholder="Filter facets..."
    enableRowSelection={true}
    emptyIcon={Tag}
    emptyTitle="No facets"
    emptyDescription="Get started by creating a new facet."
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
      <a href="/admin/facets/new" class={buttonVariants()}>Add Facet</a>
    {/snippet}
  </DataTable>
</div>
