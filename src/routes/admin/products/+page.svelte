<script lang="ts">
  import { enhance } from "$app/forms";
  import type { ColumnDef } from "@tanstack/table-core";
  import { DataTable, renderSnippet, renderComponent } from "$lib/components/admin/data-table";
  import { Badge } from "$lib/components/admin/ui/badge";
  import { Button, buttonVariants } from "$lib/components/admin/ui/button";
  import { Checkbox } from "$lib/components/admin/ui/checkbox";
  import Package from "@lucide/svelte/icons/package";
  import ImageIcon from "@lucide/svelte/icons/image";
  import type { PageData } from "./$types";
  import PlusIcon from "@lucide/svelte/icons/plus";

  let { data }: { data: PageData } = $props();

  type ProductRow = (typeof data.products)[0];

  function getProductName(product: ProductRow): string {
    return product.translations.find((t) => t.languageCode === "en")?.name ?? "Untitled";
  }

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
      accessorFn: (row) => getProductName(row),
      id: "name",
      header: "Product",
      cell: ({ row }) =>
        renderSnippet(productCell, {
          name: getProductName(row.original),
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
  <a href="/admin/products/{id}" class="group flex items-center">
    {#if image}
      <img src={image} alt="" class="mr-3 h-10 w-10 rounded object-cover" />
    {:else}
      <div class="mr-3 flex h-10 w-10 items-center justify-center rounded bg-gray-200">
        <ImageIcon class="h-5 w-5 text-gray-400" />
      </div>
    {/if}
    <div>
      <p class="font-medium text-gray-900 group-hover:text-blue-600">{name}</p>
    </div>
  </a>
{/snippet}

{#snippet statusCell({ visibility }: { visibility: string })}
  <Badge
    variant={visibility === "public"
      ? "success"
      : visibility === "private"
        ? "outline"
        : "secondary"}
  >
    {visibility === "public" ? "Public" : visibility === "private" ? "Private" : "Hidden"}
  </Badge>
{/snippet}

<svelte:head><title>Products | Admin</title></svelte:head>

<div>
  <div class="mb-6 flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Products</h1>
    </div>
    <a href="/admin/products/new" class={buttonVariants()}
      ><PlusIcon class="h-4 w-4" /> Add Product</a
    >
  </div>

  <DataTable
    data={data.products}
    {columns}
    searchPlaceholder="Search products..."
    enableRowSelection={true}
    emptyIcon={Package}
    emptyTitle="No products"
    emptyDescription="Get started by creating a new product."
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
      <a href="/admin/products/new" class={buttonVariants()}>Add Product</a>
    {/snippet}
  </DataTable>
</div>
