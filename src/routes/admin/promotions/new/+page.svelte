<script lang="ts">
  import { enhance } from "$app/forms";
  import { Button, buttonVariants } from "$lib/components/admin/ui/button";
  import { Badge } from "$lib/components/admin/ui/badge";
  import type { PageData, ActionData } from "./$types";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import ShoppingCart from "@lucide/svelte/icons/shopping-cart";
  import Tag from "@lucide/svelte/icons/tag";
  import Truck from "@lucide/svelte/icons/truck";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let promotionType = $state<"order" | "product" | "free_shipping">("order");
  let discountType = $state<"percentage" | "fixed_amount">("percentage");
  let appliesTo = $state<"all" | "specific_products" | "specific_collections">("all");
  let selectedProductIds = $state<number[]>([]);
  let selectedCollectionIds = $state<number[]>([]);

  function toggleProduct(id: number) {
    if (selectedProductIds.includes(id)) {
      selectedProductIds = selectedProductIds.filter((p) => p !== id);
    } else {
      selectedProductIds = [...selectedProductIds, id];
    }
  }

  function toggleCollection(id: number) {
    if (selectedCollectionIds.includes(id)) {
      selectedCollectionIds = selectedCollectionIds.filter((c) => c !== id);
    } else {
      selectedCollectionIds = [...selectedCollectionIds, id];
    }
  }

  const typeOptions = [
    { value: "order" as const, label: "Amount off order", icon: ShoppingCart },
    { value: "product" as const, label: "Amount off products", icon: Tag },
    { value: "free_shipping" as const, label: "Free shipping", icon: Truck }
  ];

  const typeLabels: Record<string, string> = {
    order: "Amount off order",
    product: "Amount off products",
    free_shipping: "Free shipping"
  };
</script>

<svelte:head><title>Create Promotion | Admin</title></svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a
        href="/admin/promotions"
        class="text-gray-500 hover:text-gray-700"
        aria-label="Back to promotions"
      >
        <ChevronLeft class="h-5 w-5" />
      </a>
      <h1 class="text-2xl font-bold text-gray-900">Create Promotion</h1>
    </div>
    <div class="flex items-center gap-3">
      <a href="/admin/promotions" class={buttonVariants({ variant: "outline" })}>Cancel</a>
      <Button type="submit" form="create-form">Create Promotion</Button>
    </div>
  </div>

  {#if form?.error}
    <div class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {form.error}
    </div>
  {/if}

  <form method="POST" use:enhance id="create-form">
    <input type="hidden" name="productIds" value={JSON.stringify(selectedProductIds)} />
    <input type="hidden" name="collectionIds" value={JSON.stringify(selectedCollectionIds)} />

    <div class="flex gap-6">
      <!-- Left Column -->
      <div class="flex-1 space-y-6">
        <!-- Type Selection -->
        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="mb-4 text-lg font-semibold">Promotion Type</h2>
          <div class="grid grid-cols-3 gap-3">
            {#each typeOptions as option}
              <label
                class="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-colors {promotionType === option.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}"
              >
                <input
                  type="radio"
                  name="promotionType"
                  value={option.value}
                  bind:group={promotionType}
                  class="sr-only"
                />
                <option.icon class="h-6 w-6 {promotionType === option.value ? 'text-blue-600' : 'text-gray-400'}" />
                <span class="text-sm font-medium">{option.label}</span>
              </label>
            {/each}
          </div>
        </div>

        <!-- Code -->
        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="mb-4 text-lg font-semibold">Promotion Code</h2>
          <div>
            <label for="code" class="mb-1 block text-sm font-medium text-gray-700">Code</label>
            <input
              type="text"
              id="code"
              name="code"
              placeholder="e.g., SUMMER20"
              required
              class="w-full rounded-lg border border-gray-300 px-3 py-2 uppercase"
            />
            <p class="mt-1 text-xs text-gray-500">Customers will enter this code at checkout.</p>
          </div>
        </div>

        <!-- Discount (hidden for free_shipping) -->
        {#if promotionType !== "free_shipping"}
          <div class="rounded-lg bg-white p-6 shadow">
            <h2 class="mb-4 text-lg font-semibold">Discount Value</h2>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="discountType" class="mb-1 block text-sm font-medium text-gray-700">
                  Discount Type
                </label>
                <select
                  id="discountType"
                  name="discountType"
                  bind:value={discountType}
                  class="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed_amount">Fixed Amount (EUR)</option>
                </select>
              </div>
              <div>
                <label for="discountValue" class="mb-1 block text-sm font-medium text-gray-700">
                  Value
                </label>
                <input
                  type="number"
                  id="discountValue"
                  name="discountValue"
                  placeholder={discountType === "percentage" ? "e.g., 20" : "e.g., 10.00"}
                  min="0"
                  step={discountType === "percentage" ? "1" : "0.01"}
                  required
                  class="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
            </div>
          </div>
        {:else}
          <input type="hidden" name="discountType" value="fixed_amount" />
          <input type="hidden" name="discountValue" value="0" />
        {/if}

        <!-- Applies To (only for product type) -->
        {#if promotionType === "product"}
          <div class="rounded-lg bg-white p-6 shadow">
            <h2 class="mb-4 text-lg font-semibold">Applies To</h2>
            <div class="space-y-3">
              <label class="flex items-center gap-2">
                <input type="radio" name="appliesTo" value="all" bind:group={appliesTo} />
                <span class="text-sm">All products</span>
              </label>
              <label class="flex items-center gap-2">
                <input type="radio" name="appliesTo" value="specific_products" bind:group={appliesTo} />
                <span class="text-sm">Specific products</span>
              </label>
              <label class="flex items-center gap-2">
                <input type="radio" name="appliesTo" value="specific_collections" bind:group={appliesTo} />
                <span class="text-sm">Specific collections</span>
              </label>
            </div>

            {#if appliesTo === "specific_products"}
              <div class="mt-4">
                <p class="mb-2 text-sm font-medium text-gray-700">Select Products</p>
                <div class="max-h-60 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2">
                  {#each data.products as product}
                    <label class="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedProductIds.includes(product.id)}
                        onchange={() => toggleProduct(product.id)}
                        class="h-4 w-4 rounded border-gray-300"
                      />
                      <span class="text-sm">{product.name}</span>
                    </label>
                  {/each}
                </div>
                {#if selectedProductIds.length > 0}
                  <p class="mt-2 text-xs text-gray-500">{selectedProductIds.length} product(s) selected</p>
                {/if}
              </div>
            {/if}

            {#if appliesTo === "specific_collections"}
              <div class="mt-4">
                <p class="mb-2 text-sm font-medium text-gray-700">Select Collections</p>
                <div class="max-h-60 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2">
                  {#each data.collections as collection}
                    <label class="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedCollectionIds.includes(collection.id)}
                        onchange={() => toggleCollection(collection.id)}
                        class="h-4 w-4 rounded border-gray-300"
                      />
                      <span class="text-sm">{collection.name}</span>
                    </label>
                  {/each}
                </div>
                {#if selectedCollectionIds.length > 0}
                  <p class="mt-2 text-xs text-gray-500">{selectedCollectionIds.length} collection(s) selected</p>
                {/if}
              </div>
            {/if}
          </div>
        {:else}
          <input type="hidden" name="appliesTo" value="all" />
        {/if}

        <!-- Conditions -->
        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="mb-4 text-lg font-semibold">Conditions</h2>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label for="minOrderAmount" class="mb-1 block text-sm font-medium text-gray-700">
                Min Order (EUR)
              </label>
              <input
                type="number"
                id="minOrderAmount"
                name="minOrderAmount"
                placeholder="Optional"
                min="0"
                step="0.01"
                class="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label for="usageLimit" class="mb-1 block text-sm font-medium text-gray-700">
                Total Usage Limit
              </label>
              <input
                type="number"
                id="usageLimit"
                name="usageLimit"
                placeholder="Unlimited"
                min="0"
                class="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label for="usageLimitPerCustomer" class="mb-1 block text-sm font-medium text-gray-700">
                Per Customer Limit
              </label>
              <input
                type="number"
                id="usageLimitPerCustomer"
                name="usageLimitPerCustomer"
                placeholder="Unlimited"
                min="0"
                class="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
          </div>
        </div>

        <!-- Active Dates -->
        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="mb-4 text-lg font-semibold">Active Dates</h2>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="startsAt" class="mb-1 block text-sm font-medium text-gray-700">
                Starts At
              </label>
              <input
                type="datetime-local"
                id="startsAt"
                name="startsAt"
                class="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label for="endsAt" class="mb-1 block text-sm font-medium text-gray-700">
                Ends At
              </label>
              <input
                type="datetime-local"
                id="endsAt"
                name="endsAt"
                class="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
          </div>
          <p class="mt-2 text-xs text-gray-500">Leave empty for no start/end date restrictions.</p>
        </div>
      </div>

      <!-- Right Sidebar -->
      <div class="w-80 shrink-0 space-y-6">
        <!-- Combination Settings -->
        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="mb-4 text-lg font-semibold">Combinations</h2>
          <label class="flex items-center gap-2">
            <input
              type="checkbox"
              name="combinesWithOtherPromotions"
              class="h-4 w-4 rounded border-gray-300"
            />
            <span class="text-sm">Combines with other promotions</span>
          </label>
          <p class="mt-2 text-xs text-gray-500">
            When enabled, this promotion can be used alongside other promotions on the same order.
          </p>
        </div>

        <!-- Summary -->
        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="mb-4 text-lg font-semibold">Summary</h2>
          <div class="space-y-2 text-sm text-gray-600">
            <p>
              <span class="font-medium text-gray-900">Type:</span>
              <Badge variant="outline">{typeLabels[promotionType]}</Badge>
            </p>
            {#if promotionType !== "free_shipping"}
              <p>
                <span class="font-medium text-gray-900">Discount:</span>
                {discountType === "percentage" ? "Percentage off" : "Fixed amount off"}
              </p>
            {/if}
            {#if promotionType === "product"}
              <p>
                <span class="font-medium text-gray-900">Applies to:</span>
                {appliesTo === "all" ? "All products" : appliesTo === "specific_products" ? `${selectedProductIds.length} product(s)` : `${selectedCollectionIds.length} collection(s)`}
              </p>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </form>
</div>
