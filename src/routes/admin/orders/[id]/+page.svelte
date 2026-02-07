<script lang="ts">
  import { toast } from "svelte-sonner";
  import { Button } from "$lib/components/admin/ui/button";
  import { Badge, type BadgeVariant } from "$lib/components/admin/ui/badge";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  // Show toast notifications based on form results
  $effect(() => {
    if (form?.success) toast.success("Order updated successfully");
    if (form?.error) toast.error(form.error);
  });

  const transitions: Record<string, string[]> = {
    created: ["payment_pending", "cancelled"],
    payment_pending: ["paid", "cancelled"],
    paid: ["shipped", "cancelled"],
    shipped: ["delivered"],
    delivered: [],
    cancelled: []
  };

  const nextStates = $derived(transitions[data.order.state] ?? []);
</script>

<svelte:head><title>Order Details | Admin</title></svelte:head>

<div>
  <div class="mb-8">
    <a href="/admin/orders" class="text-sm text-blue-600 hover:underline">&larr; Back to Orders</a>
    <h1 class="mt-2 text-2xl font-bold">Order {data.order.code}</h1>
  </div>

  <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
    <!-- Order Details -->
    <div class="space-y-6 lg:col-span-2">
      <!-- Status -->
      <div class="rounded-lg bg-surface p-6 shadow">
        <h2 class="mb-4 font-semibold">Order Status</h2>
        <div class="flex items-center gap-4">
          <Badge variant={data.order.state === 'paid' ? 'success' : data.order.state === 'cancelled' ? 'destructive' : 'secondary'} class="capitalize">
            {data.order.state.replace("_", " ")}
          </Badge>

          {#if nextStates.length > 0}
            <div class="flex gap-2">
              {#each nextStates as state}
                <form method="POST" action="?/transition" class="inline">
                  <input type="hidden" name="state" value={state} />
                  <Button type="submit" variant="outline" size="sm" class="capitalize">
                    Mark as {state.replace("_", " ")}
                  </Button>
                </form>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <!-- Line Items -->
      <div class="rounded-lg bg-surface shadow">
        <div class="border-b border-border px-6 py-4">
          <h2 class="font-semibold">Items</h2>
        </div>
        <div class="divide-y divide-border">
          {#each data.order.lines as line}
            <div class="flex items-center justify-between px-6 py-4">
              <div>
                <p class="font-medium">{line.productName}</p>
                {#if line.variantName}
                  <p class="text-sm text-muted-foreground">{line.variantName}</p>
                {/if}
                <p class="text-sm text-muted-foreground">SKU: {line.sku}</p>
              </div>
              <div class="text-right">
                <p class="text-sm text-muted-foreground">
                  {(line.unitPrice / 100).toFixed(2)} x {line.quantity}
                </p>
                <p class="font-medium">{(line.lineTotal / 100).toFixed(2)} EUR</p>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Order Summary -->
    <div class="space-y-6">
      <div class="rounded-lg bg-surface p-6 shadow">
        <h2 class="mb-4 font-semibold">Summary</h2>
        <dl class="space-y-2">
          <div class="flex justify-between">
            <dt class="text-muted-foreground">Subtotal</dt>
            <dd>{(data.order.subtotal / 100).toFixed(2)} EUR</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-muted-foreground">Shipping</dt>
            <dd>{(data.order.shipping / 100).toFixed(2)} EUR</dd>
          </div>
          {#if data.order.discount > 0}
            <div class="flex justify-between text-green-600">
              <dt>Discount</dt>
              <dd>-{(data.order.discount / 100).toFixed(2)} EUR</dd>
            </div>
          {/if}
          <div class="flex justify-between border-t border-border pt-2 font-bold">
            <dt>Total</dt>
            <dd>{(data.order.total / 100).toFixed(2)} {data.order.currencyCode}</dd>
          </div>
        </dl>
      </div>

      {#if data.order.shippingFullName}
        <div class="rounded-lg bg-surface p-6 shadow">
          <h2 class="mb-4 font-semibold">Shipping Address</h2>
          <address class="text-sm text-foreground-tertiary not-italic">
            <p class="font-medium text-foreground">{data.order.shippingFullName}</p>
            <p>{data.order.shippingStreetLine1}</p>
            {#if data.order.shippingStreetLine2}
              <p>{data.order.shippingStreetLine2}</p>
            {/if}
            <p>{data.order.shippingPostalCode} {data.order.shippingCity}</p>
            <p>{data.order.shippingCountry}</p>
          </address>
        </div>
      {/if}

      {#if data.orderShipping && data.shippingMethod}
        <div class="rounded-lg bg-surface p-6 shadow">
          <h2 class="mb-4 font-semibold">Shipping Information</h2>
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between">
              <dt class="text-muted-foreground">Method</dt>
              <dd class="font-medium">{data.shippingMethod.name}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-muted-foreground">Status</dt>
              <dd>
                <Badge variant={data.orderShipping.status === 'delivered' ? 'success' : data.orderShipping.status === 'shipped' || data.orderShipping.status === 'in_transit' ? 'default' : 'secondary'} class="capitalize">
                  {data.orderShipping.status.replace("_", " ")}
                </Badge>
              </dd>
            </div>
            {#if data.orderShipping.trackingNumber}
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Tracking</dt>
                <dd class="font-mono text-xs">{data.orderShipping.trackingNumber}</dd>
              </div>
            {/if}
            <div class="flex justify-between">
              <dt class="text-muted-foreground">Cost</dt>
              <dd>{(data.orderShipping.price / 100).toFixed(2)} EUR</dd>
            </div>
          </dl>

          {#if data.orderShipping.trackingNumber}
            <form method="POST" action="?/trackShipment" class="mt-4">
              <Button type="submit" variant="outline" class="w-full">
                Refresh Tracking Status
              </Button>
            </form>
          {/if}

          {#if data.order.state === "paid" && data.orderShipping.status === "pending"}
            <form method="POST" action="?/updateShippingStatus" class="mt-4">
              <input type="hidden" name="status" value="shipped" />
              <Button type="submit" class="w-full">Mark as Shipped</Button>
            </form>
          {/if}
        </div>
      {/if}

      {#if data.payment && data.paymentMethod}
        <div class="rounded-lg bg-surface p-6 shadow">
          <h2 class="mb-4 font-semibold">Payment Information</h2>
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between">
              <dt class="text-muted-foreground">Method</dt>
              <dd class="font-medium">{data.paymentMethod.name}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-muted-foreground">Status</dt>
              <dd>
                <Badge variant={data.payment.state === 'settled' ? 'success' : data.payment.state === 'declined' ? 'destructive' : data.payment.state === 'refunded' ? 'warning' : 'secondary'} class="capitalize">
                  {data.payment.state}
                </Badge>
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-muted-foreground">Amount</dt>
              <dd>{(data.payment.amount / 100).toFixed(2)} EUR</dd>
            </div>
            {#if data.payment.transactionId}
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Transaction ID</dt>
                <dd class="font-mono text-xs break-all">{data.payment.transactionId}</dd>
              </div>
            {/if}
            {#if data.payment.errorMessage}
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Error</dt>
                <dd class="text-xs text-red-600">{data.payment.errorMessage}</dd>
              </div>
            {/if}
          </dl>

          {#if data.payment.state === "pending" || data.payment.state === "authorized"}
            <form method="POST" action="?/confirmPayment" class="mt-4">
              <Button type="submit" class="w-full">Confirm Payment Status</Button>
            </form>
          {/if}

          {#if data.payment.state === "settled" && data.payment.transactionId}
            <form method="POST" action="?/refundPayment" class="mt-4">
              <Button
                type="submit"
                variant="secondary"
                class="w-full bg-yellow-600 text-white hover:bg-yellow-700"
              >
                Refund Payment
              </Button>
            </form>
          {/if}
        </div>
      {/if}

      <div class="rounded-lg bg-surface p-6 shadow">
        <h2 class="mb-4 font-semibold">Details</h2>
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between">
            <dt class="text-muted-foreground">Order ID</dt>
            <dd>{data.order.id}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-muted-foreground">Created</dt>
            <dd>{new Date(data.order.createdAt).toLocaleString()}</dd>
          </div>
          {#if data.order.orderPlacedAt}
            <div class="flex justify-between">
              <dt class="text-muted-foreground">Placed</dt>
              <dd>{new Date(data.order.orderPlacedAt).toLocaleString()}</dd>
            </div>
          {/if}
        </dl>
      </div>
    </div>
  </div>
</div>
