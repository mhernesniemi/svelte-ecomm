<script lang="ts">
  import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell
  } from "$lib/components/admin/ui/table";
  import { Badge, type BadgeVariant } from "$lib/components/admin/ui/badge";
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

  function getStateVariant(state: string): BadgeVariant {
    switch (state) {
      case "delivered":
        return "success";
      case "shipped":
      case "paid":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  }
</script>

<svelte:head><title>Customer Details | Admin</title></svelte:head>

<div>
  <div class="mb-8">
    <a href="/admin/customers" class="text-sm text-blue-600 hover:underline"
      >&larr; Back to Customers</a
    >
    <h1 class="mt-2 text-2xl font-bold">
      {data.customer.firstName}
      {data.customer.lastName}
    </h1>
  </div>

  <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
    <!-- Customer Info -->
    <div class="lg:col-span-1">
      <div class="rounded-lg bg-surface p-6 shadow">
        <h2 class="mb-4 text-lg font-semibold">Customer Information</h2>

        <div class="space-y-3 text-sm">
          <div>
            <span class="text-muted-foreground">Email</span>
            <p class="font-medium">{data.customer.email}</p>
          </div>
          {#if data.customer.phone}
            <div>
              <span class="text-muted-foreground">Phone</span>
              <p class="font-medium">{data.customer.phone}</p>
            </div>
          {/if}
          <div>
            <span class="text-muted-foreground">Customer since</span>
            <p class="font-medium">{formatDate(data.customer.createdAt)}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Addresses and Orders -->
    <div class="space-y-8 lg:col-span-2">
      <!-- Addresses Section (Read-only) -->
      <div class="rounded-lg bg-surface p-6 shadow">
        <h2 class="mb-4 text-lg font-semibold">Addresses</h2>

        {#if data.customer.addresses.length === 0}
          <p class="text-sm text-muted-foreground">No addresses saved</p>
        {:else}
          <div class="space-y-4">
            {#each data.customer.addresses as address}
              <div class="relative rounded-lg border border-border p-4">
                {#if address.isDefault}
                  <Badge class="absolute top-2 right-2">Default</Badge>
                {/if}
                <div class="pr-16">
                  {#if address.fullName}
                    <p class="font-medium">{address.fullName}</p>
                  {/if}
                  {#if address.company}
                    <p class="text-sm text-foreground-tertiary">{address.company}</p>
                  {/if}
                  <p class="text-sm text-foreground-tertiary">{address.streetLine1}</p>
                  {#if address.streetLine2}
                    <p class="text-sm text-foreground-tertiary">{address.streetLine2}</p>
                  {/if}
                  <p class="text-sm text-foreground-tertiary">{address.postalCode} {address.city}</p>
                  <p class="text-sm text-foreground-tertiary">{address.country}</p>
                  {#if address.phoneNumber}
                    <p class="mt-1 text-sm text-muted-foreground">{address.phoneNumber}</p>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Recent Orders Section -->
      <div class="rounded-lg bg-surface p-6 shadow">
        <h2 class="mb-4 text-lg font-semibold">Recent Orders</h2>

        {#if data.orders.length === 0}
          <p class="text-sm text-muted-foreground">No orders yet</p>
        {:else}
          <Table class="rounded-none border-0 shadow-none">
            <TableHeader>
              <TableRow class="hover:bg-transparent">
                <TableHead class="px-4 py-3 text-sm">Order</TableHead>
                <TableHead class="px-4 py-3 text-sm">Date</TableHead>
                <TableHead class="px-4 py-3 text-sm">Status</TableHead>
                <TableHead class="px-4 py-3 text-right text-sm">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {#each data.orders as order}
                <TableRow>
                  <TableCell class="px-4 py-3 text-sm">
                    <a
                      href="/admin/orders/{order.id}"
                      class="font-medium text-blue-600 hover:text-blue-800"
                    >
                      #{order.code}
                    </a>
                  </TableCell>
                  <TableCell class="px-4 py-3 text-sm text-muted-foreground">
                    {formatDate(order.createdAt)}
                  </TableCell>
                  <TableCell class="px-4 py-3 text-sm">
                    <Badge variant={getStateVariant(order.state)}>
                      {order.state}
                    </Badge>
                  </TableCell>
                  <TableCell class="px-4 py-3 text-right text-sm font-medium">
                    {formatPrice(order.total)} EUR
                  </TableCell>
                </TableRow>
              {/each}
            </TableBody>
          </Table>
        {/if}
      </div>
    </div>
  </div>
</div>
