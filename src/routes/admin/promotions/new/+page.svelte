<script lang="ts">
  import { enhance } from "$app/forms";
  import { Button, buttonVariants } from "$lib/components/admin/ui/button";
  import { Badge } from "$lib/components/admin/ui/badge";
  import * as Popover from "$lib/components/admin/ui/popover";
  import * as Command from "$lib/components/admin/ui/command";
  import type { PageData, ActionData } from "./$types";
  import ShoppingCart from "@lucide/svelte/icons/shopping-cart";
  import Tag from "@lucide/svelte/icons/tag";
  import Truck from "@lucide/svelte/icons/truck";
  import ChevronsUpDown from "@lucide/svelte/icons/chevrons-up-down";
  import Check from "@lucide/svelte/icons/check";
  import X from "@lucide/svelte/icons/x";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let method = $state<"code" | "automatic">("code");
  let promotionType = $state<"order" | "product" | "free_shipping">("order");
  let discountType = $state<"percentage" | "fixed_amount">("percentage");
  let appliesTo = $state<"all" | "specific_products" | "specific_collections">("all");
  let selectedProductIds = $state<number[]>([]);
  let selectedCollectionIds = $state<number[]>([]);
  let productComboboxOpen = $state(false);
  let collectionComboboxOpen = $state(false);

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

  function getProductName(id: number): string {
    return data.products.find((p) => p.id === id)?.name ?? `Product #${id}`;
  }

  function getCollectionName(id: number): string {
    return data.collections.find((c) => c.id === id)?.name ?? `Collection #${id}`;
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
  <div class="mb-6 flex items-center justify-between">
    <a href="/admin/promotions" class="text-sm text-blue-600 hover:underline dark:text-blue-400"
      >&larr; Back to Promotions</a
    >
  </div>
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold">Create Promotion</h1>
    <div class="flex items-center gap-3">
      <a href="/admin/promotions" class={buttonVariants({ variant: "outline" })}>Cancel</a>
      <Button type="submit" form="create-form">Create Promotion</Button>
    </div>
  </div>

  {#if form?.error}
    <div class="rounded-lg border border-red-200 bg-destructive-subtle p-4 text-sm text-red-700">
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
        <div class="rounded-lg bg-surface p-6 shadow">
          <h2 class="mb-4 text-lg font-semibold">Promotion Type</h2>
          <div class="grid grid-cols-3 gap-3">
            {#each typeOptions as option}
              <label
                class="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-colors {promotionType ===
                option.value
                  ? 'border-blue-500 bg-accent-subtle'
                  : 'border-border hover:border-input-border'}"
              >
                <input
                  type="radio"
                  name="promotionType"
                  value={option.value}
                  bind:group={promotionType}
                  class="sr-only"
                />
                <option.icon
                  class="h-6 w-6 {promotionType === option.value
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-placeholder'}"
                />
                <span class="text-sm font-medium">{option.label}</span>
              </label>
            {/each}
          </div>
        </div>

        <!-- Method + Code/Title -->
        <div class="rounded-lg bg-surface p-6 shadow">
          <h2 class="mb-4 text-lg font-semibold">Discount Method</h2>
          <input type="hidden" name="method" value={method} />
          <div class="mb-4 inline-flex rounded-lg border border-border p-0.5">
            <button
              type="button"
              class="rounded-md px-4 py-1.5 text-sm font-medium transition-colors {method === 'code'
                ? 'bg-gray-900 text-white'
                : 'text-foreground-tertiary hover:text-foreground'}"
              onclick={() => (method = "code")}
            >
              Discount code
            </button>
            <button
              type="button"
              class="rounded-md px-4 py-1.5 text-sm font-medium transition-colors {method ===
              'automatic'
                ? 'bg-gray-900 text-white'
                : 'text-foreground-tertiary hover:text-foreground'}"
              onclick={() => (method = "automatic")}
            >
              Automatic discount
            </button>
          </div>

          {#if method === "code"}
            <div>
              <label for="code" class="mb-1 block text-sm font-medium text-foreground-secondary"
                >Code</label
              >
              <input
                type="text"
                id="code"
                name="code"
                placeholder="e.g., SUMMER20"
                required
                class="w-full rounded-lg border border-input-border px-3 py-2 uppercase"
              />
              <p class="mt-1 text-xs text-muted-foreground">
                Customers will enter this code at checkout.
              </p>
            </div>
          {:else}
            <div>
              <label for="title" class="mb-1 block text-sm font-medium text-foreground-secondary"
                >Title</label
              >
              <input
                type="text"
                id="title"
                name="title"
                placeholder="e.g., Summer Sale 20% Off"
                required
                class="w-full rounded-lg border border-input-border px-3 py-2"
              />
              <p class="mt-1 text-xs text-muted-foreground">
                Customers will see this in their cart and at checkout.
              </p>
            </div>
          {/if}
        </div>

        <!-- Discount (hidden for free_shipping) -->
        {#if promotionType !== "free_shipping"}
          <div class="rounded-lg bg-surface p-6 shadow">
            <h2 class="mb-4 text-lg font-semibold">Discount Value</h2>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label
                  for="discountType"
                  class="mb-1 block text-sm font-medium text-foreground-secondary"
                >
                  Discount Type
                </label>
                <select
                  id="discountType"
                  name="discountType"
                  bind:value={discountType}
                  class="w-full rounded-lg border border-input-border px-3 py-2"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed_amount">Fixed Amount (EUR)</option>
                </select>
              </div>
              <div>
                <label
                  for="discountValue"
                  class="mb-1 block text-sm font-medium text-foreground-secondary"
                >
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
                  class="w-full rounded-lg border border-input-border px-3 py-2"
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
          <div class="rounded-lg bg-surface p-6 shadow">
            <h2 class="mb-4 text-lg font-semibold">Applies To</h2>
            <div class="space-y-3">
              <label class="flex items-center gap-2">
                <input type="radio" name="appliesTo" value="all" bind:group={appliesTo} />
                <span class="text-sm">All products</span>
              </label>
              <label class="flex items-center gap-2">
                <input
                  type="radio"
                  name="appliesTo"
                  value="specific_products"
                  bind:group={appliesTo}
                />
                <span class="text-sm">Specific products</span>
              </label>
              <label class="flex items-center gap-2">
                <input
                  type="radio"
                  name="appliesTo"
                  value="specific_collections"
                  bind:group={appliesTo}
                />
                <span class="text-sm">Specific collections</span>
              </label>
            </div>

            {#if appliesTo === "specific_products"}
              <div class="mt-4">
                <p class="mb-2 text-sm font-medium text-foreground-secondary">Select Products</p>
                <Popover.Root bind:open={productComboboxOpen}>
                  <Popover.Trigger
                    class="flex h-9 items-center justify-between rounded-lg border border-input-border bg-surface px-3 py-2 text-sm hover:bg-hover"
                  >
                    <span class="text-muted-foreground">
                      {selectedProductIds.length > 0
                        ? `${selectedProductIds.length} product(s) selected`
                        : "Search products..."}
                    </span>
                    <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 text-placeholder" />
                  </Popover.Trigger>
                  <Popover.Content class="w-[var(--bits-popover-trigger-width)] p-0" align="start">
                    <Command.Root>
                      <Command.Input placeholder="Search products..." />
                      <Command.List class="max-h-60">
                        <Command.Empty>No products found.</Command.Empty>
                        {#each data.products as product}
                          <Command.Item
                            value={product.name}
                            onSelect={() => toggleProduct(product.id)}
                          >
                            <Check
                              class="mr-2 h-4 w-4 {selectedProductIds.includes(product.id)
                                ? 'opacity-100'
                                : 'opacity-0'}"
                            />
                            {product.name}
                          </Command.Item>
                        {/each}
                      </Command.List>
                    </Command.Root>
                  </Popover.Content>
                </Popover.Root>
                {#if selectedProductIds.length > 0}
                  <div class="mt-4 flex flex-wrap gap-1">
                    {#each selectedProductIds as id}
                      <Badge variant="secondary" class="gap-1 text-sm">
                        {getProductName(id)}
                        <button
                          type="button"
                          onclick={() => toggleProduct(id)}
                          class="ml-0.5 rounded-full hover:bg-muted-strong"
                        >
                          <X class="h-3 w-3" />
                        </button>
                      </Badge>
                    {/each}
                  </div>
                {/if}
              </div>
            {/if}

            {#if appliesTo === "specific_collections"}
              <div class="mt-4">
                <p class="mb-2 text-sm font-medium text-foreground-secondary">Select Collections</p>
                <Popover.Root bind:open={collectionComboboxOpen}>
                  <Popover.Trigger
                    class="flex h-9 items-center justify-between rounded-lg border border-input-border bg-surface px-3 py-2 text-sm hover:bg-hover"
                  >
                    <span class="text-muted-foreground">
                      {selectedCollectionIds.length > 0
                        ? `${selectedCollectionIds.length} collection(s) selected`
                        : "Search collections..."}
                    </span>
                    <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 text-placeholder" />
                  </Popover.Trigger>
                  <Popover.Content class="w-[var(--bits-popover-trigger-width)] p-0" align="start">
                    <Command.Root>
                      <Command.Input placeholder="Search collections..." />
                      <Command.List class="max-h-60">
                        <Command.Empty>No collections found.</Command.Empty>
                        {#each data.collections as collection}
                          <Command.Item
                            value={collection.name}
                            onSelect={() => toggleCollection(collection.id)}
                          >
                            <Check
                              class="mr-2 h-4 w-4 {selectedCollectionIds.includes(collection.id)
                                ? 'opacity-100'
                                : 'opacity-0'}"
                            />
                            {collection.name}
                          </Command.Item>
                        {/each}
                      </Command.List>
                    </Command.Root>
                  </Popover.Content>
                </Popover.Root>
                {#if selectedCollectionIds.length > 0}
                  <div class="mt-4 flex flex-wrap gap-1">
                    {#each selectedCollectionIds as id}
                      <Badge variant="secondary" class="gap-1 text-sm">
                        {getCollectionName(id)}
                        <button
                          type="button"
                          onclick={() => toggleCollection(id)}
                          class="ml-0.5 rounded-full hover:bg-muted-strong"
                        >
                          <X class="h-3 w-3" />
                        </button>
                      </Badge>
                    {/each}
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        {:else}
          <input type="hidden" name="appliesTo" value="all" />
        {/if}

        <!-- Conditions -->
        <div class="rounded-lg bg-surface p-6 shadow">
          <h2 class="mb-4 text-lg font-semibold">Conditions</h2>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label
                for="minOrderAmount"
                class="mb-1 block text-sm font-medium text-foreground-secondary"
              >
                Min Order (EUR)
              </label>
              <input
                type="number"
                id="minOrderAmount"
                name="minOrderAmount"
                placeholder="Optional"
                min="0"
                step="0.01"
                class="w-full rounded-lg border border-input-border px-3 py-2"
              />
            </div>
            <div>
              <label
                for="usageLimit"
                class="mb-1 block text-sm font-medium text-foreground-secondary"
              >
                Total Usage Limit
              </label>
              <input
                type="number"
                id="usageLimit"
                name="usageLimit"
                placeholder="Unlimited"
                min="0"
                class="w-full rounded-lg border border-input-border px-3 py-2"
              />
            </div>
            <div>
              <label
                for="usageLimitPerCustomer"
                class="mb-1 block text-sm font-medium text-foreground-secondary"
              >
                Per Customer Limit
              </label>
              <input
                type="number"
                id="usageLimitPerCustomer"
                name="usageLimitPerCustomer"
                placeholder="Unlimited"
                min="0"
                class="w-full rounded-lg border border-input-border px-3 py-2"
              />
            </div>
          </div>
        </div>

        <!-- Active Dates -->
        <div class="rounded-lg bg-surface p-6 shadow">
          <h2 class="mb-4 text-lg font-semibold">Active Dates</h2>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label
                for="startsAt"
                class="mb-1 block text-sm font-medium text-foreground-secondary"
              >
                Starts At
              </label>
              <input
                type="datetime-local"
                id="startsAt"
                name="startsAt"
                class="w-full rounded-lg border border-input-border px-3 py-2"
              />
            </div>
            <div>
              <label for="endsAt" class="mb-1 block text-sm font-medium text-foreground-secondary">
                Ends At
              </label>
              <input
                type="datetime-local"
                id="endsAt"
                name="endsAt"
                class="w-full rounded-lg border border-input-border px-3 py-2"
              />
            </div>
          </div>
          <p class="mt-2 text-xs text-muted-foreground">
            Leave empty for no start/end date restrictions.
          </p>
        </div>
      </div>

      <!-- Right Sidebar -->
      <div class="w-80 shrink-0 space-y-6">
        <!-- Combination Settings -->
        <div class="rounded-lg bg-surface p-6 shadow">
          <h2 class="mb-4 text-lg font-semibold">Combinations</h2>
          <label class="flex items-center gap-2">
            <input
              type="checkbox"
              name="combinesWithOtherPromotions"
              class="h-4 w-4 rounded border-input-border"
            />
            <span class="text-sm">Combines with other promotions</span>
          </label>
          <p class="mt-2 text-xs text-muted-foreground">
            When enabled, this promotion can be used alongside other promotions on the same order.
          </p>
        </div>

        <!-- Summary -->
        <div class="rounded-lg bg-surface p-6 shadow">
          <h2 class="mb-4 text-lg font-semibold">Summary</h2>
          <div class="space-y-2 text-sm text-foreground-tertiary">
            <p>
              <span class="font-medium text-foreground">Method:</span>
              <Badge variant="outline">{method === "code" ? "Discount code" : "Automatic"}</Badge>
            </p>
            <p>
              <span class="font-medium text-foreground">Type:</span>
              <Badge variant="outline">{typeLabels[promotionType]}</Badge>
            </p>
            {#if promotionType !== "free_shipping"}
              <p>
                <span class="font-medium text-foreground">Discount:</span>
                {discountType === "percentage" ? "Percentage off" : "Fixed amount off"}
              </p>
            {/if}
            {#if promotionType === "product"}
              <p>
                <span class="font-medium text-foreground">Applies to:</span>
                {appliesTo === "all"
                  ? "All products"
                  : appliesTo === "specific_products"
                    ? `${selectedProductIds.length} product(s)`
                    : `${selectedCollectionIds.length} collection(s)`}
              </p>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </form>
</div>
