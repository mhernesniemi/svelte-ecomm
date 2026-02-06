<script lang="ts">
  import { enhance } from "$app/forms";
  import type { ColumnDef } from "@tanstack/table-core";
  import { DataTable, renderSnippet, renderComponent } from "$lib/components/admin/data-table";
  import { Button } from "$lib/components/admin/ui/button";
  import { Checkbox } from "$lib/components/admin/ui/checkbox";
  import Tag from "@lucide/svelte/icons/tag";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let showCreate = $state(false);

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
    <Button type="button" onclick={() => (showCreate = !showCreate)}>Add Facet</Button>
  </div>

  <!-- Create Facet Form -->
  {#if showCreate}
    <div class="rounded-lg border border-gray-200 bg-white p-6">
      <h2 class="mb-4 text-sm font-semibold text-gray-900">New Facet</h2>
      <form
        method="POST"
        action="?/create"
        use:enhance={() => {
          return async ({ update }) => {
            await update();
            showCreate = false;
          };
        }}
      >
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label for="facet_name_en" class="mb-1 block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              id="facet_name_en"
              name="name_en"
              placeholder="e.g., Color"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label for="facet_code" class="mb-1 block text-sm font-medium text-gray-700">
              Code
            </label>
            <input
              type="text"
              id="facet_code"
              name="code"
              placeholder="e.g., color"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onclick={() => (showCreate = false)}>
            Cancel
          </Button>
          <Button type="submit" size="sm">Create</Button>
        </div>
      </form>
    </div>
  {/if}

  <DataTable
    data={data.facets}
    {columns}
    searchPlaceholder="Search facets..."
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
      <Button type="button" onclick={() => (showCreate = true)}>Add Facet</Button>
    {/snippet}
  </DataTable>
</div>
