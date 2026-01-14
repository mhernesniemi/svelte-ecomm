<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<div>
  <h1 class="mb-8 text-2xl font-bold">Customers</h1>

  <div class="overflow-hidden rounded-lg bg-white shadow">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200 bg-white">
        {#if data.customers.length === 0}
          <tr>
            <td colspan="4" class="px-6 py-12 text-center text-gray-500"> No customers yet </td>
          </tr>
        {:else}
          {#each data.customers as customer}
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4">
                <p class="font-medium">{customer.firstName} {customer.lastName}</p>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">{customer.email}</td>
              <td class="px-6 py-4 text-sm text-gray-500">{customer.phone ?? "-"}</td>
              <td class="px-6 py-4 text-sm text-gray-500">
                {new Date(customer.createdAt).toLocaleDateString()}
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>

    {#if data.pagination.total > data.pagination.limit}
      <div class="flex items-center justify-between border-t bg-gray-50 px-6 py-3">
        <div class="text-sm text-gray-500">
          Showing {data.pagination.offset + 1} to {Math.min(
            data.pagination.offset + data.pagination.limit,
            data.pagination.total
          )} of {data.pagination.total}
        </div>
        <div class="flex gap-2">
          {#if data.currentPage > 1}
            <a
              href="?page={data.currentPage - 1}"
              class="rounded border px-3 py-1 text-sm hover:bg-gray-100"
            >
              Previous
            </a>
          {/if}
          {#if data.pagination.hasMore}
            <a
              href="?page={data.currentPage + 1}"
              class="rounded border px-3 py-1 text-sm hover:bg-gray-100"
            >
              Next
            </a>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>
