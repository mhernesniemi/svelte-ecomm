<script lang="ts">
  import { enhance } from "$app/forms";
  import { invalidateAll } from "$app/navigation";
  import { toast } from "svelte-sonner";
  import { Button } from "$lib/components/admin/ui/button";
  import { RichTextEditor } from "$lib/components/admin/ui/rich-text-editor";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import X from "@lucide/svelte/icons/x";
  import ImageIcon from "@lucide/svelte/icons/image";

  let { data, form } = $props();

  // Show toast notifications based on form results
  $effect(() => {
    if (form?.success) toast.success(form.message || "Collection updated");
    if (form?.error) toast.error(form.error);
  });

  let isSubmitting = $state(false);

  // Form values - reset when collection changes
  let name = $state("");
  let slug = $state("");
  let description = $state("");
  let enabled = $state(true);
  let isPrivate = $state(false);

  // Initialize/reset form values when collection data changes
  $effect(() => {
    const trans =
      data.collection.translations.find((t) => t.languageCode === "en") ??
      data.collection.translations[0];
    name = trans?.name ?? "";
    slug = trans?.slug ?? "";
    description = trans?.description ?? "";
    enabled = data.collection.enabled;
    isPrivate = data.collection.isPrivate;
  });

  // Filter builder state
  let newFilterField = $state<string>("");
  let newFilterOperator = $state<string>("in");
  let newFilterValue = $state<string>("");
  let selectedFacetValues = $state<number[]>([]);
  let selectedProducts = $state<number[]>([]);

  import { slugify } from "$lib/utils";

  function getFieldLabel(field: string): string {
    const labels: Record<string, string> = {
      facet: "Facet Values",
      visibility: "Visibility",
      price: "Price",
      stock: "Stock",
      product: "Products",
      variant: "Variants"
    };
    return labels[field] ?? field;
  }

  function getOperatorLabel(operator: string): string {
    const labels: Record<string, string> = {
      eq: "equals",
      in: "in",
      gte: ">=",
      lte: "<=",
      gt: ">"
    };
    return labels[operator] ?? operator;
  }

  function formatFilterValue(field: string, value: unknown): string {
    if (Array.isArray(value)) {
      if (field === "facet") {
        return value
          .map((id) => {
            for (const facet of data.facets) {
              const fv = facet.values.find((v) => v.id === id);
              if (fv) {
                const trans = fv.translations.find((t) => t.languageCode === "en");
                return trans?.name ?? fv.code;
              }
            }
            return `ID: ${id}`;
          })
          .join(", ");
      } else if (field === "product") {
        return value
          .map((id) => {
            const p = data.products.find((p) => p.id === id);
            if (p) {
              const trans = p.translations.find((t) => t.languageCode === "en");
              return trans?.name ?? `Product #${id}`;
            }
            return `ID: ${id}`;
          })
          .join(", ");
      }
      return value.join(", ");
    }
    if (field === "price") {
      return `${((value as number) / 100).toFixed(2)} EUR`;
    }
    return String(value);
  }

  function getProductName(product: (typeof data.products)[0]): string {
    const trans = product.translations.find((t) => t.languageCode === "en");
    return trans?.name ?? `Product #${product.id}`;
  }
</script>

<svelte:head><title>Edit Collection | Admin</title></svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a
        href="/admin/collections"
        class="text-gray-500 hover:text-gray-700"
        aria-label="Back to collections"
      >
        <ChevronLeft class="h-5 w-5" />
      </a>
      <h1 class="text-2xl font-bold text-gray-900">Edit Collection</h1>
    </div>
    <div class="flex items-center gap-4">
      <span class="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
        {data.productCount} products
      </span>
      {#if slug}
        <a
          href="/collections/{data.collection.id}/{slug}"
          target="_blank"
          class="text-sm text-gray-500 hover:text-gray-700"
        >
          View in store &rarr;
        </a>
      {/if}
    </div>
  </div>

  <!-- Basic Info Form -->
  <form
    method="POST"
    action="?/update"
    use:enhance={() => {
      isSubmitting = true;
      return async ({ update }) => {
        isSubmitting = false;
        await update({ reset: false });
      };
    }}
    class="space-y-6"
  >
    <div class="overflow-hidden rounded-lg bg-white shadow">
      <div class="p-6">
        <h2 class="mb-4 text-lg font-medium text-gray-900">Basic Information</h2>

        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="name" class="mb-1 block text-sm font-medium text-gray-700">
                Name <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                bind:value={name}
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm"
              />
            </div>
            <div>
              <label for="slug" class="mb-1 block text-sm font-medium text-gray-700">
                Slug <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                bind:value={slug}
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm"
              />
            </div>
          </div>
          <div>
            <label for="description" class="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <RichTextEditor
              name="description"
              content={description}
              placeholder="Write collection description..."
              onchange={(html) => (description = html)}
            />
          </div>
        </div>

        <div class="mt-6 space-y-4">
          <div class="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              name="enabled"
              bind:checked={enabled}
              class="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <label for="enabled" class="text-sm font-medium text-gray-700">
              Collection is enabled
            </label>
          </div>

          <div class="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_private"
              name="is_private"
              bind:checked={isPrivate}
              class="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <label for="is_private" class="text-sm font-medium text-gray-700">
              Private collection
            </label>
          </div>
        </div>

        <div class="mt-6 flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  </form>

  <!-- Collection Filters -->
  <div class="overflow-hidden rounded-lg bg-white shadow">
    <div class="p-6">
      <h2 class="mb-4 text-lg font-medium text-gray-900">Collection Filters</h2>
      <p class="mb-4 text-sm text-gray-600">
        Products are included in this collection based on these filters. Multiple filters use AND
        logic.
      </p>

      <!-- Existing filters -->
      {#if data.collection.filters.length > 0}
        <div class="mb-6 space-y-2">
          {#each data.collection.filters as filter}
            <div
              class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3"
            >
              <div>
                <span class="font-medium text-gray-900">{getFieldLabel(filter.field)}</span>
                <span class="mx-2 text-gray-500">{getOperatorLabel(filter.operator)}</span>
                <span class="text-gray-700">{formatFilterValue(filter.field, filter.value)}</span>
              </div>
              <form
                method="POST"
                action="?/removeFilter"
                use:enhance={() => {
                  return async ({ result, update }) => {
                    if (result.type === "success") {
                      await invalidateAll();
                    }
                  };
                }}
              >
                <input type="hidden" name="filterId" value={filter.id} />
                <button
                  type="submit"
                  class="rounded p-1 text-red-600 hover:bg-red-50 hover:text-red-800"
                  aria-label="Remove filter"
                >
                  <X class="h-5 w-5" />
                </button>
              </form>
            </div>
          {/each}
        </div>
      {:else}
        <div class="mb-6 rounded-lg border border-dashed border-gray-300 p-6 text-center">
          <p class="text-sm text-gray-500">
            No filters defined. Add filters below to populate this collection.
          </p>
        </div>
      {/if}

      <!-- Add new filter -->
      <form
        method="POST"
        action="?/addFilter"
        use:enhance={() => {
          return async ({ result, update }) => {
            if (result.type === "success") {
              newFilterField = "";
              newFilterOperator = "in";
              newFilterValue = "";
              selectedFacetValues = [];
              selectedProducts = [];
              await invalidateAll();
            }
          };
        }}
        class="rounded-lg border border-gray-200 bg-gray-50 p-4"
      >
        <h3 class="mb-3 text-sm font-medium text-gray-900">Add Filter</h3>

        <div class="mb-4 grid grid-cols-3 gap-4">
          <div>
            <label for="field" class="mb-1 block text-sm font-medium text-gray-700">
              Filter Type
            </label>
            <select
              id="field"
              name="field"
              bind:value={newFilterField}
              class="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm"
            >
              <option value="">Select type...</option>
              <option value="facet">Facet Values</option>
              <option value="price">Price Range</option>
              <option value="stock">Stock Level</option>
              <option value="product">Select Products</option>
              <option value="visibility">Visibility</option>
            </select>
          </div>

          <div>
            <label for="operator" class="mb-1 block text-sm font-medium text-gray-700">
              Operator
            </label>
            <select
              id="operator"
              name="operator"
              bind:value={newFilterOperator}
              class="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm"
            >
              {#if newFilterField === "facet" || newFilterField === "product" || newFilterField === "variant"}
                <option value="in">in (matches any)</option>
              {:else if newFilterField === "price"}
                <option value="gte">greater than or equal</option>
                <option value="lte">less than or equal</option>
              {:else if newFilterField === "stock"}
                <option value="gt">greater than</option>
              {:else if newFilterField === "visibility"}
                <option value="eq">equals</option>
              {:else}
                <option value="in">in</option>
                <option value="eq">equals</option>
                <option value="gte">greater than or equal</option>
                <option value="lte">less than or equal</option>
                <option value="gt">greater than</option>
              {/if}
            </select>
          </div>

          <div>
            <label for="value" class="mb-1 block text-sm font-medium text-gray-700">Value</label>
            {#if newFilterField === "facet"}
              <input type="hidden" name="value" value={selectedFacetValues.join(",")} />
              <div class="text-sm text-gray-500">Select facet values below</div>
            {:else if newFilterField === "product"}
              <input type="hidden" name="value" value={selectedProducts.join(",")} />
              <div class="text-sm text-gray-500">Select products below</div>
            {:else if newFilterField === "visibility"}
              <select
                id="value"
                name="value"
                bind:value={newFilterValue}
                class="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm"
              >
                <option value="public">Public</option>
                <option value="private">Private (B2B only)</option>
                <option value="hidden">Hidden</option>
              </select>
            {:else if newFilterField === "price"}
              <input
                type="number"
                id="value"
                name="value"
                bind:value={newFilterValue}
                placeholder="Price in cents (e.g., 1000 for 10.00)"
                class="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm"
              />
            {:else if newFilterField === "stock"}
              <input
                type="number"
                id="value"
                name="value"
                bind:value={newFilterValue}
                placeholder="Minimum stock (e.g., 0 for in stock)"
                class="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm"
              />
            {:else}
              <input
                type="text"
                id="value"
                name="value"
                bind:value={newFilterValue}
                class="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm"
              />
            {/if}
          </div>
        </div>

        <!-- Facet value selector -->
        {#if newFilterField === "facet"}
          <div class="mb-4 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3">
            {#each data.facets as facet}
              {@const facetTrans = facet.translations.find((t) => t.languageCode === "en")}
              <div class="mb-3">
                <div class="mb-1 text-sm font-medium text-gray-700">
                  {facetTrans?.name ?? facet.code}
                </div>
                <div class="flex flex-wrap gap-2">
                  {#each facet.values as value}
                    {@const valueTrans = value.translations.find((t) => t.languageCode === "en")}
                    <label
                      class="inline-flex cursor-pointer items-center rounded-full border px-3 py-1 text-sm {selectedFacetValues.includes(
                        value.id
                      )
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}"
                    >
                      <input
                        type="checkbox"
                        class="sr-only"
                        checked={selectedFacetValues.includes(value.id)}
                        onchange={() => {
                          if (selectedFacetValues.includes(value.id)) {
                            selectedFacetValues = selectedFacetValues.filter(
                              (id) => id !== value.id
                            );
                          } else {
                            selectedFacetValues = [...selectedFacetValues, value.id];
                          }
                        }}
                      />
                      {valueTrans?.name ?? value.code}
                    </label>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        {/if}

        <!-- Product selector -->
        {#if newFilterField === "product"}
          <div class="mb-4 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3">
            <div class="space-y-1">
              {#each data.products as product}
                <label class="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-gray-300 text-blue-600"
                    checked={selectedProducts.includes(product.id)}
                    onchange={() => {
                      if (selectedProducts.includes(product.id)) {
                        selectedProducts = selectedProducts.filter((id) => id !== product.id);
                      } else {
                        selectedProducts = [...selectedProducts, product.id];
                      }
                    }}
                  />
                  <span class="text-sm text-gray-700">{getProductName(product)}</span>
                </label>
              {/each}
            </div>
          </div>
        {/if}

        <div class="flex justify-end">
          <Button
            type="submit"
            disabled={!newFilterField ||
              (newFilterField === "facet" && selectedFacetValues.length === 0) ||
              (newFilterField === "product" && selectedProducts.length === 0) ||
              (newFilterField !== "facet" && newFilterField !== "product" && !newFilterValue)}
          >
            Add Filter
          </Button>
        </div>
      </form>
    </div>
  </div>

  <!-- Preview -->
  {#if data.preview.length > 0}
    <div class="overflow-hidden rounded-lg bg-white shadow">
      <div class="p-6">
        <h2 class="mb-4 text-lg font-medium text-gray-900">
          Preview ({data.productCount} products)
        </h2>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
          {#each data.preview as product}
            {@const trans = product.translations.find((t) => t.languageCode === "en")}
            <div class="rounded-lg border border-gray-200 p-2">
              {#if product.featuredAsset}
                <img
                  src="{product.featuredAsset.source}?tr=w-100,h-100,fo-auto"
                  alt={trans?.name ?? "Product"}
                  class="mb-2 aspect-square w-full rounded object-cover"
                />
              {:else}
                <div
                  class="mb-2 flex aspect-square w-full items-center justify-center rounded bg-gray-100"
                >
                  <ImageIcon class="h-8 w-8 text-gray-400" />
                </div>
              {/if}
              <p class="truncate text-xs text-gray-700">{trans?.name ?? "Untitled"}</p>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  <!-- Delete -->
  <div class="overflow-hidden rounded-lg border border-red-200 bg-red-50">
    <div class="p-6">
      <h2 class="mb-2 text-lg font-medium text-red-900">Danger Zone</h2>
      <p class="mb-4 text-sm text-red-700">
        Deleting this collection cannot be undone. Products will not be affected.
      </p>
      <form
        method="POST"
        action="?/delete"
        use:enhance={() => {
          return async ({ result, update }) => {
            await update();
          };
        }}
      >
        <Button
          type="submit"
          variant="destructive-outline"
          onclick={(e) => {
            if (!confirm("Are you sure you want to delete this collection?")) {
              e.preventDefault();
            }
          }}
        >
          Delete Collection
        </Button>
      </form>
    </div>
  </div>
</div>
