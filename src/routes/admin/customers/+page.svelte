<script lang="ts">
  import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell
  } from "$lib/components/admin/ui/table";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<div>
  <h1 class="mb-8 text-2xl font-bold">Customers</h1>

  <Table>
    <TableHeader>
      <TableRow class="hover:bg-transparent">
        <TableHead>Customer</TableHead>
        <TableHead>Email</TableHead>
        <TableHead>Phone</TableHead>
        <TableHead>Joined</TableHead>
        <TableHead class="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {#if data.customers.length === 0}
        <TableRow class="hover:bg-transparent">
          <TableCell colspan={5} class="py-12 text-center text-gray-500">No customers yet</TableCell
          >
        </TableRow>
      {:else}
        {#each data.customers as customer}
          <TableRow>
            <TableCell>
              <a
                href="/admin/customers/{customer.id}"
                class="font-medium text-blue-600 hover:text-blue-800"
              >
                {customer.firstName}
                {customer.lastName}
              </a>
            </TableCell>
            <TableCell class="text-sm text-gray-500">{customer.email}</TableCell>
            <TableCell class="text-sm text-gray-500">{customer.phone ?? "-"}</TableCell>
            <TableCell class="text-sm text-gray-500">
              {new Date(customer.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell class="text-right text-sm">
              <a
                href="/admin/customers/{customer.id}"
                class="font-medium text-blue-600 hover:text-blue-800"
              >
                View
              </a>
            </TableCell>
          </TableRow>
        {/each}
      {/if}
    </TableBody>
  </Table>

  {#if data.pagination.total > data.pagination.limit}
    <div class="mt-4 flex items-center justify-between rounded-lg bg-white px-6 py-3 shadow">
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
            class="rounded border border-gray-200 px-3 py-1 text-sm hover:bg-gray-100"
          >
            Previous
          </a>
        {/if}
        {#if data.pagination.hasMore}
          <a
            href="?page={data.currentPage + 1}"
            class="rounded border border-gray-200 px-3 py-1 text-sm hover:bg-gray-100"
          >
            Next
          </a>
        {/if}
      </div>
    </div>
  {/if}
</div>
