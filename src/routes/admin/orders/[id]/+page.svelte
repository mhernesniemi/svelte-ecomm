<script lang="ts">
  import { Button } from "$lib/components/admin/ui/button";
  import { Card } from "$lib/components/admin/ui/card";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

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

<div>
  <div class="mb-8">
    <a href="/admin/orders" class="text-sm text-blue-600 hover:underline">&larr; Back to Orders</a>
    <h1 class="mt-2 text-2xl font-bold">Order {data.order.code}</h1>
  </div>

  {#if form?.success}
    <div class="mb-6 rounded border border-green-200 bg-green-50 px-4 py-3 text-green-700">
      Order updated successfully
    </div>
  {/if}

  {#if form?.error}
    <div class="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
      {form.error}
    </div>
  {/if}

  <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
    <!-- Order Details -->
    <div class="space-y-6 lg:col-span-2">
      <!-- Status -->
      <Card class="p-6">
        <h2 class="mb-4 font-semibold">Order Status</h2>
        <div class="flex items-center gap-4">
          <span
            class="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium capitalize
						{data.order.state === 'paid'
              ? 'bg-green-100 text-green-800'
              : data.order.state === 'cancelled'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'}"
          >
            {data.order.state.replace("_", " ")}
          </span>

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
      </Card>

      <!-- Line Items -->
      <Card>
        <div class="border-b border-gray-200 px-6 py-4">
          <h2 class="font-semibold">Items</h2>
        </div>
        <div class="divide-y divide-gray-200">
          {#each data.order.lines as line}
            <div class="flex items-center justify-between px-6 py-4">
              <div>
                <p class="font-medium">{line.productName}</p>
                {#if line.variantName}
                  <p class="text-sm text-gray-500">{line.variantName}</p>
                {/if}
                <p class="text-sm text-gray-500">SKU: {line.sku}</p>
              </div>
              <div class="text-right">
                <p class="text-sm text-gray-500">
                  {(line.unitPrice / 100).toFixed(2)} x {line.quantity}
                </p>
                <p class="font-medium">{(line.lineTotal / 100).toFixed(2)} EUR</p>
              </div>
            </div>
          {/each}
        </div>
      </Card>
    </div>

    <!-- Order Summary -->
    <div class="space-y-6">
      <Card class="p-6">
        <h2 class="mb-4 font-semibold">Summary</h2>
        <dl class="space-y-2">
          <div class="flex justify-between">
            <dt class="text-gray-500">Subtotal</dt>
            <dd>{(data.order.subtotal / 100).toFixed(2)} EUR</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-gray-500">Shipping</dt>
            <dd>{(data.order.shipping / 100).toFixed(2)} EUR</dd>
          </div>
          {#if data.order.discount > 0}
            <div class="flex justify-between text-green-600">
              <dt>Discount</dt>
              <dd>-{(data.order.discount / 100).toFixed(2)} EUR</dd>
            </div>
          {/if}
          <div class="flex justify-between border-t border-gray-200 pt-2 font-bold">
            <dt>Total</dt>
            <dd>{(data.order.total / 100).toFixed(2)} {data.order.currencyCode}</dd>
          </div>
        </dl>
      </Card>

      {#if data.order.shippingFullName}
        <Card class="p-6">
          <h2 class="mb-4 font-semibold">Shipping Address</h2>
          <address class="text-sm text-gray-600 not-italic">
            <p class="font-medium text-gray-900">{data.order.shippingFullName}</p>
            <p>{data.order.shippingStreetLine1}</p>
            {#if data.order.shippingStreetLine2}
              <p>{data.order.shippingStreetLine2}</p>
            {/if}
            <p>{data.order.shippingPostalCode} {data.order.shippingCity}</p>
            <p>{data.order.shippingCountry}</p>
          </address>
        </Card>
      {/if}

      {#if data.orderShipping && data.shippingMethod}
        <Card class="p-6">
          <h2 class="mb-4 font-semibold">Shipping Information</h2>
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between">
              <dt class="text-gray-500">Method</dt>
              <dd class="font-medium">{data.shippingMethod.name}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Status</dt>
              <dd>
                <span
                  class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize
									{data.orderShipping.status === 'delivered'
                    ? 'bg-green-100 text-green-800'
                    : data.orderShipping.status === 'shipped' ||
                        data.orderShipping.status === 'in_transit'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'}"
                >
                  {data.orderShipping.status.replace("_", " ")}
                </span>
              </dd>
            </div>
            {#if data.orderShipping.trackingNumber}
              <div class="flex justify-between">
                <dt class="text-gray-500">Tracking</dt>
                <dd class="font-mono text-xs">{data.orderShipping.trackingNumber}</dd>
              </div>
            {/if}
            <div class="flex justify-between">
              <dt class="text-gray-500">Cost</dt>
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
              <Button type="submit" class="w-full">
                Mark as Shipped
              </Button>
            </form>
          {/if}
        </Card>
      {/if}

      {#if data.payment && data.paymentMethod}
        <Card class="p-6">
          <h2 class="mb-4 font-semibold">Payment Information</h2>
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between">
              <dt class="text-gray-500">Method</dt>
              <dd class="font-medium">{data.paymentMethod.name}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Status</dt>
              <dd>
                <span
                  class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize
									{data.payment.state === 'settled'
                    ? 'bg-green-100 text-green-800'
                    : data.payment.state === 'declined'
                      ? 'bg-red-100 text-red-800'
                      : data.payment.state === 'refunded'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'}"
                >
                  {data.payment.state}
                </span>
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Amount</dt>
              <dd>{(data.payment.amount / 100).toFixed(2)} EUR</dd>
            </div>
            {#if data.payment.transactionId}
              <div class="flex justify-between">
                <dt class="text-gray-500">Transaction ID</dt>
                <dd class="font-mono text-xs break-all">{data.payment.transactionId}</dd>
              </div>
            {/if}
            {#if data.payment.errorMessage}
              <div class="flex justify-between">
                <dt class="text-gray-500">Error</dt>
                <dd class="text-xs text-red-600">{data.payment.errorMessage}</dd>
              </div>
            {/if}
          </dl>

          {#if data.payment.state === "pending" || data.payment.state === "authorized"}
            <form method="POST" action="?/confirmPayment" class="mt-4">
              <Button type="submit" class="w-full">
                Confirm Payment Status
              </Button>
            </form>
          {/if}

          {#if data.payment.state === "settled" && data.payment.transactionId}
            <form method="POST" action="?/refundPayment" class="mt-4">
              <Button type="submit" variant="secondary" class="w-full bg-yellow-600 text-white hover:bg-yellow-700">
                Refund Payment
              </Button>
            </form>
          {/if}
        </Card>
      {/if}

      <Card class="p-6">
        <h2 class="mb-4 font-semibold">Details</h2>
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between">
            <dt class="text-gray-500">Order ID</dt>
            <dd>{data.order.id}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-gray-500">Created</dt>
            <dd>{new Date(data.order.createdAt).toLocaleString()}</dd>
          </div>
          {#if data.order.orderPlacedAt}
            <div class="flex justify-between">
              <dt class="text-gray-500">Placed</dt>
              <dd>{new Date(data.order.orderPlacedAt).toLocaleString()}</dd>
            </div>
          {/if}
        </dl>
      </Card>
    </div>
  </div>
</div>
