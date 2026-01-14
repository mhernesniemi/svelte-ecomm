<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<div>
  <h1 class="mb-8 text-2xl font-bold">Dashboard</h1>

  <!-- Stats Grid -->
  <div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
    <div class="rounded-lg bg-white p-6 shadow">
      <h3 class="text-sm font-medium text-gray-500">Total Products</h3>
      <p class="text-3xl font-bold text-gray-900">{data.stats.totalProducts}</p>
    </div>
    <div class="rounded-lg bg-white p-6 shadow">
      <h3 class="text-sm font-medium text-gray-500">Total Orders</h3>
      <p class="text-3xl font-bold text-gray-900">{data.stats.totalOrders}</p>
    </div>
    <div class="rounded-lg bg-white p-6 shadow">
      <h3 class="text-sm font-medium text-gray-500">Total Customers</h3>
      <p class="text-3xl font-bold text-gray-900">{data.stats.totalCustomers}</p>
    </div>
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
              <span
                class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
								{order.state === 'paid'
                  ? 'bg-green-100 text-green-800'
                  : order.state === 'created'
                    ? 'bg-gray-100 text-gray-800'
                    : order.state === 'shipped'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'}"
              >
                {order.state}
              </span>
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </div>

  <!-- Quick Actions -->
  <div class="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
    <a
      href="/admin/products/new"
      class="rounded-lg bg-blue-600 p-4 text-center text-white transition-colors hover:bg-blue-700"
    >
      Add New Product
    </a>
    <a
      href="/admin/promotions"
      class="rounded-lg bg-gray-600 p-4 text-center text-white transition-colors hover:bg-gray-700"
    >
      Manage Promotions
    </a>
  </div>
</div>
