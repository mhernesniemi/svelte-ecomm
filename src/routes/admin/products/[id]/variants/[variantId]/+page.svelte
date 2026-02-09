<script lang="ts">
  import { enhance } from "$app/forms";
  import { toast } from "svelte-sonner";
  import { Button } from "$lib/components/admin/ui/button";
  import DeleteConfirmDialog from "$lib/components/admin/DeleteConfirmDialog.svelte";
  import * as Popover from "$lib/components/admin/ui/popover";
  import * as Command from "$lib/components/admin/ui/command";
  import Check from "@lucide/svelte/icons/check";
  import ChevronsUpDown from "@lucide/svelte/icons/chevrons-up-down";
  import { Checkbox } from "$lib/components/admin/ui/checkbox";
  import { Badge } from "$lib/components/admin/ui/badge";
  import X from "@lucide/svelte/icons/x";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  $effect(() => {
    if (form?.success) toast.success("Variant updated successfully");
    if (form?.error) toast.error(form.error);
  });

  let isSubmitting = $state(false);
  let trackInventory = $state(data.variant.trackInventory);
  let showDelete = $state(false);
  let facetComboboxOpen = $state(false);

  // Get the English translation name
  const variantName = $derived(
    data.variant.translations.find((t) => t.languageCode === "en")?.name ?? ""
  );

  // Facet value selections - initialize from current variant data
  let selectedFacetValues = $state<number[]>([]);

  $effect(() => {
    selectedFacetValues = data.variant.facetValues.map((fv) => fv.id);
  });

  // Flatten facet values for combobox display
  type FlatFacetValue = {
    id: number;
    name: string;
    facetName: string;
  };

  const flatFacetValues: FlatFacetValue[] = $derived(
    data.facets.flatMap((facet) => {
      const facetName = facet.translations.find((t) => t.languageCode === "en")?.name ?? facet.code;
      return facet.values.map((value) => ({
        id: value.id,
        name: value.translations.find((t) => t.languageCode === "en")?.name ?? value.code,
        facetName
      }));
    })
  );

  function getSelectedFacetValueObjects() {
    return flatFacetValues.filter((fv) => selectedFacetValues.includes(fv.id));
  }

  function toggleFacetValue(id: number) {
    if (selectedFacetValues.includes(id)) {
      selectedFacetValues = selectedFacetValues.filter((fv) => fv !== id);
    } else {
      selectedFacetValues = [...selectedFacetValues, id];
    }
  }

  function removeFacetValue(id: number) {
    selectedFacetValues = selectedFacetValues.filter((fv) => fv !== id);
  }

  // Group pricing — all client-side, saved with main form
  let groupPricingEnabled = $state(data.groupPrices.length > 0);
  let groupPrices = $state<{ groupId: number; price: string }[]>(
    data.groupPrices.map((gp) => ({ groupId: gp.groupId, price: (gp.price / 100).toFixed(2) }))
  );
  let newGroupId = $state<number | null>(null);
  let newGroupPrice = $state("");

  const availableGroups = $derived(
    data.customerGroups.filter((g) => !groupPrices.some((gp) => gp.groupId === g.id))
  );

  function addGroupPrice() {
    const groupId = newGroupId ?? availableGroups[0]?.id;
    if (!groupId || !newGroupPrice) return;
    groupPrices = [...groupPrices, { groupId, price: newGroupPrice }];
    newGroupPrice = "";
    newGroupId = null;
  }

  function removeGroupPrice(groupId: number) {
    groupPrices = groupPrices.filter((gp) => gp.groupId !== groupId);
  }
</script>

<svelte:head>
  <title>Edit Variant {data.variant.sku} | {data.product.name} | Admin</title>
</svelte:head>

<div>
  <div class="mb-6">
    <div class="mb-4">
      <a
        href="/admin/products/{data.product.id}"
        class="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
      >
        <ChevronLeft class="h-4 w-4" /> Back to {data.product.name}
      </a>
    </div>
    <div class="mt-2 flex items-center justify-between">
      <h1 class="text-2xl font-bold">Edit Variant</h1>
      <Button type="submit" form="variant-form" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  </div>

  <!-- Two Column Layout -->
  <div class="flex flex-col gap-6 lg:flex-row">
    <!-- Main Content (Left) -->
    <div class="flex-1 space-y-6">
      <!-- Variant Details -->
      <form
        id="variant-form"
        method="POST"
        action="?/update"
        use:enhance={() => {
          isSubmitting = true;
          return async ({ update }) => {
            isSubmitting = false;
            await update({ reset: false });
          };
        }}
        class="rounded-lg bg-surface shadow"
      >
        <div class="space-y-4 p-6">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label
                for="variant_name"
                class="mb-1 block text-sm font-medium text-foreground-secondary"
              >
                Name
              </label>
              <input
                type="text"
                id="variant_name"
                name="variant_name"
                value={variantName}
                class="w-full rounded-lg border border-input-border px-3 py-2"
              />
            </div>
            <div>
              <label for="sku" class="mb-1 block text-sm font-medium text-foreground-secondary">
                SKU <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={data.variant.sku}
                required
                class="w-full rounded-lg border border-input-border px-3 py-2"
              />
            </div>
          </div>
        </div>
      </form>

      <!-- Price and Stock -->
      <div class="rounded-lg bg-surface shadow">
        <div class="flex flex-col gap-6 p-6">
          <h2 class="text-lg font-semibold">Stock and price</h2>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="stock" class="mb-1 block text-sm font-medium text-foreground-secondary">
                Stock
              </label>
              {#if trackInventory}
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  form="variant-form"
                  min="0"
                  value={data.variant.stock}
                  class="w-full rounded-lg border border-input-border px-3 py-2"
                />
              {:else}
                <input
                  type="text"
                  id="stock"
                  disabled
                  placeholder="Unlimited"
                  class="w-full rounded-lg border border-input-border bg-muted px-3 py-2 text-muted-foreground placeholder:text-muted-foreground"
                />
              {/if}
            </div>
            <div>
              <label for="price" class="mb-1 block text-sm font-medium text-foreground-secondary">
                Price (EUR) <span class="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="price"
                name="price"
                form="variant-form"
                step="0.01"
                min="0"
                value={(data.variant.price / 100).toFixed(2)}
                required
                class="w-full rounded-lg border border-input-border px-3 py-2"
              />
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Checkbox id="trackInventory" bind:checked={trackInventory} />
            <label for="trackInventory" class="text-sm text-foreground-secondary">
              Track inventory
            </label>
          </div>
          {#if trackInventory}
            <input type="hidden" name="trackInventory" value="on" form="variant-form" />
          {/if}
        </div>
      </div>

      <!-- Group Pricing -->
      <div class="rounded-lg bg-surface shadow">
        <div class="flex flex-col gap-4 p-6">
          <h2 class="text-lg font-semibold">Group Pricing</h2>

          <div class="flex items-center gap-2">
            <Checkbox id="groupPricingEnabled" bind:checked={groupPricingEnabled} />
            <label for="groupPricingEnabled" class="text-sm text-foreground-secondary">
              Enable customer group based pricing
            </label>
          </div>

          {#if groupPricingEnabled}
            {#if data.customerGroups.length === 0}
              <p class="text-sm text-muted-foreground">
                No customer groups exist.
                <a
                  href="/admin/customers/groups"
                  class="text-blue-600 hover:underline dark:text-blue-400"
                >
                  Create one
                </a>
                to set group-specific prices.
              </p>
            {:else}
              <div class="space-y-4">
                <!-- Column headers -->
                <div class="grid grid-cols-2 gap-4">
                  <span class="text-sm font-medium text-foreground-secondary">Group</span>
                  <span class="text-sm font-medium text-foreground-secondary">Price (EUR)</span>
                </div>

                <!-- Existing group prices -->
                {#each groupPrices as gp}
                  {@const group = data.customerGroups.find((g) => g.id === gp.groupId)}
                  <div class="grid grid-cols-2 gap-4">
                    <div
                      class="flex h-10 items-center rounded-lg border border-input-border bg-muted px-3 text-sm text-muted-foreground"
                    >
                      {group?.name ?? `Group #${gp.groupId}`}
                    </div>
                    <div class="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        bind:value={gp.price}
                        class="h-10 w-full rounded-lg border border-input-border px-3 text-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        class="h-10 w-10 shrink-0"
                        onclick={() => removeGroupPrice(gp.groupId)}
                      >
                        <Trash2 class="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                {/each}

                <!-- Add row -->
                {#if availableGroups.length > 0}
                  <div class="grid grid-cols-2 gap-4">
                    <select
                      bind:value={newGroupId}
                      class="h-10 w-full rounded-lg border border-input-border px-3 text-sm"
                    >
                      {#each availableGroups as group}
                        <option value={group.id}>{group.name}</option>
                      {/each}
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      bind:value={newGroupPrice}
                      placeholder="0.00"
                      class="h-10 w-full rounded-lg border border-input-border px-3 text-sm"
                    />
                  </div>
                  <div>
                    <Button type="button" variant="outline" size="sm" onclick={addGroupPrice}>
                      Add Price
                    </Button>
                  </div>
                {/if}
              </div>
            {/if}
          {/if}

          <!-- Hidden inputs for main form -->
          {#if groupPricingEnabled}
            <input form="variant-form" type="hidden" name="groupPricingEnabled" value="on" />
            {#each groupPrices as gp}
              <input
                form="variant-form"
                type="hidden"
                name="groupPriceGroupId"
                value={gp.groupId}
              />
              <input form="variant-form" type="hidden" name="groupPricePrice" value={gp.price} />
            {/each}
          {/if}
        </div>
      </div>
    </div>

    <!-- Sidebar (Right) -->
    <div class="w-full space-y-6 lg:w-80 lg:shrink-0">
      <!-- Facet Values Section -->
      <div class="rounded-lg bg-surface shadow">
        <div class="border-b border-border px-4 py-3">
          <h2 class="font-semibold">Facet Values</h2>
        </div>

        <div class="p-4">
          {#if data.facets.length === 0}
            <p class="text-sm text-muted-foreground">No facets defined.</p>
          {:else}
            <!-- Combobox -->
            <Popover.Root bind:open={facetComboboxOpen}>
              <Popover.Trigger
                class="flex w-full items-center justify-between rounded-lg border border-input-border bg-surface px-3 py-2 text-sm hover:bg-hover"
                aria-expanded={facetComboboxOpen}
                aria-controls="facet-listbox"
                aria-haspopup="listbox"
              >
                <span class="text-muted-foreground">Select facet values...</span>
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Popover.Trigger>
              <Popover.Content class="w-72 p-0" align="start">
                <Command.Root>
                  <Command.Input placeholder="Search facet values..." />
                  <Command.List id="facet-listbox" class="max-h-64">
                    <Command.Empty>No facet value found.</Command.Empty>
                    {#each data.facets as facet}
                      {@const facetName =
                        facet.translations.find((t) => t.languageCode === "en")?.name ?? facet.code}
                      {#if facet.values.length > 0}
                        <Command.Group heading={facetName}>
                          {#each facet.values as value}
                            {@const valueName =
                              value.translations.find((t) => t.languageCode === "en")?.name ??
                              value.code}
                            <Command.Item
                              value="{facetName} {valueName}"
                              onSelect={() => toggleFacetValue(value.id)}
                              class="cursor-pointer"
                            >
                              <div class="flex w-full items-center gap-2">
                                <div class="flex h-4 w-4 items-center justify-center">
                                  {#if selectedFacetValues.includes(value.id)}
                                    <Check class="h-4 w-4" />
                                  {/if}
                                </div>
                                <span>{valueName}</span>
                              </div>
                            </Command.Item>
                          {/each}
                        </Command.Group>
                      {/if}
                    {/each}
                  </Command.List>
                </Command.Root>
              </Popover.Content>
            </Popover.Root>

            <!-- Selected facet values -->
            {#if selectedFacetValues.length > 0}
              <div class="mt-3 flex flex-wrap gap-1.5">
                {#each getSelectedFacetValueObjects() as fv}
                  <Badge class="gap-1">
                    {fv.facetName}: {fv.name}
                    <button
                      type="button"
                      onclick={() => removeFacetValue(fv.id)}
                      class="ml-0.5 rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-500/20"
                      aria-label="Remove {fv.name}"
                    >
                      <X class="h-3 w-3" />
                    </button>
                  </Badge>
                {/each}
              </div>
            {/if}

            <!-- Hidden inputs to submit with the variant form -->
            {#each selectedFacetValues as fvId}
              <input form="variant-form" type="hidden" name="facetValueIds" value={fvId} />
            {/each}
          {/if}
        </div>
      </div>

      <!-- Parent Product -->
      <div class="rounded-lg bg-surface shadow">
        <div class="border-b border-border px-4 py-3">
          <h2 class="font-semibold">Parent Product</h2>
        </div>
        <div class="p-4">
          <a
            href="/admin/products/{data.product.id}"
            class="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            {data.product.name}
          </a>
        </div>
      </div>
    </div>
  </div>

  <button
    type="button"
    class="mt-6 text-sm text-red-600 hover:text-red-800 dark:text-red-700"
    onclick={() => (showDelete = true)}
  >
    Delete this variant
  </button>
</div>

<DeleteConfirmDialog
  bind:open={showDelete}
  title="Delete Variant?"
  description="Are you sure you want to delete variant &quot;{data.variant
    .sku}&quot;? This action cannot be undone."
/>
