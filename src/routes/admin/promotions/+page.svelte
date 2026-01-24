<script lang="ts">
  import { enhance } from "$app/forms";
  import { Button } from "$lib/components/admin/ui/button";
  import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell
  } from "$lib/components/admin/ui/table";
  import type { PageData } from "./$types";
  import Gift from "@lucide/svelte/icons/gift";

  let { data }: { data: PageData } = $props();

  let showCreateForm = $state(false);

  function formatPrice(cents: number): string {
    return (cents / 100).toFixed(2);
  }
</script>

<svelte:head><title>Promotions | Admin</title></svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Promotions</h1>
      <p class="mt-1 text-sm text-gray-600">Manage discount codes and promotions</p>
    </div>
    <Button type="button" onclick={() => (showCreateForm = !showCreateForm)}>
      Add Promotion
    </Button>
  </div>

  <!-- Create Form -->
  {#if showCreateForm}
    <div class="mb-6 rounded-lg bg-white p-6 shadow">
      <h2 class="mb-4 font-semibold">Create Promotion</h2>
      <form
        method="POST"
        action="?/create"
        use:enhance={() => {
          return async ({ update }) => {
            await update();
            showCreateForm = false;
          };
        }}
      >
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label for="promo_code" class="mb-1 block text-sm font-medium text-gray-700">Code</label
            >
            <input
              type="text"
              id="promo_code"
              name="code"
              placeholder="e.g., SUMMER20"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 uppercase"
            />
          </div>
          <div>
            <label for="promo_discount_type" class="mb-1 block text-sm font-medium text-gray-700"
              >Discount Type</label
            >
            <select
              id="promo_discount_type"
              name="discountType"
              class="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed_amount">Fixed Amount (EUR)</option>
            </select>
          </div>
          <div>
            <label for="promo_value" class="mb-1 block text-sm font-medium text-gray-700"
              >Value</label
            >
            <input
              type="number"
              id="promo_value"
              name="discountValue"
              placeholder="e.g., 20"
              min="0"
              step="0.01"
              class="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label for="promo_min_order" class="mb-1 block text-sm font-medium text-gray-700"
              >Min Order (EUR)</label
            >
            <input
              type="number"
              id="promo_min_order"
              name="minOrderAmount"
              placeholder="Optional"
              min="0"
              step="0.01"
              class="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label for="promo_usage_limit" class="mb-1 block text-sm font-medium text-gray-700"
              >Usage Limit</label
            >
            <input
              type="number"
              id="promo_usage_limit"
              name="usageLimit"
              placeholder="Unlimited"
              min="0"
              class="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onclick={() => (showCreateForm = false)}>
            Cancel
          </Button>
          <Button type="submit">Create Promotion</Button>
        </div>
      </form>
    </div>
  {/if}

  {#if data.promotions.length === 0}
    <div class="rounded-lg border border-dashed border-gray-300 p-12 text-center">
      <Gift class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900">No promotions</h3>
      <p class="mt-1 text-sm text-gray-500">Get started by creating a new promotion.</p>
      <div class="mt-6">
        <Button type="button" onclick={() => (showCreateForm = true)}>
          Add Promotion
        </Button>
      </div>
    </div>
  {:else}
    <Table>
      <TableHeader>
        <TableRow class="hover:bg-transparent">
          <TableHead>Code</TableHead>
          <TableHead>Discount</TableHead>
          <TableHead>Min Order</TableHead>
          <TableHead>Usage</TableHead>
          <TableHead>Status</TableHead>
          <TableHead class="text-right">
            <span class="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {#each data.promotions as promo}
          <TableRow>
            <TableCell class="font-mono font-medium">{promo.code}</TableCell>
            <TableCell class="text-sm">
              {#if promo.discountType === "percentage"}
                {promo.discountValue}%
              {:else}
                {formatPrice(promo.discountValue)} EUR
              {/if}
            </TableCell>
            <TableCell class="text-sm text-gray-500">
              {promo.minOrderAmount ? `${formatPrice(promo.minOrderAmount)} EUR` : "-"}
            </TableCell>
            <TableCell class="text-sm text-gray-500">
              {promo.usageCount}{promo.usageLimit ? ` / ${promo.usageLimit}` : ""}
            </TableCell>
            <TableCell>
              <span
                class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {promo.enabled
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'}"
              >
                {promo.enabled ? "Active" : "Inactive"}
              </span>
            </TableCell>
            <TableCell class="text-right text-sm">
              <form method="POST" action="?/toggle" use:enhance class="inline">
                <input type="hidden" name="id" value={promo.id} />
                <input type="hidden" name="enabled" value={!promo.enabled} />
                <button type="submit" class="mr-3 text-blue-600 hover:underline">
                  {promo.enabled ? "Disable" : "Enable"}
                </button>
              </form>
              <form method="POST" action="?/delete" use:enhance class="inline">
                <input type="hidden" name="id" value={promo.id} />
                <button type="submit" class="text-red-600 hover:text-red-800">
                  Delete
                </button>
              </form>
            </TableCell>
          </TableRow>
        {/each}
      </TableBody>
    </Table>
  {/if}
</div>
