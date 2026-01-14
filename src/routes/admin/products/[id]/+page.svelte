<script lang="ts">
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let activeTab = $state<"en" | "fi">("en");
  let showDeleteConfirm = $state(false);
  let showAddVariant = $state(false);
  let editingVariantFacets = $state<number | null>(null);

  function getTranslation(lang: string) {
    return data.product.translations.find((t) => t.languageCode === lang);
  }

  const enTrans = getTranslation("en");
  const fiTrans = getTranslation("fi");
</script>

<div>
  <div class="mb-8">
    <a href="/admin/products" class="text-sm text-blue-600 hover:underline"
      >&larr; Back to Products</a
    >
    <h1 class="mt-2 text-2xl font-bold">Edit Product</h1>
  </div>

  {#if form?.success}
    <div class="mb-6 rounded border border-green-200 bg-green-50 px-4 py-3 text-green-700">
      Product updated successfully
    </div>
  {/if}

  {#if form?.error}
    <div class="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
      {form.error}
    </div>
  {/if}

  <!-- Product Form -->
  <form method="POST" action="?/update" class="mb-8 rounded-lg bg-white shadow">
    <!-- Language Tabs -->
    <div class="border-b">
      <div class="flex">
        <button
          type="button"
          onclick={() => (activeTab = "en")}
          class="px-6 py-3 text-sm font-medium {activeTab === 'en'
            ? 'border-b-2 border-blue-500 text-blue-600'
            : 'text-gray-500 hover:text-gray-700'}"
        >
          English
        </button>
        <button
          type="button"
          onclick={() => (activeTab = "fi")}
          class="px-6 py-3 text-sm font-medium {activeTab === 'fi'
            ? 'border-b-2 border-blue-500 text-blue-600'
            : 'text-gray-500 hover:text-gray-700'}"
        >
          Finnish
        </button>
      </div>
    </div>

    <div class="space-y-6 p-6">
      <!-- English Fields -->
      <div class={activeTab === "en" ? "" : "hidden"}>
        <div class="space-y-4">
          <div>
            <label for="name_en" class="mb-1 block text-sm font-medium text-gray-700">
              Name <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name_en"
              name="name_en"
              value={enTrans?.name ?? ""}
              required
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label for="slug_en" class="mb-1 block text-sm font-medium text-gray-700">
              Slug <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="slug_en"
              name="slug_en"
              value={enTrans?.slug ?? ""}
              required
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label for="description_en" class="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description_en"
              name="description_en"
              rows="4"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              >{enTrans?.description ?? ""}</textarea
            >
          </div>
        </div>
      </div>

      <!-- Finnish Fields -->
      <div class={activeTab === "fi" ? "" : "hidden"}>
        <div class="space-y-4">
          <div>
            <label for="name_fi" class="mb-1 block text-sm font-medium text-gray-700"> Name </label>
            <input
              type="text"
              id="name_fi"
              name="name_fi"
              value={fiTrans?.name ?? ""}
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label for="slug_fi" class="mb-1 block text-sm font-medium text-gray-700"> Slug </label>
            <input
              type="text"
              id="slug_fi"
              name="slug_fi"
              value={fiTrans?.slug ?? ""}
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label for="description_fi" class="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description_fi"
              name="description_fi"
              rows="4"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              >{fiTrans?.description ?? ""}</textarea
            >
          </div>
        </div>
      </div>

      <!-- Common Fields -->
      <div class="border-t pt-6">
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            name="enabled"
            checked={data.product.enabled}
            class="rounded border-gray-300 text-blue-600"
          />
          <span class="text-sm font-medium text-gray-700">Product is active</span>
        </label>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-between border-t bg-gray-50 px-6 py-4">
      <button
        type="button"
        onclick={() => (showDeleteConfirm = true)}
        class="px-4 py-2 text-red-600 hover:text-red-800"
      >
        Delete Product
      </button>
      <button type="submit" class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
        Save Changes
      </button>
    </div>
  </form>

  <!-- Facet Values Section -->
  <div class="mb-8 rounded-lg bg-white shadow">
    <div class="border-b px-6 py-4">
      <h2 class="text-lg font-semibold">Facet Values</h2>
      <p class="text-sm text-gray-500">Assign attributes to this product for filtering</p>
    </div>

    {#if form?.facetSuccess}
      <div class="mx-6 mt-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-green-700">
        Facet values updated
      </div>
    {/if}

    <form method="POST" action="?/updateFacetValues" class="p-6">
      {#if data.facets.length === 0}
        <p class="text-gray-500">No facets defined. Create facets first in the Facets section.</p>
      {:else}
        <div class="space-y-6">
          {#each data.facets as facet}
            {@const facetName =
              facet.translations.find((t) => t.languageCode === "en")?.name ?? facet.code}
            <div>
              <p class="mb-2 text-sm font-medium text-gray-700">{facetName}</p>
              {#if facet.values.length === 0}
                <p class="text-sm text-gray-400">No values defined for this facet</p>
              {:else}
                <div class="flex flex-wrap gap-2">
                  {#each facet.values as value}
                    {@const valueName =
                      value.translations.find((t) => t.languageCode === "en")?.name ?? value.code}
                    {@const isSelected = data.product.facetValues.some((fv) => fv.id === value.id)}
                    <label
                      class="inline-flex cursor-pointer items-center rounded-full px-3 py-1.5 text-sm transition-colors {isSelected
                        ? 'border-2 border-blue-300 bg-blue-100 text-blue-800'
                        : 'border-2 border-transparent bg-gray-100 text-gray-700 hover:bg-gray-200'}"
                    >
                      <input
                        type="checkbox"
                        name="facetValueIds"
                        value={value.id}
                        checked={isSelected}
                        class="sr-only"
                      />
                      {valueName}
                    </label>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>
        <div class="mt-6 border-t pt-4">
          <button
            type="submit"
            class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Save Facet Values
          </button>
        </div>
      {/if}
    </form>
  </div>

  <!-- Variants Section -->
  <div class="rounded-lg bg-white shadow">
    <div class="flex items-center justify-between border-b px-6 py-4">
      <h2 class="text-lg font-semibold">Variants</h2>
      <button
        type="button"
        onclick={() => (showAddVariant = !showAddVariant)}
        class="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
      >
        Add Variant
      </button>
    </div>

    {#if form?.variantSuccess}
      <div class="mx-6 mt-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-green-700">
        Variant added successfully
      </div>
    {/if}

    {#if form?.variantError}
      <div class="mx-6 mt-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
        {form.variantError}
      </div>
    {/if}

    <!-- Add Variant Form -->
    {#if showAddVariant}
      <form method="POST" action="?/addVariant" class="border-b bg-gray-50 p-6">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label for="variant_sku" class="mb-1 block text-sm font-medium text-gray-700"
              >SKU *</label
            >
            <input
              type="text"
              id="variant_sku"
              name="sku"
              required
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label for="variant_price" class="mb-1 block text-sm font-medium text-gray-700"
              >Price *</label
            >
            <input
              type="number"
              id="variant_price"
              name="price"
              step="0.01"
              min="0"
              required
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label for="variant_stock" class="mb-1 block text-sm font-medium text-gray-700"
              >Stock</label
            >
            <input
              type="number"
              id="variant_stock"
              name="stock"
              min="0"
              value="0"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label for="variant_name_en" class="mb-1 block text-sm font-medium text-gray-700"
              >Name (EN)</label
            >
            <input
              type="text"
              id="variant_name_en"
              name="variant_name_en"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onclick={() => (showAddVariant = false)}
            class="rounded border px-3 py-1 text-sm"
          >
            Cancel
          </button>
          <button type="submit" class="rounded bg-blue-600 px-3 py-1 text-sm text-white">
            Add Variant
          </button>
        </div>
      </form>
    {/if}

    {#if form?.variantFacetSuccess}
      <div class="mx-6 mt-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-green-700">
        Variant facet values updated
      </div>
    {/if}

    <!-- Variants Table -->
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Facets</th>
          <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200">
        {#if data.product.variants.length === 0}
          <tr>
            <td colspan="6" class="px-6 py-8 text-center text-gray-500">
              No variants yet. Add a variant to start selling this product.
            </td>
          </tr>
        {:else}
          {#each data.product.variants as variant}
            <tr>
              <td class="px-6 py-4 font-mono text-sm">{variant.sku}</td>
              <td class="px-6 py-4 text-sm">
                {variant.translations.find((t) => t.languageCode === "en")?.name ?? "-"}
              </td>
              <td class="px-6 py-4 text-sm">{(variant.price / 100).toFixed(2)} EUR</td>
              <td class="px-6 py-4 text-sm">{variant.stock}</td>
              <td class="px-6 py-4 text-sm">
                {#if variant.facetValues.length === 0}
                  <span class="text-gray-400">None</span>
                {:else}
                  <div class="flex flex-wrap gap-1">
                    {#each variant.facetValues as fv}
                      {@const name =
                        fv.translations.find((t) => t.languageCode === "en")?.name ?? fv.code}
                      <span class="rounded bg-gray-100 px-2 py-0.5 text-xs">{name}</span>
                    {/each}
                  </div>
                {/if}
              </td>
              <td class="px-6 py-4 text-right text-sm">
                <button
                  type="button"
                  onclick={() =>
                    (editingVariantFacets =
                      editingVariantFacets === variant.id ? null : variant.id)}
                  class="text-blue-600 hover:text-blue-800"
                >
                  {editingVariantFacets === variant.id ? "Cancel" : "Edit Facets"}
                </button>
              </td>
            </tr>
            {#if editingVariantFacets === variant.id}
              <tr class="bg-gray-50">
                <td colspan="6" class="px-6 py-4">
                  <form method="POST" action="?/updateVariantFacetValues">
                    <input type="hidden" name="variantId" value={variant.id} />
                    <div class="space-y-4">
                      {#each data.facets as facet}
                        {@const facetName =
                          facet.translations.find((t) => t.languageCode === "en")?.name ??
                          facet.code}
                        <div>
                          <p class="mb-2 text-sm font-medium text-gray-700">{facetName}</p>
                          {#if facet.values.length === 0}
                            <p class="text-sm text-gray-400">No values</p>
                          {:else}
                            <div class="flex flex-wrap gap-2">
                              {#each facet.values as value}
                                {@const valueName =
                                  value.translations.find((t) => t.languageCode === "en")?.name ??
                                  value.code}
                                {@const isSelected = variant.facetValues.some(
                                  (fv) => fv.id === value.id
                                )}
                                <label
                                  class="inline-flex cursor-pointer items-center rounded-full px-3 py-1.5 text-sm transition-colors {isSelected
                                    ? 'border-2 border-blue-300 bg-blue-100 text-blue-800'
                                    : 'border-2 border-transparent bg-gray-100 text-gray-700 hover:bg-gray-200'}"
                                >
                                  <input
                                    type="checkbox"
                                    name="facetValueIds"
                                    value={value.id}
                                    checked={isSelected}
                                    class="sr-only"
                                  />
                                  {valueName}
                                </label>
                              {/each}
                            </div>
                          {/if}
                        </div>
                      {/each}
                    </div>
                    <div class="mt-4">
                      <button
                        type="submit"
                        class="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                      >
                        Save Variant Facets
                      </button>
                    </div>
                  </form>
                </td>
              </tr>
            {/if}
          {/each}
        {/if}
      </tbody>
    </table>
  </div>

  <!-- Delete Confirmation Modal -->
  {#if showDeleteConfirm}
    <div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div class="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 class="mb-4 text-lg font-semibold">Delete Product?</h3>
        <p class="mb-6 text-gray-600">
          Are you sure you want to delete this product? This action cannot be undone.
        </p>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            onclick={() => (showDeleteConfirm = false)}
            class="rounded-lg border px-4 py-2"
          >
            Cancel
          </button>
          <form method="POST" action="?/delete" class="inline">
            <button
              type="submit"
              class="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Delete
            </button>
          </form>
        </div>
      </div>
    </div>
  {/if}
</div>
