<script lang="ts">
  import { enhance } from "$app/forms";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let showCreateForm = $state(false);

  function formatPrice(cents: number): string {
    return (cents / 100).toFixed(2);
  }
</script>

<div>
  <div class="mb-8 flex items-center justify-between">
    <h1 class="text-2xl font-bold">Promotions</h1>
    <button
      type="button"
      onclick={() => (showCreateForm = !showCreateForm)}
      class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
    >
      Add Promotion
    </button>
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
          <button
            type="button"
            onclick={() => (showCreateForm = false)}
            class="rounded-lg border px-4 py-2"
          >
            Cancel
          </button>
          <button type="submit" class="rounded-lg bg-blue-600 px-4 py-2 text-white">
            Create Promotion
          </button>
        </div>
      </form>
    </div>
  {/if}

  <!-- Promotions Table -->
  <div class="overflow-hidden rounded-lg bg-white shadow">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Order</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
          <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200 bg-white">
        {#if data.promotions.length === 0}
          <tr>
            <td colspan="6" class="px-6 py-12 text-center text-gray-500"> No promotions yet </td>
          </tr>
        {:else}
          {#each data.promotions as promo}
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 font-mono font-medium">{promo.code}</td>
              <td class="px-6 py-4 text-sm">
                {#if promo.discountType === "percentage"}
                  {promo.discountValue}%
                {:else}
                  {formatPrice(promo.discountValue)} EUR
                {/if}
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">
                {promo.minOrderAmount ? `${formatPrice(promo.minOrderAmount)} EUR` : "-"}
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">
                {promo.usageCount}{promo.usageLimit ? ` / ${promo.usageLimit}` : ""}
              </td>
              <td class="px-6 py-4">
                <span
                  class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {promo.enabled
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'}"
                >
                  {promo.enabled ? "Active" : "Inactive"}
                </span>
              </td>
              <td class="px-6 py-4 text-right text-sm">
                <form method="POST" action="?/toggle" use:enhance class="inline">
                  <input type="hidden" name="id" value={promo.id} />
                  <input type="hidden" name="enabled" value={!promo.enabled} />
                  <button type="submit" class="mr-3 text-blue-600 hover:text-blue-800">
                    {promo.enabled ? "Disable" : "Enable"}
                  </button>
                </form>
                <form method="POST" action="?/delete" use:enhance class="inline">
                  <input type="hidden" name="id" value={promo.id} />
                  <button type="submit" class="text-red-600 hover:text-red-800"> Delete </button>
                </form>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>
