<script lang="ts">
  import { enhance } from "$app/forms";
  import type { ColumnDef } from "@tanstack/table-core";
  import { DataTable, renderSnippet, renderComponent } from "$lib/components/admin/data-table";
  import { Badge } from "$lib/components/admin/ui/badge";
  import { Button, buttonVariants } from "$lib/components/admin/ui/button";
  import { Checkbox } from "$lib/components/admin/ui/checkbox";
  import type { PageData } from "./$types";
  import Gift from "@lucide/svelte/icons/gift";

  let { data }: { data: PageData } = $props();

  type PromoRow = (typeof data.promotions)[0];

  function formatPrice(cents: number): string {
    return (cents / 100).toFixed(2);
  }

  function getPromotionStatus(promo: PromoRow) {
    if (!promo.enabled) return { label: "Disabled", variant: "secondary" as const };
    const now = new Date();
    if (promo.startsAt && promo.startsAt > now)
      return { label: "Scheduled", variant: "warning" as const };
    if (promo.endsAt && promo.endsAt < now)
      return { label: "Expired", variant: "destructive" as const };
    return { label: "Active", variant: "success" as const };
  }

  function getTypeLabel(type: string) {
    switch (type) {
      case "order":
        return "Amount off order";
      case "product":
        return "Amount off products";
      case "free_shipping":
        return "Free shipping";
      default:
        return type;
    }
  }

  function getDiscountLabel(promo: PromoRow) {
    if (promo.promotionType === "free_shipping") return "Free shipping";
    if (promo.discountType === "percentage") return `${promo.discountValue}%`;
    return `${formatPrice(promo.discountValue)} EUR`;
  }

  function formatDate(date: Date | null) {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("fi-FI", {
      day: "numeric",
      month: "numeric",
      year: "numeric"
    });
  }

  const columns: ColumnDef<PromoRow>[] = [
    {
      id: "select",
      header: ({ table }) =>
        renderComponent(Checkbox, {
          checked: table.getIsAllPageRowsSelected(),
          indeterminate:
            table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected(),
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
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) =>
        renderSnippet(codeCell, { code: row.original.code, id: row.original.id })
    },
    {
      accessorKey: "promotionType",
      header: "Type",
      cell: ({ row }) => renderSnippet(typeCell, { type: row.original.promotionType })
    },
    {
      accessorFn: (row) => getDiscountLabel(row),
      id: "discount",
      header: "Discount"
    },
    {
      accessorFn: (row) => `${formatDate(row.startsAt)} - ${formatDate(row.endsAt)}`,
      id: "dates",
      header: "Active Dates"
    },
    {
      accessorFn: (row) =>
        `${row.usageCount}${row.usageLimit ? ` / ${row.usageLimit}` : ""}`,
      id: "usage",
      header: "Usage"
    },
    {
      accessorFn: (row) => getPromotionStatus(row).label,
      id: "status",
      header: "Status",
      cell: ({ row }) => renderSnippet(statusCell, getPromotionStatus(row.original))
    }
  ];
</script>

{#snippet codeCell({ code, id }: { code: string; id: number })}
  <a href="/admin/promotions/{id}" class="font-medium text-blue-600 hover:underline">
    {code}
  </a>
{/snippet}

{#snippet typeCell({ type }: { type: string })}
  <Badge variant="outline">{getTypeLabel(type)}</Badge>
{/snippet}

{#snippet statusCell({ label, variant }: { label: string; variant: "success" | "secondary" | "warning" | "destructive" })}
  <Badge {variant}>{label}</Badge>
{/snippet}

<svelte:head><title>Promotions | Admin</title></svelte:head>

<div>
  <div class="mb-8 flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Promotions</h1>
      <p class="mt-1 text-sm text-gray-600">Manage discount codes and promotions</p>
    </div>
    <a href="/admin/promotions/new" class={buttonVariants()}>Create promotion</a>
  </div>

  <DataTable
    data={data.promotions}
    {columns}
    searchPlaceholder="Search promotions..."
    enableRowSelection={true}
    emptyIcon={Gift}
    emptyTitle="No promotions"
    emptyDescription="Get started by creating a new promotion."
  >
    {#snippet bulkActions({ selectedRows, table })}
      <form
        method="POST"
        action="?/enableSelected"
        use:enhance={() => {
          return async ({ update }) => {
            table.resetRowSelection();
            await update();
          };
        }}
        class="inline"
      >
        {#each selectedRows as row}
          <input type="hidden" name="ids" value={row.id} />
        {/each}
        <Button type="submit" variant="outline" size="sm">
          Enable ({selectedRows.length})
        </Button>
      </form>
      <form
        method="POST"
        action="?/disableSelected"
        use:enhance={() => {
          return async ({ update }) => {
            table.resetRowSelection();
            await update();
          };
        }}
        class="inline"
      >
        {#each selectedRows as row}
          <input type="hidden" name="ids" value={row.id} />
        {/each}
        <Button type="submit" variant="outline" size="sm">
          Disable ({selectedRows.length})
        </Button>
      </form>
      <form
        method="POST"
        action="?/deleteSelected"
        use:enhance={() => {
          return async ({ update }) => {
            table.resetRowSelection();
            await update();
          };
        }}
        class="inline"
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
      <a href="/admin/promotions/new" class={buttonVariants()}>Create promotion</a>
    {/snippet}
  </DataTable>
</div>
