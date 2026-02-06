<script lang="ts">
  import { enhance } from "$app/forms";
  import { toast } from "svelte-sonner";
  import { Button } from "$lib/components/admin/ui/button";
  import DeleteConfirmDialog from "$lib/components/admin/DeleteConfirmDialog.svelte";
  import * as Popover from "$lib/components/admin/ui/popover";
  import * as Command from "$lib/components/admin/ui/command";
  import Check from "@lucide/svelte/icons/check";
  import ChevronsUpDown from "@lucide/svelte/icons/chevrons-up-down";
  import X from "@lucide/svelte/icons/x";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  $effect(() => {
    if (form?.success) toast.success("Variant updated successfully");
    if (form?.error) toast.error(form.error);
  });

  let isSubmitting = $state(false);
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
</script>

<svelte:head>
  <title>Edit Variant {data.variant.sku} | {data.product.name} | Admin</title>
</svelte:head>

<div>
  <div class="mb-6">
    <div class="mb-4">
      <a href="/admin/products/{data.product.id}" class="text-sm text-blue-600 hover:underline">
        &larr; Back to {data.product.name}
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
  <div class="flex gap-6">
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
        class="rounded-lg bg-white shadow"
      >
        <div class="space-y-4 p-6">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="variant_name" class="mb-1 block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                id="variant_name"
                name="variant_name"
                value={variantName}
                class="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label for="sku" class="mb-1 block text-sm font-medium text-gray-700">
                SKU <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={data.variant.sku}
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
          </div>
        </div>
      </form>

      <!-- Price and Stock -->
      <div class="rounded-lg bg-white shadow">
        <div class="space-y-4 p-6">
          <h2 class="text-lg font-semibold">Price and stock</h2>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="price" class="mb-1 block text-sm font-medium text-gray-700">
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
                class="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label for="stock" class="mb-1 block text-sm font-medium text-gray-700">
                Stock
              </label>
              <input
                type="number"
                id="stock"
                name="stock"
                form="variant-form"
                min="0"
                value={data.variant.stock}
                class="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sidebar (Right) -->
    <div class="w-80 shrink-0 space-y-6">
      <!-- Facet Values Section -->
      <div class="rounded-lg bg-white shadow">
        <div class="border-b border-gray-200 px-4 py-3">
          <h2 class="font-semibold">Facet Values</h2>
        </div>

        <div class="p-4">
          {#if data.facets.length === 0}
            <p class="text-sm text-gray-500">No facets defined.</p>
          {:else}
            <!-- Combobox -->
            <Popover.Root bind:open={facetComboboxOpen}>
              <Popover.Trigger
                class="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
                aria-expanded={facetComboboxOpen}
                aria-controls="facet-listbox"
                aria-haspopup="listbox"
              >
                <span class="text-gray-500">Select facet values...</span>
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
                  <span
                    class="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800"
                  >
                    {fv.facetName}: {fv.name}
                    <button
                      type="button"
                      onclick={() => removeFacetValue(fv.id)}
                      class="ml-0.5 rounded-full p-0.5 hover:bg-blue-200"
                      aria-label="Remove {fv.name}"
                    >
                      <X class="h-3 w-3" />
                    </button>
                  </span>
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
      <div class="rounded-lg bg-white shadow">
        <div class="border-b border-gray-200 px-4 py-3">
          <h2 class="font-semibold">Parent Product</h2>
        </div>
        <div class="p-4">
          <a href="/admin/products/{data.product.id}" class="text-sm text-blue-600 hover:underline">
            {data.product.name} &rarr;
          </a>
        </div>
      </div>
    </div>
  </div>

  <button
    type="button"
    class="mt-6 text-sm text-red-600 hover:text-red-800"
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
