<script lang="ts">
  import { Badge, type BadgeVariant } from "$lib/components/admin/ui/badge";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const states = ["created", "payment_pending", "paid", "shipped", "delivered", "cancelled"];

  function getStateVariant(state: string): BadgeVariant {
    switch (state) {
      case "paid":
        return "success";
      case "shipped":
        return "default";
      case "delivered":
        return "success";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  }
</script>

<div>
  <h1 class="mb-8 text-2xl font-bold">Orders</h1>

  <!-- State Filter -->
  <div class="mb-6 flex flex-wrap gap-2">
    <a
      href="/admin/orders"
      class="rounded-full px-3 py-1 text-sm {!data.currentState
        ? 'bg-blue-600 text-white'
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
    >
      All
    </a>
    {#each states as state}
      <a
        href="/admin/orders?state={state}"
        class="rounded-full px-3 py-1 text-sm capitalize {data.currentState === state
          ? 'bg-blue-600 text-white'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
      >
        {state.replace("_", " ")}
      </a>
    {/each}
  </div>

  <div class="overflow-hidden rounded-lg bg-white shadow">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
          <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200 bg-white">
        {#if data.orders.length === 0}
          <tr>
            <td colspan="6" class="px-6 py-12 text-center text-gray-500"> No orders found </td>
          </tr>
        {:else}
          {#each data.orders as order}
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4">
                <p class="font-medium">{order.code}</p>
                <p class="text-sm text-gray-500">{order.lines.length} items</p>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">
                {order.shippingFullName ?? "Guest"}
              </td>
              <td class="px-6 py-4">
                <Badge variant={getStateVariant(order.state)} class="capitalize">
                  {order.state.replace("_", " ")}
                </Badge>
              </td>
              <td class="px-6 py-4 text-sm font-medium">
                {(order.total / 100).toFixed(2)}
                {order.currencyCode}
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">
                {new Date(order.createdAt).toLocaleDateString()}
              </td>
              <td class="px-6 py-4 text-right">
                <a
                  href="/admin/orders/{order.id}"
                  class="text-sm text-blue-600 hover:text-blue-900"
                >
                  View
                </a>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>
