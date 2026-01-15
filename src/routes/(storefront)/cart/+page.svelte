<script lang="ts">
  import { enhance } from "$app/forms";
  import { Button } from "$lib/components/storefront/ui/button";
  import { Input } from "$lib/components/storefront/ui/input";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const cart = $derived(data.cart);
  const lines = $derived(cart?.lines ?? []);
  const subtotal = $derived(cart?.subtotal ?? 0);
  const discount = $derived(cart?.discount ?? 0);
  const total = $derived(cart?.total ?? 0);

  function formatPrice(cents: number): string {
    return (cents / 100).toFixed(2);
  }
</script>

<div class="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
  <h1 class="mb-8 text-2xl font-bold">Shopping Cart</h1>

  {#if lines.length === 0}
    <div class="py-12 text-center">
      <svg
        class="mx-auto mb-4 h-16 w-16 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      <p class="mb-4 text-gray-500">Your cart is empty</p>
      <a
        href="/products"
        class="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Continue Shopping
      </a>
    </div>
  {:else}
    <div class="divide-y rounded-lg bg-white shadow">
      {#each lines as line (line.id)}
        <div class="flex items-center justify-between gap-4 p-4">
          <div class="flex-1">
            <p class="font-medium">{line.productName}</p>
            {#if line.variantName}
              <p class="text-sm text-gray-500">{line.variantName}</p>
            {/if}
            <p class="text-sm text-gray-500">SKU: {line.sku}</p>
          </div>

          <div class="flex items-center gap-4">
            <!-- Quantity controls -->
            <div class="flex items-center gap-2">
              <form method="POST" action="?/updateQuantity" use:enhance>
                <input type="hidden" name="lineId" value={line.id} />
                <input type="hidden" name="quantity" value={line.quantity - 1} />
                <button
                  type="submit"
                  class="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
              </form>
              <span class="w-8 text-center">{line.quantity}</span>
              <form method="POST" action="?/updateQuantity" use:enhance>
                <input type="hidden" name="lineId" value={line.id} />
                <input type="hidden" name="quantity" value={line.quantity + 1} />
                <button
                  type="submit"
                  class="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </form>
            </div>

            <!-- Line total -->
            <div class="w-24 text-right">
              <p class="font-medium">{formatPrice(line.lineTotal)} EUR</p>
              <p class="text-xs text-gray-500">{formatPrice(line.unitPrice)} each</p>
            </div>

            <!-- Remove button -->
            <form method="POST" action="?/removeLine" use:enhance>
              <input type="hidden" name="lineId" value={line.id} />
              <button
                type="submit"
                class="text-red-500 hover:text-red-700"
                aria-label="Remove item"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>
      {/each}
    </div>

    <!-- Promotion Code -->
    <div class="mt-6 rounded-lg bg-white p-6 shadow">
      <form method="POST" action="?/applyPromotion" use:enhance class="flex gap-2">
        <label for="promo-code" class="sr-only">Promotion code</label>
        <Input
          id="promo-code"
          type="text"
          name="code"
          placeholder="Promotion code"
          class="flex-1"
        />
        <Button type="submit" variant="secondary">
          Apply
        </Button>
      </form>
    </div>

    <!-- Order Summary -->
    <div class="mt-6 rounded-lg bg-white p-6 shadow">
      <h2 class="mb-4 text-lg font-semibold">Order Summary</h2>

      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600">Subtotal</span>
          <span>{formatPrice(subtotal)} EUR</span>
        </div>

        {#if discount > 0}
          <div class="flex justify-between text-green-600">
            <span>Discount</span>
            <span>-{formatPrice(discount)} EUR</span>
          </div>
        {/if}

        <div class="flex justify-between border-t pt-2 text-base font-semibold">
          <span>Total</span>
          <span>{formatPrice(total)} EUR</span>
        </div>
      </div>

      <a
        href="/checkout"
        class="mt-6 flex w-full items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Proceed to Checkout
      </a>

      <a href="/products" class="mt-3 block text-center text-blue-600 hover:underline">
        Continue Shopping
      </a>
    </div>
  {/if}
</div>
