<script lang="ts">
  import { enhance } from "$app/forms";
  import { page } from "$app/stores";
  import { toast } from "svelte-sonner";
  import { Button } from "$lib/components/admin/ui/button";
  import DeleteConfirmDialog from "$lib/components/admin/DeleteConfirmDialog.svelte";
  import { Input } from "$lib/components/admin/ui/input";
  import { Label } from "$lib/components/admin/ui/label";
  import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell
  } from "$lib/components/admin/ui/table";
  import * as Dialog from "$lib/components/admin/ui/dialog";
  import * as Popover from "$lib/components/admin/ui/popover";
  import * as Command from "$lib/components/admin/ui/command";
  import { Badge } from "$lib/components/admin/ui/badge";
  import ImagePicker from "$lib/components/admin/ImagePicker.svelte";
  import { RichTextEditor } from "$lib/components/admin/ui/rich-text-editor";
  import Check from "@lucide/svelte/icons/check";
  import ChevronsUpDown from "@lucide/svelte/icons/chevrons-up-down";
  import X from "@lucide/svelte/icons/x";
  import Plus from "@lucide/svelte/icons/plus";
  import Pencil from "@lucide/svelte/icons/pencil";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  // Show toast from URL params (variant created/deleted redirects)
  $effect(() => {
    const url = $page.url;
    if (url.searchParams.has("variantCreated")) {
      toast.success("Variant created successfully");
      // Clean the URL
      const newUrl = new URL(url);
      newUrl.searchParams.delete("variantCreated");
      history.replaceState({}, "", newUrl.pathname + newUrl.search);
    }
    if (url.searchParams.has("variantDeleted")) {
      toast.success("Variant deleted successfully");
      const newUrl = new URL(url);
      newUrl.searchParams.delete("variantDeleted");
      history.replaceState({}, "", newUrl.pathname + newUrl.search);
    }
  });

  // Show toast notifications based on form results
  $effect(() => {
    if (form?.success) toast.success("Product updated successfully");
    if (form?.error) toast.error(form.error);
    if (form?.imageError) toast.error(form.imageError);
    if (form?.imageRemoved) toast.success("Image removed");
    if (form?.featuredSet) toast.success("Featured image updated");
    if (form?.altUpdated) toast.success("Image updated");
  });

  let showDelete = $state(false);
  let showImagePicker = $state(false);
  let isSavingImages = $state(false);
  let isSavingProduct = $state(false);
  let editingImageAlt = $state<{ id: number; alt: string; isFeatured: boolean } | null>(null);

  // Selected facet values and categories - reset when product changes
  let selectedProductFacets = $state<number[]>([]);
  let selectedCategories = $state<number[]>([]);
  let categoryComboboxOpen = $state(false);
  let facetComboboxOpen = $state(false);

  // Initialize selections when product data changes
  $effect(() => {
    selectedProductFacets = data.product.facetValues.map((fv) => fv.id);
    selectedCategories = data.productCategories.map((c) => c.id);
  });

  // Flatten facet values for combobox display (derived from data)
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
    return flatFacetValues.filter((fv) => selectedProductFacets.includes(fv.id));
  }

  function toggleFacetValue(id: number) {
    if (selectedProductFacets.includes(id)) {
      selectedProductFacets = selectedProductFacets.filter((fv) => fv !== id);
    } else {
      selectedProductFacets = [...selectedProductFacets, id];
    }
  }

  function removeFacetValue(id: number) {
    selectedProductFacets = selectedProductFacets.filter((fv) => fv !== id);
  }

  // Helper to get translated name
  function getCategoryName(translations: { languageCode: string; name: string }[]): string {
    return translations.find((t) => t.languageCode === "en")?.name ?? "";
  }

  // Flatten tree into list with depth info for display
  type FlatCategory = {
    id: number;
    name: string;
    depth: number;
    translations: { languageCode: string; name: string }[];
  };

  function flattenTree(nodes: typeof data.categoryTree, depth = 0): FlatCategory[] {
    return nodes.flatMap((node) => [
      {
        id: node.id,
        name: getCategoryName(node.translations),
        depth,
        translations: node.translations
      },
      ...flattenTree(node.children, depth + 1)
    ]);
  }

  const flatCategories = $derived(flattenTree(data.categoryTree));

  // Get selected category objects for display
  function getSelectedCategoryObjects() {
    return flatCategories.filter((c) => selectedCategories.includes(c.id));
  }

  // Toggle category selection
  function toggleCategory(id: number) {
    if (selectedCategories.includes(id)) {
      selectedCategories = selectedCategories.filter((c) => c !== id);
    } else {
      selectedCategories = [...selectedCategories, id];
    }
  }

  // Remove a category from selection
  function removeCategory(id: number) {
    selectedCategories = selectedCategories.filter((c) => c !== id);
  }

  // Get the primary translation (English)
  const translation = $derived(
    data.product.translations.find((t) => t.languageCode === "en") ?? data.product.translations[0]
  );

  async function handleImagesSelected(
    files: {
      url: string;
      name: string;
      fileId: string;
      width: number;
      height: number;
      size: number;
      alt: string;
    }[]
  ) {
    isSavingImages = true;

    try {
      for (const file of files) {
        const saveForm = new FormData();
        saveForm.append("url", file.url);
        saveForm.append("name", file.name);
        saveForm.append("fileId", file.fileId);
        saveForm.append("width", file.width.toString());
        saveForm.append("height", file.height.toString());
        saveForm.append("fileSize", file.size.toString());
        saveForm.append("alt", file.alt);

        await fetch(`?/addImage`, {
          method: "POST",
          body: saveForm
        });
      }

      // Reload page to show new images
      window.location.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save images");
    } finally {
      isSavingImages = false;
    }
  }
</script>

<svelte:head><title>Edit Product | Admin</title></svelte:head>

<div>
  <div class="mb-6">
    <div class="mb-4 flex items-center justify-between">
      <a href="/admin/products" class="text-sm text-blue-600 hover:underline"
        >&larr; Back to Products</a
      >
      {#if translation?.slug}
        <a
          href="/products/{data.product.id}/{translation.slug}"
          target="_blank"
          class="text-sm text-muted-foreground hover:text-foreground-secondary"
        >
          View in store &rarr;
        </a>
      {/if}
    </div>
    <div class="mt-2 flex items-center justify-between">
      <h1 class="text-2xl font-bold">Edit Product</h1>
      <Button type="submit" form="product-form" disabled={isSavingProduct}>
        {isSavingProduct ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  </div>

  <!-- Two Column Layout -->
  <div class="flex gap-6">
    <!-- Main Content (Left) -->
    <div class="flex-1 space-y-6">
      <!-- Product Form -->
      <form
        id="product-form"
        method="POST"
        action="?/update"
        use:enhance={() => {
          isSavingProduct = true;
          return async ({ update }) => {
            await update({ reset: false });
            isSavingProduct = false;
          };
        }}
        class="rounded-lg bg-surface shadow"
      >
        <div class="space-y-6 p-6">
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="name" class="mb-1 block text-sm font-medium text-foreground-secondary">
                  Name <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={translation?.name ?? ""}
                  required
                  class="w-full rounded-lg border border-input-border px-3 py-2"
                />
              </div>

              <div>
                <label for="slug" class="mb-1 block text-sm font-medium text-foreground-secondary">
                  Slug <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={translation?.slug ?? ""}
                  required
                  class="w-full rounded-lg border border-input-border px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label
                for="description"
                class="mb-1 block text-sm font-medium text-foreground-secondary"
              >
                Description
              </label>
              <RichTextEditor
                name="description"
                content={translation?.description ?? ""}
                placeholder="Write product description..."
              />
            </div>
          </div>

          <!-- Common Fields -->
          <div class="grid grid-cols-2 gap-4">
            <label class="block">
              <span class="text-sm font-medium text-foreground-secondary">Product Type</span>
              <select
                name="type"
                class="mt-1 block w-full rounded-md border-input-border shadow-sm"
              >
                <option value="physical" selected={data.product.type === "physical"}
                  >Physical</option
                >
                <option value="digital" selected={data.product.type === "digital"}>Digital</option>
              </select>
            </label>

            <label class="block">
              <span class="text-sm font-medium text-foreground-secondary">Tax Rate</span>
              <select
                name="taxCode"
                class="mt-1 block w-full rounded-md border-input-border shadow-sm"
              >
                {#each data.taxRates as rate}
                  <option value={rate.code} selected={data.product.taxCode === rate.code}>
                    {rate.name} ({(rate.rate * 100).toFixed(0)}%)
                  </option>
                {/each}
              </select>
            </label>
          </div>
        </div>
      </form>

      <!-- Variants Section -->
      <div class="rounded-lg bg-surface pb-4 shadow">
        <div class="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 class="text-lg font-semibold">Variants</h2>
          <a href="/admin/products/{data.product.id}/variants/new">
            <Button type="button" variant="outline" size="sm"
              ><Plus class="h-4 w-4" /> Add Variant</Button
            >
          </a>
        </div>

        <!-- Variants Table -->
        <Table class="rounded-none border-0 shadow-none">
          <TableHeader>
            <TableRow class="hover:bg-transparent">
              <TableHead>SKU</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Facets</TableHead>
              <TableHead class="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#if data.product.variants.length === 0}
              <TableRow class="hover:bg-transparent">
                <TableCell colspan={6} class="py-8 text-center text-sm text-muted-foreground">
                  No variants yet. Add a variant to start selling this product.
                </TableCell>
              </TableRow>
            {:else}
              {#each data.product.variants as variant}
                <TableRow>
                  <TableCell class="font-mono text-sm">{variant.sku}</TableCell>
                  <TableCell class="text-sm">
                    {variant.translations.find((t) => t.languageCode === "en")?.name ?? "-"}
                  </TableCell>
                  <TableCell class="text-sm">{(variant.price / 100).toFixed(2)} EUR</TableCell>
                  <TableCell class="text-sm">{variant.stock}</TableCell>
                  <TableCell class="text-sm">
                    {#if variant.facetValues.length === 0}
                      <span class="text-placeholder">None</span>
                    {:else}
                      <div class="flex flex-wrap gap-1">
                        {#each variant.facetValues as fv}
                          {@const name =
                            fv.translations.find((t) => t.languageCode === "en")?.name ?? fv.code}
                          <span class="rounded bg-muted px-2 py-0.5 text-xs">{name}</span>
                        {/each}
                      </div>
                    {/if}
                  </TableCell>
                  <TableCell class="text-right text-sm">
                    <a
                      href="/admin/products/{data.product.id}/variants/{variant.id}"
                      class="text-blue-600 hover:underline"
                    >
                      Edit
                    </a>
                  </TableCell>
                </TableRow>
              {/each}
            {/if}
          </TableBody>
        </Table>
      </div>
      <button
        type="button"
        class="text-sm text-red-600 hover:text-red-800"
        onclick={() => (showDelete = true)}
      >
        Delete this product
      </button>
    </div>

    <!-- Sidebar (Right) -->
    <div class="w-80 shrink-0 space-y-6">
      <!-- Visibility Section -->
      <div class="rounded-lg bg-surface shadow">
        <div class="border-b border-border px-4 py-3">
          <h2 class="font-semibold">Visibility</h2>
        </div>
        <div class="p-4">
          <select
            form="product-form"
            name="visibility"
            class="block w-full rounded-md border-input-border shadow-sm"
          >
            <option value="draft" selected={data.product.visibility === "draft"}>Draft</option>
            <option value="public" selected={data.product.visibility === "public"}>Public</option>
            <option value="private" selected={data.product.visibility === "private"}>Private</option
            >
          </select>
          <p class="mt-3 text-xs text-muted-foreground">
            Set this to Public to make it available in the store
          </p>
        </div>
      </div>

      <!-- Images Section -->
      <div class="rounded-lg bg-surface shadow">
        <div class="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 class="font-semibold">Images</h2>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onclick={() => (showImagePicker = true)}
            disabled={isSavingImages}
          >
            <Plus class="h-4 w-4" />
            Add
          </Button>
        </div>

        <div class="p-4">
          {#if data.product.assets.length > 0}
            <div class="grid grid-cols-2 gap-2">
              {#each data.product.assets as asset}
                <div class="group relative">
                  <img
                    src="{asset.source}?tr=w-100,h-100,fo-auto"
                    alt={asset.alt || asset.name}
                    class="h-24 w-full rounded border border-border object-cover {data.product
                      .featuredAssetId === asset.id
                      ? 'ring-2 ring-blue-500'
                      : ''}"
                  />
                  <div
                    class="absolute inset-0 flex items-center justify-center gap-1 rounded bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      class="h-7 w-7 p-0"
                      onclick={() =>
                        (editingImageAlt = {
                          id: asset.id,
                          alt: asset.alt || "",
                          isFeatured: data.product.featuredAssetId === asset.id
                        })}
                    >
                      <Pencil class="h-3.5 w-3.5" />
                    </Button>
                    <form method="POST" action="?/removeImage" use:enhance>
                      <input type="hidden" name="assetId" value={asset.id} />
                      <Button type="submit" variant="destructive" size="sm" class="h-7 w-7 p-0">
                        <Trash2 class="h-3.5 w-3.5" />
                      </Button>
                    </form>
                  </div>
                  {#if data.product.featuredAssetId === asset.id}
                    <span
                      class="absolute top-1 left-1 rounded bg-blue-600 px-1 py-0.5 text-[10px] text-white"
                      >Featured</span
                    >
                  {/if}
                </div>
              {/each}
            </div>
          {:else}
            <p class="py-4 text-center text-sm text-muted-foreground">No images yet</p>
          {/if}
        </div>
      </div>

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
                                  {#if selectedProductFacets.includes(value.id)}
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
            {#if selectedProductFacets.length > 0}
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
                  <input form="product-form" type="hidden" name="facetValueIds" value={fv.id} />
                {/each}
              </div>
            {/if}
          {/if}
        </div>
      </div>

      <!-- Categories Section -->
      <div class="rounded-lg bg-surface shadow">
        <div class="border-b border-border px-4 py-3">
          <h2 class="font-semibold">Categories</h2>
        </div>

        <div class="p-4">
          {#if data.categoryTree.length === 0}
            <p class="text-sm text-muted-foreground">No categories defined.</p>
          {:else}
            <!-- Combobox -->
            <Popover.Root bind:open={categoryComboboxOpen}>
              <Popover.Trigger
                class="flex w-full items-center justify-between rounded-lg border border-input-border bg-surface px-3 py-2 text-sm hover:bg-hover"
                aria-expanded={categoryComboboxOpen}
                aria-controls="category-listbox"
                aria-haspopup="listbox"
              >
                <span class="text-muted-foreground">Select categories...</span>
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Popover.Trigger>
              <Popover.Content class="w-72 p-0" align="start">
                <Command.Root>
                  <Command.Input placeholder="Search categories..." />
                  <Command.List id="category-listbox" class="max-h-64">
                    <Command.Empty>No category found.</Command.Empty>
                    <Command.Group>
                      {#each flatCategories as category}
                        <Command.Item
                          value={category.name}
                          onSelect={() => toggleCategory(category.id)}
                          class="cursor-pointer"
                        >
                          <div
                            class="flex w-full items-center gap-2"
                            style="padding-left: {category.depth * 12}px"
                          >
                            <div class="flex h-4 w-4 items-center justify-center">
                              {#if selectedCategories.includes(category.id)}
                                <Check class="h-4 w-4" />
                              {/if}
                            </div>
                            <span>{category.name}</span>
                          </div>
                        </Command.Item>
                      {/each}
                    </Command.Group>
                  </Command.List>
                </Command.Root>
              </Popover.Content>
            </Popover.Root>

            <!-- Selected categories -->
            {#if selectedCategories.length > 0}
              <div class="mt-3 flex flex-wrap gap-1.5">
                {#each getSelectedCategoryObjects() as category}
                  <Badge class="gap-1">
                    {category.name}
                    <button
                      type="button"
                      onclick={() => removeCategory(category.id)}
                      class="ml-0.5 rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-500/20"
                      aria-label="Remove {category.name}"
                    >
                      <X class="h-3 w-3" />
                    </button>
                  </Badge>
                  <input form="product-form" type="hidden" name="categoryIds" value={category.id} />
                {/each}
              </div>
            {/if}
          {/if}
        </div>
      </div>
    </div>
  </div>

  <DeleteConfirmDialog
    bind:open={showDelete}
    title="Delete Product?"
    description="Are you sure you want to delete this product? This action cannot be undone."
  />

  <!-- Image Picker Dialog -->
  <ImagePicker
    bind:open={showImagePicker}
    onClose={() => (showImagePicker = false)}
    onSelect={handleImagesSelected}
  />

  <!-- Edit Image Dialog -->
  <Dialog.Root
    open={editingImageAlt !== null}
    onOpenChange={(open) => !open && (editingImageAlt = null)}
  >
    <Dialog.Content class="max-w-md">
      <Dialog.Header>
        <Dialog.Title>Edit Image</Dialog.Title>
      </Dialog.Header>
      {#if editingImageAlt}
        {@const currentEditingImage = editingImageAlt}
        {@const editingAsset = data.product.assets.find((a) => a.id === currentEditingImage.id)}
        <div class="space-y-4 py-2">
          {#if editingAsset}
            <img
              src="{editingAsset.source}?tr=w-400,h-400,fo-auto"
              alt={currentEditingImage.alt || editingAsset.name}
              class="mx-auto max-h-96 rounded-lg object-contain"
            />
          {/if}

          <form
            method="POST"
            action="?/updateImageAlt"
            use:enhance={() => {
              return async ({ result, update }) => {
                await update();
                if (result.type === "success") {
                  editingImageAlt = null;
                }
              };
            }}
          >
            <input type="hidden" name="assetId" value={currentEditingImage.id} />
            <div class="space-y-4">
              <div>
                <Label for="alt-text">Alt text</Label>
                <Input
                  id="alt-text"
                  name="alt"
                  value={currentEditingImage.alt}
                  placeholder="Describe this image..."
                  class="mt-1"
                />
                <p class="mt-1 text-xs text-muted-foreground">
                  Describes the image for screen readers and search engines.
                </p>
              </div>

              <label class="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="setFeatured"
                  value="true"
                  checked={currentEditingImage.isFeatured}
                  disabled={currentEditingImage.isFeatured}
                  class="h-4 w-4 rounded border-input-border text-blue-600 focus:ring-blue-500"
                />
                <span class="text-sm text-foreground-secondary">Featured image</span>
              </label>
            </div>
            <Dialog.Footer class="mt-4">
              <Button type="button" variant="outline" onclick={() => (editingImageAlt = null)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </Dialog.Footer>
          </form>
        </div>
      {/if}
    </Dialog.Content>
  </Dialog.Root>
</div>
