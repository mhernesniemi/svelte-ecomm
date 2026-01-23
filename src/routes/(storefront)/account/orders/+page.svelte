<script lang="ts">
  import { SignOutButton } from "svelte-clerk";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }

  function formatPrice(cents: number): string {
    return (cents / 100).toFixed(2);
  }

  function getStateColor(state: string): string {
    switch (state) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "paid":
        return "bg-indigo-100 text-indigo-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }
</script>

<svelte:head>
  <title>My Orders | Hoikka</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
  <div class="mb-8">
    <h1 class="text-2xl font-bold">My Account</h1>
    <p class="mt-1 text-gray-600">Manage your account settings and view your orders</p>
  </div>

  <div class="grid grid-cols-1 gap-8 md:grid-cols-4">
    <!-- Sidebar -->
    <aside class="md:col-span-1">
      <nav class="space-y-2">
        <a href="/account" class="block rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-50">
          Profile
        </a>
        <a
          href="/account/orders"
          class="block rounded-lg bg-blue-50 px-4 py-2 font-medium text-blue-600"
        >
          Order History
        </a>
        <a
          href="/account/addresses"
          class="block rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-50"
        >
          Addresses
        </a>
        <SignOutButton class="block w-full rounded-lg px-4 py-2 text-left text-gray-600 hover:bg-gray-50">
          Sign out
        </SignOutButton>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="md:col-span-3">
      <div class="rounded-lg bg-white shadow">
        <div class="border-b p-6">
          <h2 class="text-lg font-semibold">Order History</h2>
        </div>

        {#if data.orders.length === 0}
          <div class="p-6 text-center text-gray-500">
            <p>You haven't placed any orders yet.</p>
            <a href="/products" class="mt-2 inline-block text-blue-600 hover:underline">
              Start shopping
            </a>
          </div>
        {:else}
          <div class="divide-y">
            {#each data.orders as order}
              <div class="p-6">
                <div class="mb-4 flex items-center justify-between">
                  <div>
                    <p class="font-medium">Order #{order.code}</p>
                    <p class="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                  </div>
                  <span
                    class="rounded-full px-3 py-1 text-sm font-medium {getStateColor(order.state)}"
                  >
                    {order.state}
                  </span>
                </div>

                <div class="flex items-center justify-between">
                  <p class="text-gray-600">
                    Total: <span class="font-medium text-gray-900">${formatPrice(order.total)}</span
                    >
                  </p>
                  <a
                    href="/account/orders/{order.id}"
                    class="text-sm text-blue-600 hover:underline"
                  >
                    View details
                  </a>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </main>
  </div>
</div>
