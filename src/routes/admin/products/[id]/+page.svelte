<script lang="ts">
  import { enhance } from "$app/forms";
  import { Button } from "$lib/components/admin/ui/button";
  import { Input } from "$lib/components/admin/ui/input";
  import { Label } from "$lib/components/admin/ui/label";
  import { Alert } from "$lib/components/admin/ui/alert";
  import { Badge } from "$lib/components/admin/ui/badge";
  import * as Dialog from "$lib/components/admin/ui/dialog";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let activeTab = $state<"en" | "fi">("en");
  let showDeleteConfirm = $state(false);
  let showAddVariant = $state(false);
  let editingVariantFacets = $state<number | null>(null);
  let isUploading = $state(false);
  let uploadError = $state<string | null>(null);

  // Selected facet values (bind:group handles reactivity)
  let selectedProductFacets = $state(data.product.facetValues.map((fv) => fv.id));
  let variantFacets: Record<number, number[]> = $state(
    Object.fromEntries(data.product.variants.map((v) => [v.id, v.facetValues.map((fv) => fv.id)]))
  );

  function getTranslation(lang: string) {
    return data.product.translations.find((t) => t.languageCode === lang);
  }

  const enTrans = getTranslation("en");
  const fiTrans = getTranslation("fi");

  async function handleImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;

    isUploading = true;
    uploadError = null;

    try {
      // Get auth params from server
      const authResponse = await fetch("/api/assets/auth");
      const auth = await authResponse.json();

      // Upload each file to ImageKit
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("publicKey", auth.publicKey);
        formData.append("signature", auth.signature);
        formData.append("expire", auth.expire.toString());
        formData.append("token", auth.token);
        formData.append("fileName", file.name);
        formData.append("folder", `/products/${data.product.id}`);

        const uploadResponse = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
          method: "POST",
          body: formData
        });

        if (!uploadResponse.ok) {
          throw new Error("Upload failed");
        }

        const result = await uploadResponse.json();

        // Save to database via form action
        const saveForm = new FormData();
        saveForm.append("url", result.url);
        saveForm.append("name", result.name);
        saveForm.append("fileId", result.fileId);
        saveForm.append("width", result.width?.toString() ?? "0");
        saveForm.append("height", result.height?.toString() ?? "0");
        saveForm.append("fileSize", result.size?.toString() ?? "0");

        await fetch(`?/addImage`, {
          method: "POST",
          body: saveForm
        });
      }

      // Reload page to show new images
      window.location.reload();
    } catch (e) {
      uploadError = e instanceof Error ? e.message : "Upload failed";
    } finally {
      isUploading = false;
      input.value = "";
    }
  }
</script>

<div>
  <div class="mb-8">
    <a href="/admin/products" class="text-sm text-blue-600 hover:underline"
      >&larr; Back to Products</a
    >
    <div class="mt-2 flex items-center justify-between">
      <h1 class="text-2xl font-bold">Edit Product</h1>
      {#if enTrans?.slug}
        <a
          href="/products/{enTrans.slug}"
          target="_blank"
          class="text-sm text-gray-500 hover:text-gray-700"
        >
          View in store &rarr;
        </a>
      {/if}
    </div>
  </div>

  {#if form?.success}
    <Alert variant="success" class="mb-6">
      Product updated successfully
    </Alert>
  {/if}

  {#if form?.error}
    <Alert variant="destructive" class="mb-6">
      {form.error}
    </Alert>
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
      <div class="border-t pt-6 space-y-4">
        <label class="block">
          <span class="text-sm font-medium text-gray-700">Product Type</span>
          <select
            name="type"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="physical" selected={data.product.type === "physical"}>
              Physical - Requires shipping
            </option>
            <option value="digital" selected={data.product.type === "digital"}>
              Digital - Delivered via email
            </option>
          </select>
        </label>

        <label class="block">
          <span class="text-sm font-medium text-gray-700">Visibility</span>
          <select
            name="visibility"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="public" selected={data.product.visibility === "public"}>
              Public - Visible to everyone
            </option>
            <option value="private" selected={data.product.visibility === "private"}>
              Private - B2B customers only
            </option>
            <option value="hidden" selected={data.product.visibility === "hidden"}>
              Hidden - Not visible
            </option>
          </select>
        </label>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-between border-t bg-gray-50 px-6 py-4">
      <Button
        type="button"
        variant="ghost"
        onclick={() => (showDeleteConfirm = true)}
        class="text-red-600 hover:text-red-800"
      >
        Delete Product
      </Button>
      <Button type="submit">
        Save Changes
      </Button>
    </div>
  </form>

  <!-- Images Section -->
  <div class="mb-8 rounded-lg bg-white shadow">
    <div class="border-b px-6 py-4">
      <h2 class="text-lg font-semibold">Product Images</h2>
      <p class="text-sm text-gray-500">Upload and manage product images</p>
    </div>

    {#if form?.imageError}
      <Alert variant="destructive" class="mx-6 mt-4">
        {form.imageError}
      </Alert>
    {/if}

    {#if uploadError}
      <Alert variant="destructive" class="mx-6 mt-4">
        {uploadError}
      </Alert>
    {/if}

    <div class="p-6">
      <!-- Current Images -->
      {#if data.product.assets.length > 0}
        <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {#each data.product.assets as asset}
            <div class="group relative">
              <img
                src="{asset.source}?tr=w-200,h-200,fo-auto"
                alt={asset.name}
                class="h-32 w-full rounded-lg border object-cover {data.product.featuredAssetId === asset.id ? 'ring-2 ring-blue-500' : ''}"
              />
              <div class="absolute inset-0 flex items-center justify-center gap-2 rounded-lg bg-black bg-opacity-50 opacity-0 transition-opacity group-hover:opacity-100">
                {#if data.product.featuredAssetId !== asset.id}
                  <form method="POST" action="?/setFeaturedImage" use:enhance>
                    <input type="hidden" name="assetId" value={asset.id} />
                    <button
                      type="submit"
                      class="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                      title="Set as featured"
                    >
                      Featured
                    </button>
                  </form>
                {/if}
                <form method="POST" action="?/removeImage" use:enhance>
                  <input type="hidden" name="assetId" value={asset.id} />
                  <button
                    type="submit"
                    class="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                    title="Remove image"
                  >
                    Remove
                  </button>
                </form>
              </div>
              {#if data.product.featuredAssetId === asset.id}
                <span class="absolute left-1 top-1 rounded bg-blue-600 px-1.5 py-0.5 text-xs text-white">
                  Featured
                </span>
              {/if}
            </div>
          {/each}
        </div>
      {:else}
        <p class="mb-4 text-gray-500">No images yet</p>
      {/if}

      <!-- Upload -->
      <div class="flex items-center gap-4">
        <label class="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 px-6 py-4 text-center hover:border-blue-500 hover:bg-gray-50">
          <input
            type="file"
            accept="image/*"
            multiple
            class="hidden"
            onchange={handleImageUpload}
            disabled={isUploading}
          />
          {#if isUploading}
            <span class="text-gray-500">Uploading...</span>
          {:else}
            <span class="text-gray-600">Click to upload images</span>
          {/if}
        </label>
      </div>
    </div>
  </div>

  <!-- Facet Values Section -->
  <div class="mb-8 rounded-lg bg-white shadow">
    <div class="border-b px-6 py-4">
      <h2 class="text-lg font-semibold">Facet Values</h2>
      <p class="text-sm text-gray-500">Assign attributes to this product for filtering</p>
    </div>

    {#if form?.facetSuccess}
      <Alert variant="success" class="mx-6 mt-4">
        Facet values updated
      </Alert>
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
                    <label
                      class="cursor-pointer rounded-full px-3 py-1.5 text-sm transition-colors {selectedProductFacets.includes(value.id)
                        ? 'border-2 border-blue-300 bg-blue-100 text-blue-800'
                        : 'border-2 border-transparent bg-gray-100 text-gray-700 hover:bg-gray-200'}"
                    >
                      <input
                        type="checkbox"
                        name="facetValueIds"
                        value={value.id}
                        bind:group={selectedProductFacets}
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
      <Alert variant="success" class="mx-6 mt-4">
        Variant added successfully
      </Alert>
    {/if}

    {#if form?.variantError}
      <Alert variant="destructive" class="mx-6 mt-4">
        {form.variantError}
      </Alert>
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
      <Alert variant="success" class="mx-6 mt-4">
        Variant facet values updated
      </Alert>
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
                                <label
                                  class="cursor-pointer rounded-full px-3 py-1.5 text-sm transition-colors {variantFacets[variant.id]?.includes(value.id)
                                    ? 'border-2 border-blue-300 bg-blue-100 text-blue-800'
                                    : 'border-2 border-transparent bg-gray-100 text-gray-700 hover:bg-gray-200'}"
                                >
                                  <input
                                    type="checkbox"
                                    name="facetValueIds"
                                    value={value.id}
                                    bind:group={variantFacets[variant.id]}
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
  <Dialog.Root bind:open={showDeleteConfirm}>
    <Dialog.Content>
      <Dialog.Header>
        <Dialog.Title>Delete Product?</Dialog.Title>
        <Dialog.Description>
          Are you sure you want to delete this product? This action cannot be undone.
        </Dialog.Description>
      </Dialog.Header>
      <Dialog.Footer>
        <Button variant="outline" onclick={() => (showDeleteConfirm = false)}>
          Cancel
        </Button>
        <form method="POST" action="?/delete" use:enhance class="inline">
          <Button type="submit" variant="destructive">
            Delete
          </Button>
        </form>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>
</div>
