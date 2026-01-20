<script lang="ts">
  import { UserProfile } from "svelte-clerk";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
  <div class="mb-8">
    <h1 class="text-2xl font-bold">My Account</h1>
    <p class="mt-1 text-gray-600">Manage your account settings and view your orders</p>
  </div>

  <div class="grid grid-cols-1 gap-8 md:grid-cols-4">
    <!-- Sidebar -->
    <aside class="md:col-span-1">
      <nav class="space-y-2">
        <a href="/account" class="block rounded-lg bg-blue-50 px-4 py-2 font-medium text-blue-600">
          Profile
        </a>
        <a href="/account/orders" class="block rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-50">
          Order History
        </a>
        <a
          href="/account/addresses"
          class="block rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-50"
        >
          Addresses
        </a>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="md:col-span-3">
      <div class="rounded-lg bg-white p-6 shadow">
        <h2 class="mb-4 text-lg font-semibold">Profile Settings</h2>
        <UserProfile routing="path" path="/account" />
      </div>
    </main>
  </div>
</div>
