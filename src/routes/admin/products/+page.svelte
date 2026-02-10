<script lang="ts">
  import { enhance } from "$app/forms";
  import type { ColumnDef } from "@tanstack/table-core";
  import { DataTable, renderSnippet, renderComponent } from "$lib/components/admin/data-table";
  import { Badge } from "$lib/components/admin/ui/badge";
  import { Button, buttonVariants } from "$lib/components/admin/ui/button";
  import DeleteConfirmDialog from "$lib/components/admin/DeleteConfirmDialog.svelte";
  import { Checkbox } from "$lib/components/admin/ui/checkbox";
  import Package from "@lucide/svelte/icons/package";
  import ImageIcon from "@lucide/svelte/icons/image";
  import { toast } from "svelte-sonner";
  import type { PageData, ActionData } from "./$types";
  import PlusIcon from "@lucide/svelte/icons/plus";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  $effect(() => {
    if (form?.success) toast.success(form.message || "Success");
    if (form?.error) toast.error(form.error);
  });

  let showBulkDelete = $state(false);
  let pendingDeleteIds = $state<number[]>([]);
  let bulkDeleteTable: { resetRowSelection: () => void } | null = null;

  type ProductRow = (typeof data.products)[0];

  const columns: ColumnDef<ProductRow>[] = [
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
      accessorFn: (row) => row.name,
      id: "name",
      header: "Product",
      cell: ({ row }) =>
        renderSnippet(productCell, {
          name: row.original.name,
          id: row.original.id,
          image: row.original.featuredAsset?.preview ?? row.original.featuredAsset?.source ?? null
        })
    },
    {
      accessorFn: (row) => row.variants.length,
      id: "variants",
      header: "Variants",
      cell: ({ row }) =>
        `${row.original.variants.length} variant${row.original.variants.length !== 1 ? "s" : ""}`
    },
    {
      accessorKey: "visibility",
      header: "Status",
      cell: ({ row }) => renderSnippet(statusCell, { visibility: row.original.visibility })
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString()
    }
  ];
</script>

{#snippet productCell({ name, id, image }: { name: string; id: number; image: string | null })}
  <a href="/admin/products/{id}" class="group inline-flex items-center">
    {#if image}
      <img src={image} alt="" class="mr-3 h-10 w-10 rounded object-cover" />
    {:else}
      <div class="mr-3 flex h-10 w-10 items-center justify-center rounded bg-muted-strong">
        <ImageIcon class="h-5 w-5 text-placeholder" />
      </div>
    {/if}
    <span class="font-medium text-foreground group-hover:underline">
      {name}
    </span>
  </a>
{/snippet}

{#snippet statusCell({ visibility }: { visibility: string })}
  <Badge
    variant={visibility === "public" ? "success" : visibility === "private" ? "warning" : "outline"}
  >
    {visibility === "public" ? "Public" : visibility === "private" ? "Private" : "Draft"}
  </Badge>
{/snippet}

<svelte:head><title>Products | Admin</title></svelte:head>

<div>
  <div class="mb-6 flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-foreground">Products</h1>
    </div>
    {#if data.products.length > 0}
      <a href="/admin/products/new" class={buttonVariants()}
        ><PlusIcon class="h-4 w-4" /> Add Product</a
      >
    {/if}
  </div>

  <DataTable
    data={data.products}
    {columns}
    searchPlaceholder="Filter products..."
    enableRowSelection={true}
    emptyIcon={Package}
    emptyTitle="No products"
    emptyDescription="Get started by creating a new product."
  >
    {#snippet bulkActions({ selectedRows, table })}
      <div class="flex gap-2">
        <form
          method="POST"
          action="?/publish"
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
          <Button type="submit" variant="outline" size="sm">
            Publish ({selectedRows.length})
          </Button>
        </form>
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
      </div>
    {/snippet}
    {#snippet emptyAction()}
      <a href="/admin/products/new" class={buttonVariants()}>Add Product</a>
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
