<script lang="ts">
  import { enhance } from "$app/forms";
  import { toast } from "svelte-sonner";
  import type { ColumnDef } from "@tanstack/table-core";
  import { DataTable, renderSnippet, renderComponent } from "$lib/components/admin/data-table";
  import { Badge, type BadgeVariant } from "$lib/components/admin/ui/badge";
  import { Button } from "$lib/components/admin/ui/button";
  import { Checkbox } from "$lib/components/admin/ui/checkbox";
  import type { PageData, ActionData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  type ReviewRow = (typeof data.reviews)[0];

  const statuses = ["pending", "approved", "rejected"];

  $effect(() => {
    if (form?.success) toast.success(form.message || "Success");
    if (form?.error) toast.error(form.error);
  });

  function getProductName(review: ReviewRow): string {
    return review.product.translations.find((t) => t.languageCode === "en")?.name ?? "Unknown";
  }

  function getStatusVariant(status: string): BadgeVariant {
    switch (status) {
      case "approved":
        return "success";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  }

  function formatRating(rating: number): string {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  }

  const columns: ColumnDef<ReviewRow>[] = [
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
      id: "product",
      header: "Product",
      cell: ({ row }) =>
        renderSnippet(productCell, {
          id: row.original.product.id,
          name: getProductName(row.original)
        })
    },
    {
      accessorKey: "nickname",
      header: "Nickname"
    },
    {
      accessorKey: "rating",
      header: "Rating",
      cell: ({ row }) => renderSnippet(ratingCell, { rating: row.original.rating })
    },
    {
      accessorFn: (row) => row.comment ?? "-",
      id: "comment",
      header: "Comment",
      cell: ({ row }) => renderSnippet(commentCell, { comment: row.original.comment })
    },
    {
      accessorFn: (row) => (row.isVerifiedPurchase ? "Yes" : "No"),
      id: "verified",
      header: "Verified"
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => renderSnippet(statusCell, { status: row.original.status })
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString()
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) =>
        renderSnippet(actionsCell, { id: row.original.id, status: row.original.status }),
      enableSorting: false
    }
  ];
</script>

{#snippet productCell({ id, name }: { id: number; name: string })}
  <a href="/admin/products/{id}" class="text-sm text-blue-600 hover:text-blue-800">
    {name}
  </a>
{/snippet}

{#snippet ratingCell({ rating }: { rating: number })}
  <span class="text-yellow-500">{formatRating(rating)}</span>
{/snippet}

{#snippet commentCell({ comment }: { comment: string | null })}
  <span class="block max-w-xs truncate text-gray-500">{comment ?? "-"}</span>
{/snippet}

{#snippet statusCell({ status }: { status: string })}
  <Badge variant={getStatusVariant(status)} class="capitalize">
    {status}
  </Badge>
{/snippet}

{#snippet actionsCell({ id, status }: { id: number; status: string })}
  <div class="flex justify-end gap-2">
    {#if status === "pending"}
      <form method="POST" action="?/approve" use:enhance class="inline">
        <input type="hidden" name="id" value={id} />
        <Button type="submit" size="sm" variant="outline">Approve</Button>
      </form>
      <form method="POST" action="?/reject" use:enhance class="inline">
        <input type="hidden" name="id" value={id} />
        <Button type="submit" size="sm" variant="outline">Reject</Button>
      </form>
    {/if}
  </div>
{/snippet}

<svelte:head><title>Reviews | Admin</title></svelte:head>

<div>
  <h1 class="mb-8 text-2xl font-bold">Reviews</h1>

  <!-- Status Filter -->
  <div class="mb-6 flex flex-wrap gap-2">
    <a
      href="/admin/reviews"
      class="rounded-full px-3 py-1 text-sm {!data.currentStatus
        ? 'bg-blue-600 text-white'
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
    >
      All
    </a>
    {#each statuses as status}
      <a
        href="/admin/reviews?status={status}"
        class="rounded-full px-3 py-1 text-sm capitalize {data.currentStatus === status
          ? 'bg-blue-600 text-white'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
      >
        {status}
      </a>
    {/each}
  </div>

  <DataTable
    data={data.reviews}
    {columns}
    searchPlaceholder="Search reviews..."
    enableRowSelection={true}
  >
    {#snippet bulkActions({ selectedRows, table })}
      <div class="flex gap-2">
        <form
          method="POST"
          action="?/bulkApprove"
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
            Approve ({selectedRows.length})
          </Button>
        </form>
        <form
          method="POST"
          action="?/bulkReject"
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
            Reject ({selectedRows.length})
          </Button>
        </form>
        <form
          method="POST"
          action="?/bulkDelete"
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
      </div>
    {/snippet}
  </DataTable>
</div>
