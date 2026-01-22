<script lang="ts">
  import * as Card from "$lib/components/admin/ui/card";
  import { Badge } from "$lib/components/admin/ui/badge";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<div>
  <h1 class="mb-8 text-2xl font-bold">Dashboard</h1>

  <!-- Stats Grid -->
  <div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
    <Card.Root class="p-6">
      <h3 class="text-sm font-medium text-gray-500">Total Products</h3>
      <p class="text-3xl font-bold text-gray-900">{data.stats.totalProducts}</p>
    </Card.Root>
    <Card.Root class="p-6">
      <h3 class="text-sm font-medium text-gray-500">Total Orders</h3>
      <p class="text-3xl font-bold text-gray-900">{data.stats.totalOrders}</p>
    </Card.Root>
    <Card.Root class="p-6">
      <h3 class="text-sm font-medium text-gray-500">Total Customers</h3>
      <p class="text-3xl font-bold text-gray-900">{data.stats.totalCustomers}</p>
    </Card.Root>
  </div>

  <!-- Recent Orders -->
  <div class="rounded-lg bg-white shadow">
    <div class="border-b px-6 py-4">
      <h2 class="text-lg font-semibold">Recent Orders</h2>
    </div>
    <div class="divide-y">
      {#if data.recentOrders.length === 0}
        <div class="p-6 text-center text-gray-500">No orders yet</div>
      {:else}
        {#each data.recentOrders as order}
          <div class="flex items-center justify-between px-6 py-4">
            <div>
              <p class="font-medium">{order.code}</p>
              <p class="text-sm text-gray-500">
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div class="text-right">
              <p class="font-medium">{(order.total / 100).toFixed(2)} {order.currencyCode}</p>
              <Badge
                variant={order.state === "paid"
                  ? "success"
                  : order.state === "created"
                    ? "secondary"
                    : order.state === "shipped"
                      ? "default"
                      : "warning"}
              >
                {order.state}
              </Badge>
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </div>

</div>
