<script lang="ts">
  import type { ColumnDef } from "@tanstack/table-core";
  import { DataTable, renderSnippet, renderComponent } from "$lib/components/admin/data-table";
  import { Button, buttonVariants } from "$lib/components/admin/ui/button";
  import DeleteConfirmDialog from "$lib/components/admin/DeleteConfirmDialog.svelte";
  import { Checkbox } from "$lib/components/admin/ui/checkbox";
  import FileText from "@lucide/svelte/icons/file-text";
  import type { PageData } from "./$types";
  import PlusIcon from "@lucide/svelte/icons/plus";

  let { data }: { data: PageData } = $props();

  let showBulkDelete = $state(false);
  let pendingDeleteIds = $state<number[]>([]);
  let bulkDeleteTable: { resetRowSelection: () => void } | null = null;

  type PageRow = (typeof data.pages)[0];

  function getTitle(translations: { languageCode: string; title: string }[]): string {
    return translations.find((t) => t.languageCode === "en")?.title ?? "";
  }

  function getSlug(translations: { languageCode: string; slug: string }[]): string {
    return translations.find((t) => t.languageCode === "en")?.slug ?? "";
  }

  const columns: ColumnDef<PageRow>[] = [
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
      accessorFn: (row) => getTitle(row.translations),
      id: "title",
      header: "Title",
      cell: ({ row }) =>
        renderSnippet(titleCell, {
          id: row.original.id,
          title: getTitle(row.original.translations)
        })
    },
    {
      accessorFn: (row) => getSlug(row.translations),
      id: "slug",
      header: "Slug"
    },
    {
      accessorKey: "published",
      header: "Published",
      cell: ({ row }) => renderSnippet(publishedCell, { published: row.original.published })
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString()
    }
  ];
</script>

{#snippet titleCell({ id, title }: { id: number; title: string })}
  <a href="/admin/content-pages/{id}" class="font-medium text-foreground hover:text-blue-600">
    {title || "Untitled"}
  </a>
{/snippet}

{#snippet publishedCell({ published }: { published: boolean })}
  {#if published}
    <span
      class="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800"
    >
      Published
    </span>
  {:else}
    <span class="inline-flex rounded-full bg-muted px-2 py-1 text-xs font-medium text-foreground-tertiary">
      Draft
    </span>
  {/if}
{/snippet}

<svelte:head><title>Content Pages | Admin</title></svelte:head>

<div>
  <div class="mb-6 flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-foreground">Content Pages</h1>
    </div>
    <a href="/admin/content-pages/new" class={buttonVariants()}
      ><PlusIcon class="h-4 w-4" /> Add Page</a
    >
  </div>

  <DataTable
    data={data.pages}
    {columns}
    searchPlaceholder="Filter pages..."
    enableRowSelection={true}
    emptyIcon={FileText}
    emptyTitle="No content pages"
    emptyDescription="Get started by creating a new page."
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
      <a href="/admin/content-pages/new" class={buttonVariants()}>Create Page</a>
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
