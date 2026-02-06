<script lang="ts">
  import { enhance } from "$app/forms";
  import { Button, buttonVariants } from "$lib/components/admin/ui/button";
  import { Badge } from "$lib/components/admin/ui/badge";
  import * as Dialog from "$lib/components/admin/ui/dialog";
  import type { PageData, ActionData } from "./$types";
  import { toast } from "svelte-sonner";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let promo = $derived(data.promotion);

  let discountType = $state(promo.discountType);
  let appliesTo = $state(promo.appliesTo);
  let selectedProductIds = $state<number[]>(promo.products.map((p) => p.productId));
  let selectedCollectionIds = $state<number[]>(promo.collections.map((c) => c.collectionId));
  let showDelete = $state(false);

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

  function formatPrice(cents: number): string {
    return (cents / 100).toFixed(2);
  }

  function formatDateForInput(date: Date | null): string {
    if (!date) return "";
    const d = new Date(date);
    // Format as YYYY-MM-DDTHH:mm for datetime-local input
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  const typeLabels: Record<string, string> = {
    order: "Amount off order",
    product: "Amount off products",
    free_shipping: "Free shipping"
  };

  const promoStatus = $derived.by(() => {
    if (!promo.enabled) return { label: "Disabled", variant: "secondary" as const };
    const now = new Date();
    if (promo.startsAt && new Date(promo.startsAt) > now) return { label: "Scheduled", variant: "warning" as const };
    if (promo.endsAt && new Date(promo.endsAt) < now) return { label: "Expired", variant: "destructive" as const };
    return { label: "Active", variant: "success" as const };
  });

  $effect(() => {
    if (form?.success) {
      toast.success("Promotion updated");
    }
  });
</script>

<svelte:head><title>Edit {promo.code} | Admin</title></svelte:head>

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
      <h1 class="text-2xl font-bold text-gray-900">{promo.code}</h1>
      <Badge variant="outline">{typeLabels[promo.promotionType]}</Badge>
      <Badge variant={promoStatus.variant}>{promoStatus.label}</Badge>
    </div>
    <div class="flex items-center gap-3">
      <Button type="button" variant="destructive" onclick={() => (showDelete = true)}>Delete</Button>
      <a href="/admin/promotions" class={buttonVariants({ variant: "outline" })}>Cancel</a>
      <Button type="submit" form="edit-form">Save Changes</Button>
    </div>
  </div>

  {#if form?.error}
    <div class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {form.error}
    </div>
  {/if}

  <form
    method="POST"
    action="?/update"
    use:enhance={() => {
      return async ({ update }) => {
        await update({ reset: false });
      };
    }}
    id="edit-form"
  >
    <input type="hidden" name="productIds" value={JSON.stringify(selectedProductIds)} />
    <input type="hidden" name="collectionIds" value={JSON.stringify(selectedCollectionIds)} />

    <div class="flex gap-6">
      <!-- Left Column -->
      <div class="flex-1 space-y-6">
        <!-- Code (read-only) -->
        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="mb-4 text-lg font-semibold">Promotion Code</h2>
          <div>
            <label for="code" class="mb-1 block text-sm font-medium text-gray-700">Code</label>
            <input
              type="text"
              id="code"
              value={promo.code}
              disabled
              class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500"
            />
          </div>
        </div>

        <!-- Discount (hidden for free_shipping) -->
        {#if promo.promotionType !== "free_shipping"}
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
                  value={promo.discountType === "fixed_amount" ? formatPrice(promo.discountValue) : promo.discountValue}
                  min="0"
                  step={discountType === "percentage" ? "1" : "0.01"}
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
        {#if promo.promotionType === "product"}
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
                value={promo.minOrderAmount ? formatPrice(promo.minOrderAmount) : ""}
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
                value={promo.usageLimit ?? ""}
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
                value={promo.usageLimitPerCustomer ?? ""}
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
                value={formatDateForInput(promo.startsAt)}
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
                value={formatDateForInput(promo.endsAt)}
                class="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
          </div>
          <p class="mt-2 text-xs text-gray-500">Leave empty for no start/end date restrictions.</p>
        </div>
      </div>

      <!-- Right Sidebar -->
      <div class="w-80 shrink-0 space-y-6">
        <!-- Status -->
        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="mb-4 text-lg font-semibold">Status</h2>
          <label class="flex items-center gap-2">
            <input
              type="checkbox"
              name="enabled"
              checked={promo.enabled}
              class="h-4 w-4 rounded border-gray-300"
            />
            <span class="text-sm">Enabled</span>
          </label>
        </div>

        <!-- Combination Settings -->
        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="mb-4 text-lg font-semibold">Combinations</h2>
          <label class="flex items-center gap-2">
            <input
              type="checkbox"
              name="combinesWithOtherPromotions"
              checked={promo.combinesWithOtherPromotions}
              class="h-4 w-4 rounded border-gray-300"
            />
            <span class="text-sm">Combines with other promotions</span>
          </label>
          <p class="mt-2 text-xs text-gray-500">
            When enabled, this promotion can be used alongside other promotions on the same order.
          </p>
        </div>

        <!-- Usage Info -->
        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="mb-4 text-lg font-semibold">Usage</h2>
          <p class="text-sm text-gray-600">
            Used <span class="font-medium text-gray-900">{promo.usageCount}</span> time{promo.usageCount !== 1 ? "s" : ""}
            {#if promo.usageLimit}
              out of {promo.usageLimit}
            {/if}
          </p>
        </div>

      </div>
    </div>
  </form>
</div>

<!-- Delete Confirmation Dialog -->
<Dialog.Root bind:open={showDelete}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Delete Promotion?</Dialog.Title>
      <Dialog.Description>
        This will permanently delete the promotion code <strong>{promo.code}</strong>. This action cannot be undone.
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (showDelete = false)}>Cancel</Button>
      <form method="POST" action="?/delete" use:enhance>
        <Button type="submit" variant="destructive">Delete</Button>
      </form>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
