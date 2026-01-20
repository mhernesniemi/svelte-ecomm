<script lang="ts">
  import { enhance } from "$app/forms";
  import { invalidateAll } from "$app/navigation";

  let { data, form } = $props();

  let activeTab = $state<"en" | "fi">("en");
  let isSubmitting = $state(false);

  // Form values from collection data
  function getTranslation(lang: string) {
    return data.collection.translations.find((t) => t.languageCode === lang);
  }

  let code = $state(data.collection.code);
  let nameEn = $state(getTranslation("en")?.name ?? "");
  let nameFi = $state(getTranslation("fi")?.name ?? "");
  let slugEn = $state(getTranslation("en")?.slug ?? "");
  let slugFi = $state(getTranslation("fi")?.slug ?? "");
  let descriptionEn = $state(getTranslation("en")?.description ?? "");
  let descriptionFi = $state(getTranslation("fi")?.description ?? "");
  let enabled = $state(data.collection.enabled);
  let isPrivate = $state(data.collection.isPrivate);

  // Filter builder state
  let newFilterField = $state<string>("");
  let newFilterOperator = $state<string>("in");
  let newFilterValue = $state<string>("");
  let selectedFacetValues = $state<number[]>([]);
  let selectedProducts = $state<number[]>([]);

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

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

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a
        href="/admin/collections"
        class="text-gray-500 hover:text-gray-700"
        aria-label="Back to collections"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </a>
      <h1 class="text-2xl font-bold text-gray-900">Edit Collection</h1>
    </div>
    <div class="flex items-center gap-4">
      <span class="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
        {data.productCount} products
      </span>
      {#if slugEn}
        <a
          href="/collections/{slugEn}"
          target="_blank"
          class="text-sm text-gray-500 hover:text-gray-700"
        >
          View in store &rarr;
        </a>
      {/if}
    </div>
  </div>

  {#if form?.error}
    <div class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
      {form.error}
    </div>
  {/if}

  {#if form?.success}
    <div class="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-600">
      {form.message}
    </div>
  {/if}

  <!-- Basic Info Form -->
  <form
    method="POST"
    action="?/update"
    use:enhance={() => {
      isSubmitting = true;
      return async ({ result, update }) => {
        isSubmitting = false;
        await update();
      };
    }}
    class="space-y-6"
  >
    <div class="overflow-hidden rounded-lg bg-white shadow">
      <div class="p-6">
        <h2 class="mb-4 text-lg font-medium text-gray-900">Basic Information</h2>

        <div class="mb-4">
          <label for="code" class="mb-1 block text-sm font-medium text-gray-700">
            Code <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="code"
            name="code"
            bind:value={code}
            required
            class="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>

        <div class="mb-4">
          <div class="flex border-b border-gray-200">
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium {activeTab === 'en'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'}"
              onclick={() => (activeTab = "en")}
            >
              English
            </button>
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium {activeTab === 'fi'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'}"
              onclick={() => (activeTab = "fi")}
            >
              Finnish
            </button>
          </div>
        </div>

        {#if activeTab === "en"}
          <div class="space-y-4">
            <div>
              <label for="name_en" class="mb-1 block text-sm font-medium text-gray-700">
                Name (EN) <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name_en"
                name="name_en"
                bind:value={nameEn}
                required
                class="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm"
              />
            </div>
            <div>
              <label for="slug_en" class="mb-1 block text-sm font-medium text-gray-700">
                Slug (EN) <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="slug_en"
                name="slug_en"
                bind:value={slugEn}
                required
                class="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm"
              />
            </div>
            <div>
              <label for="description_en" class="mb-1 block text-sm font-medium text-gray-700">
                Description (EN)
              </label>
              <textarea
                id="description_en"
                name="description_en"
                bind:value={descriptionEn}
                rows="3"
                class="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm"
              ></textarea>
            </div>
          </div>
        {:else}
          <div class="space-y-4">
            <div>
              <label for="name_fi" class="mb-1 block text-sm font-medium text-gray-700">
                Name (FI)
              </label>
              <input
                type="text"
                id="name_fi"
                name="name_fi"
                bind:value={nameFi}
                class="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm"
              />
            </div>
            <div>
              <label for="slug_fi" class="mb-1 block text-sm font-medium text-gray-700">
                Slug (FI)
              </label>
              <input
                type="text"
                id="slug_fi"
                name="slug_fi"
                bind:value={slugFi}
                class="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm"
              />
            </div>
            <div>
              <label for="description_fi" class="mb-1 block text-sm font-medium text-gray-700">
                Description (FI)
              </label>
              <textarea
                id="description_fi"
                name="description_fi"
                bind:value={descriptionFi}
                rows="3"
                class="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm"
              ></textarea>
            </div>
          </div>
        {/if}

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
          <button
            type="submit"
            disabled={isSubmitting}
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
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
                  class="text-red-600 hover:text-red-800"
                  aria-label="Remove filter"
                >
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
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
          <button
            type="submit"
            disabled={!newFilterField ||
              (newFilterField === "facet" && selectedFacetValues.length === 0) ||
              (newFilterField === "product" && selectedProducts.length === 0) ||
              (newFilterField !== "facet" && newFilterField !== "product" && !newFilterValue)}
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add Filter
          </button>
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
                  <svg
                    class="h-8 w-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
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
        <button
          type="submit"
          onclick={(e) => {
            if (!confirm("Are you sure you want to delete this collection?")) {
              e.preventDefault();
            }
          }}
          class="rounded-lg border border-red-600 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Delete Collection
        </button>
      </form>
    </div>
  </div>
</div>
