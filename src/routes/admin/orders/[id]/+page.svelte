<script lang="ts">
  import { toast } from "svelte-sonner";
  import { Button } from "$lib/components/admin/ui/button";
  import { Badge, type BadgeVariant } from "$lib/components/admin/ui/badge";
  import AdminCard from "$lib/components/admin/AdminCard.svelte";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import type { ActionData, PageData } from "./$types";
  import { formatDateTime } from "$lib/utils";

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

<div class="space-y-6">
  <div class="mb-6">
    <a
      href="/admin/orders"
      class="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
      ><ChevronLeft class="h-4 w-4" /> Back to Orders</a
    >
  </div>
  <h1 class="text-2xl font-bold">Order {data.order.code}</h1>

  <div class="flex flex-col gap-6 lg:flex-row">
    <!-- Main Content (Left) -->
    <div class="flex-1 space-y-6">
      <!-- Status -->
      <AdminCard title="Order Status">
        <div class="flex items-center gap-4">
          <Badge
            variant={data.order.state === "paid"
              ? "success"
              : data.order.state === "cancelled"
                ? "destructive"
                : "secondary"}
            class="capitalize"
          >
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
      </AdminCard>

      <!-- Line Items -->
      <AdminCard title="Items" noPadding>
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
      </AdminCard>
    </div>

    <!-- Sidebar (Right) -->
    <div class="w-full space-y-6 lg:w-80 lg:shrink-0">
      <!-- Summary -->
      <AdminCard title="Summary" variant="sidebar">
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between">
            <dt class="text-foreground-secondary">Subtotal</dt>
            <dd>{(data.order.subtotal / 100).toFixed(2)} EUR</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-foreground-secondary">Shipping</dt>
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
      </AdminCard>

      {#if data.order.shippingFullName}
        <!-- Shipping Address -->
        <AdminCard title="Shipping Address" variant="sidebar">
          <address class="text-sm text-foreground-tertiary not-italic">
            <p class="font-medium text-foreground">{data.order.shippingFullName}</p>
            <p>{data.order.shippingStreetLine1}</p>
            {#if data.order.shippingStreetLine2}
              <p>{data.order.shippingStreetLine2}</p>
            {/if}
            <p>{data.order.shippingPostalCode} {data.order.shippingCity}</p>
            <p>{data.order.shippingCountry}</p>
          </address>
        </AdminCard>
      {/if}

      {#if data.orderShipping && data.shippingMethod}
        <!-- Shipping Information -->
        <AdminCard title="Shipping Information" variant="sidebar">
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between">
              <dt class="text-foreground-secondary">Method</dt>
              <dd class="font-medium">{data.shippingMethod.name}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-foreground-secondary">Status</dt>
              <dd>
                <Badge
                  variant={data.orderShipping.status === "delivered"
                    ? "success"
                    : data.orderShipping.status === "shipped" ||
                        data.orderShipping.status === "in_transit"
                      ? "default"
                      : "secondary"}
                  class="capitalize"
                >
                  {data.orderShipping.status.replace("_", " ")}
                </Badge>
              </dd>
            </div>
            {#if data.orderShipping.trackingNumber}
              <div class="flex justify-between">
                <dt class="text-foreground-secondary">Tracking</dt>
                <dd class="font-mono text-xs">{data.orderShipping.trackingNumber}</dd>
              </div>
            {/if}
            <div class="flex justify-between">
              <dt class="text-foreground-secondary">Cost</dt>
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
        </AdminCard>
      {/if}

      {#if data.payment && data.paymentMethod}
        <!-- Payment Information -->
        <AdminCard title="Payment Information" variant="sidebar">
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between">
              <dt class="text-foreground-secondary">Method</dt>
              <dd class="font-medium">{data.paymentMethod.name}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-foreground-secondary">Status</dt>
              <dd>
                <Badge
                  variant={data.payment.state === "settled"
                    ? "success"
                    : data.payment.state === "declined"
                      ? "destructive"
                      : data.payment.state === "refunded"
                        ? "warning"
                        : "secondary"}
                  class="capitalize"
                >
                  {data.payment.state}
                </Badge>
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-foreground-secondary">Amount</dt>
              <dd>{(data.payment.amount / 100).toFixed(2)} EUR</dd>
            </div>
            {#if data.payment.transactionId}
              <div class="flex justify-between">
                <dt class="text-foreground-secondary">Transaction ID</dt>
                <dd class="font-mono text-xs break-all">{data.payment.transactionId}</dd>
              </div>
            {/if}
            {#if data.payment.errorMessage}
              <div class="flex justify-between">
                <dt class="text-foreground-secondary">Error</dt>
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
        </AdminCard>
      {/if}

      <!-- Details -->
      <AdminCard title="Details" variant="sidebar">
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between">
            <dt class="text-foreground-secondary">Order ID</dt>
            <dd>{data.order.id}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-foreground-secondary">Created</dt>
            <dd>{formatDateTime(data.order.createdAt)}</dd>
          </div>
          {#if data.order.orderPlacedAt}
            <div class="flex justify-between">
              <dt class="text-foreground-secondary">Placed</dt>
              <dd>{formatDateTime(data.order.orderPlacedAt)}</dd>
            </div>
          {/if}
        </dl>
      </AdminCard>
    </div>
  </div>
</div>
