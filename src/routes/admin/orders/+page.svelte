<script lang="ts">
  import type { ColumnDef } from "@tanstack/table-core";
  import { DataTable, renderSnippet } from "$lib/components/admin/data-table";
  import { Badge, type BadgeVariant } from "$lib/components/admin/ui/badge";
  import { cn } from "$lib/utils";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  type OrderRow = (typeof data.orders)[0];

  const states = ["created", "payment_pending", "paid", "shipped", "delivered", "cancelled"];

  function getStateVariant(state: string): BadgeVariant {
    switch (state) {
      case "paid":
      case "delivered":
        return "success";
      case "shipped":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  }

  const columns: ColumnDef<OrderRow>[] = [
    {
      accessorKey: "code",
      header: "Order",
      cell: ({ row }) =>
        renderSnippet(orderCell, {
          code: row.original.code,
          itemCount: row.original.lines.length,
          id: row.original.id
        })
    },
    {
      accessorFn: (row) => row.shippingFullName ?? "Guest",
      id: "customer",
      header: "Customer"
    },
    {
      accessorKey: "state",
      header: "Status",
      cell: ({ row }) => renderSnippet(statusCell, { state: row.original.state })
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => `${(row.original.total / 100).toFixed(2)} ${row.original.currencyCode}`
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString()
    }
  ];
</script>

{#snippet orderCell({ code, itemCount, id }: { code: string; itemCount: number; id: number })}
  <a href="/admin/orders/{id}" class="group inline-block font-medium text-foreground">
    <p class="group-hover:underline">{code}</p>
    <p class="text-sm text-muted-foreground">{itemCount} items</p>
  </a>
{/snippet}

{#snippet statusCell({ state }: { state: string })}
  <Badge variant={getStateVariant(state)} class="capitalize">
    {state.replace("_", " ")}
  </Badge>
{/snippet}

<svelte:head><title>Orders | Admin</title></svelte:head>

<div>
  <h1 class="mb-8 text-2xl font-bold">Orders</h1>

  <!-- State Filter -->
  <div class="mb-6 flex flex-wrap gap-2">
    <a
      href="/admin/orders"
      class={cn(
        "rounded-full px-3 py-1 text-sm",
        !data.currentState
          ? "bg-blue-600 text-white dark:bg-blue-800"
          : "bg-muted-strong text-foreground-secondary hover:text-black dark:hover:text-white"
      )}
    >
      All
    </a>
    {#each states as state}
      <a
        href="/admin/orders?state={state}"
        class={cn(
          "rounded-full px-3 py-1 text-sm capitalize",
          data.currentState === state
            ? "bg-blue-600 text-white dark:bg-blue-800"
            : "bg-muted-strong text-foreground-secondary hover:text-black dark:hover:text-white"
        )}
      >
        {state.replace("_", " ")}
      </a>
    {/each}
  </div>

  <DataTable data={data.orders} {columns} searchPlaceholder="Filter orders..." />
</div>
