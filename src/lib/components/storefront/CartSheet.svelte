<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { updateCartLineQuantity, removeCartLine } from "$lib/remote/cart.remote";
  import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter
  } from "$lib/components/storefront/ui/sheet";
  import ShoppingCart from "@lucide/svelte/icons/shopping-cart";
  import Minus from "@lucide/svelte/icons/minus";
  import Plus from "@lucide/svelte/icons/plus";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import type { OrderWithRelations } from "$lib/types";

  let {
    cart,
    itemCount
  }: {
    cart: OrderWithRelations | null;
    itemCount: number;
  } = $props();

  let isOpen = $state(false);

  const lines = $derived(cart?.lines ?? []);
  const subtotal = $derived(cart?.subtotal ?? 0);
  const discount = $derived(cart?.discount ?? 0);

  function formatPrice(cents: number): string {
    return (cents / 100).toFixed(2);
  }

  async function updateQuantity(lineId: number, newQuantity: number) {
    await updateCartLineQuantity({ lineId, quantity: newQuantity });
    await invalidateAll();
  }

  async function removeLine(lineId: number) {
    await removeCartLine({ lineId });
    await invalidateAll();
  }
</script>

<Sheet bind:open={isOpen}>
  <button
    type="button"
    onclick={() => (isOpen = true)}
    class="relative text-gray-600 hover:text-gray-900"
    aria-label="Shopping cart"
  >
    <ShoppingCart class="h-6 w-6" />
    {#if itemCount > 0}
      <span
        class="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white"
      >
        {itemCount > 99 ? "99+" : itemCount}
      </span>
    {/if}
  </button>

  <SheetContent side="right" class="flex w-full flex-col sm:max-w-md">
    <SheetHeader class="pb-4">
      <SheetTitle class="text-xl">Shopping Cart</SheetTitle>
    </SheetHeader>

    <div class="flex-1 overflow-y-auto py-4">
      {#if lines.length === 0}
        <div class="flex flex-col items-center justify-center py-16 text-center">
          <div class="mb-4 rounded-full bg-gray-100 p-4">
            <ShoppingCart class="h-10 w-10 text-gray-400" />
          </div>
          <p class="mb-1 font-medium text-gray-900">Your cart is empty</p>
          <p class="mb-6 text-sm text-gray-500">Add some items to get started</p>
          <button
            onclick={() => (isOpen = false)}
            class="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-6 text-sm font-medium text-white hover:bg-blue-700"
          >
            Continue Shopping
          </button>
        </div>
      {:else}
        <div class="divide-y divide-gray-200">
          {#each lines as line (line.id)}
            <div class="flex gap-3 p-3">
              <div class="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-gray-100">
                {#if line.imageUrl}
                  <img
                    src={line.imageUrl}
                    alt={line.productName}
                    class="h-full w-full object-cover"
                  />
                {:else}
                  <div class="flex h-full w-full items-center justify-center">
                    <ShoppingCart class="h-6 w-6 text-gray-300" />
                  </div>
                {/if}
              </div>

              <div class="flex min-w-0 flex-1 flex-col">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <h4 class="truncate text-sm font-medium text-gray-900">{line.productName}</h4>
                    {#if line.variantName}
                      <p class="text-xs text-gray-500">{line.variantName}</p>
                    {/if}
                  </div>
                  <button
                    type="button"
                    onclick={() => removeLine(line.id)}
                    class="rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                    aria-label="Remove item"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>

                <div class="mt-auto flex items-center justify-between pt-2">
                  <div class="inline-flex items-center rounded border border-gray-200 bg-white">
                    <button
                      type="button"
                      onclick={() => updateQuantity(line.id, line.quantity - 1)}
                      class="flex h-7 w-7 items-center justify-center text-gray-500 transition-colors hover:text-gray-700"
                      aria-label="Decrease quantity"
                    >
                      <Minus class="h-3 w-3" />
                    </button>
                    <span class="w-6 text-center text-xs font-medium">{line.quantity}</span>
                    <button
                      type="button"
                      onclick={() => updateQuantity(line.id, line.quantity + 1)}
                      class="flex h-7 w-7 items-center justify-center text-gray-500 transition-colors hover:text-gray-700"
                      aria-label="Increase quantity"
                    >
                      <Plus class="h-3 w-3" />
                    </button>
                  </div>
                  <span class="text-sm font-medium text-gray-900"
                    >{formatPrice(line.lineTotal)} EUR</span
                  >
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    {#if lines.length > 0}
      <SheetFooter class="mt-auto border-t border-gray-200 bg-gray-50/50 px-6 pt-4 pb-2">
        <div class="w-full space-y-4">
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Subtotal</span>
              <span class="text-gray-700">{formatPrice(subtotal)} EUR</span>
            </div>

            {#if discount > 0}
              <div class="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-{formatPrice(discount)} EUR</span>
              </div>
            {/if}
          </div>

          <div class="mb-4">
            <a
              href="/checkout"
              onclick={() => (isOpen = false)}
              class="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Proceed to Checkout
            </a>
          </div>
        </div>
      </SheetFooter>
    {/if}
  </SheetContent>
</Sheet>
