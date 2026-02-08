<script lang="ts">
  import { enhance } from "$app/forms";
  import { invalidateAll } from "$app/navigation";
  import { toast } from "svelte-sonner";
  import type { ColumnDef } from "@tanstack/table-core";
  import { DataTable, renderSnippet } from "$lib/components/admin/data-table";
  import { Button } from "$lib/components/admin/ui/button";
  import { Badge } from "$lib/components/admin/ui/badge";
  import { RichTextEditor } from "$lib/components/admin/ui/rich-text-editor";
  import DeleteConfirmDialog from "$lib/components/admin/DeleteConfirmDialog.svelte";
  import * as Popover from "$lib/components/admin/ui/popover";
  import * as Command from "$lib/components/admin/ui/command";
  import X from "@lucide/svelte/icons/x";
  import ImageIcon from "@lucide/svelte/icons/image";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import ExternalLink from "@lucide/svelte/icons/external-link";
  import ChevronsUpDown from "@lucide/svelte/icons/chevrons-up-down";
  import Check from "@lucide/svelte/icons/check";
  import Package from "@lucide/svelte/icons/package";

  let { data, form } = $props();

  // Show toast notifications based on form results
  $effect(() => {
    if (form?.success) toast.success(form.message || "Collection updated");
    if (form?.error) toast.error(form.error);
  });

  let isSubmitting = $state(false);
  let showDelete = $state(false);

  // Form values - reset when collection changes
  let name = $state("");
  let slug = $state("");
  let description = $state("");
  let isPrivate = $state(false);

  // Initialize/reset form values when collection data changes
  $effect(() => {
    const trans =
      data.collection.translations.find((t) => t.languageCode === "en") ??
      data.collection.translations[0];
    name = trans?.name ?? "";
    slug = trans?.slug ?? "";
    description = trans?.description ?? "";
    isPrivate = data.collection.isPrivate;
  });

  // Filter builder state
  let newFilterField = $state<string>("");
  let newFilterOperator = $state<string>("in");
  let newFilterValue = $state<string>("");
  let selectedFacetValues = $state<number[]>([]);
  let selectedProducts = $state<number[]>([]);
  let productComboboxOpen = $state(false);

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

  function getProductNameById(id: number): string {
    const product = data.products.find((p) => p.id === id);
    return product ? getProductName(product) : `Product #${id}`;
  }

  function toggleProduct(id: number) {
    if (selectedProducts.includes(id)) {
      selectedProducts = selectedProducts.filter((p) => p !== id);
    } else {
      selectedProducts = [...selectedProducts, id];
    }
  }

  type PreviewProduct = (typeof data.preview)[0];

  function getPreviewProductName(product: PreviewProduct): string {
    const trans = product.translations.find((t) => t.languageCode === "en");
    return trans?.name ?? `Product #${product.id}`;
  }

  const previewColumns: ColumnDef<PreviewProduct>[] = [
    {
      accessorFn: (row) => getPreviewProductName(row),
      id: "name",
      header: "Product",
      cell: ({ row }) =>
        renderSnippet(productCell, {
          name: getPreviewProductName(row.original),
          id: row.original.id,
          image: row.original.featuredAsset?.preview ?? row.original.featuredAsset?.source ?? null
        })
    },
    {
      accessorFn: (row) => row.variants.length,
      id: "variants",
      header: "Variants",
      cell: ({ row }) =>
        `${row.original.variants.length} variant${row.original.variants.length !== 1 ? "s" : ""}`
    },
    {
      accessorKey: "visibility",
      header: "Status",
      cell: ({ row }) => renderSnippet(statusCell, { visibility: row.original.visibility })
    }
  ];
</script>

{#snippet productCell({ name, id, image }: { name: string; id: number; image: string | null })}
  <a href="/admin/products/{id}" class="group inline-flex items-center">
    {#if image}
      <img src={image} alt="" class="mr-3 h-10 w-10 rounded object-cover" />
    {:else}
      <div class="mr-3 flex h-10 w-10 items-center justify-center rounded bg-muted-strong">
        <ImageIcon class="h-5 w-5 text-placeholder" />
      </div>
    {/if}
    <span class="font-medium text-foreground group-hover:underline">
      {name}
    </span>
  </a>
{/snippet}

{#snippet statusCell({ visibility }: { visibility: string })}
  <Badge
    variant={visibility === "public"
      ? "success"
      : visibility === "private"
        ? "warning"
        : "outline"}
  >
    {visibility === "public" ? "Public" : visibility === "private" ? "Private" : "Draft"}
  </Badge>
{/snippet}

<svelte:head><title>Edit Collection | Admin</title></svelte:head>

<div class="space-y-6">
  <div class="mb-6 flex items-center justify-between">
    <a
      href="/admin/collections"
      class="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
      ><ChevronLeft class="h-4 w-4" /> Back to Collections</a
    >
    {#if slug}
      <a
        href="/collections/{data.collection.id}/{slug}"
        target="_blank"
        class="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
      >
        View in store <ExternalLink class="h-3.5 w-3.5" />
      </a>
    {/if}
  </div>
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold">Edit Collection</h1>
    <div class="flex items-center gap-3">
      <Button type="submit" form="collection-form" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  </div>

  <!-- Basic Info Form -->
  <form
    id="collection-form"
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
    <div class="overflow-hidden rounded-lg bg-surface shadow">
      <div class="p-6">
        <h2 class="mb-4 text-lg font-medium text-foreground">Basic Information</h2>

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
                bind:value={name}
                required
                class="w-full rounded-lg border border-input-border px-3 py-2 shadow-sm"
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
                bind:value={slug}
                required
                class="w-full rounded-lg border border-input-border px-3 py-2 shadow-sm"
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
              content={description}
              placeholder="Write collection description..."
              onchange={(html) => (description = html)}
            />
          </div>
        </div>

        <div class="mt-6">
          <div class="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_private"
              name="is_private"
              bind:checked={isPrivate}
              class="h-4 w-4 rounded border-input-border text-blue-600 dark:text-blue-400"
            />
            <label for="is_private" class="text-sm text-foreground-secondary">
              <span class="font-medium">Private collection</span> (hidden from storefront)
            </label>
          </div>
        </div>
      </div>
    </div>
  </form>

  <!-- Collection Filters -->
  <div class="overflow-hidden rounded-lg bg-surface shadow">
    <div class="p-6">
      <h2 class="mb-4 text-lg font-medium text-foreground">Collection Filters</h2>
      <p class="mb-4 text-sm text-foreground-tertiary">
        Products are included in this collection based on these filters. Multiple filters use AND
        logic.
      </p>

      <!-- Existing filters -->
      {#if data.collection.filters.length > 0}
        <div class="mb-6 space-y-2">
          {#each data.collection.filters as filter}
            <div
              class="flex items-center justify-between rounded-lg border border-border bg-background p-3"
            >
              <div>
                <span class="font-medium text-foreground">{getFieldLabel(filter.field)}</span>
                <span class="mx-2 text-muted-foreground">{getOperatorLabel(filter.operator)}</span>
                <span class="text-foreground-secondary"
                  >{formatFilterValue(filter.field, filter.value)}</span
                >
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
                  class="rounded p-1 text-red-600 hover:bg-destructive-subtle hover:text-red-800"
                  aria-label="Remove filter"
                >
                  <X class="h-5 w-5" />
                </button>
              </form>
            </div>
          {/each}
        </div>
      {:else}
        <div class="mb-6 rounded-lg border border-dashed border-input-border p-6 text-center">
          <p class="text-sm text-muted-foreground">
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
        class="rounded-lg border border-border bg-background p-4"
      >
        <h3 class="mb-3 text-sm font-medium text-foreground">Add Filter</h3>

        <div class="mb-4 grid grid-cols-3 gap-4">
          <div>
            <label for="field" class="mb-1 block text-sm font-medium text-foreground-secondary">
              Filter Type
            </label>
            <select
              id="field"
              name="field"
              bind:value={newFilterField}
              class="block w-full rounded-lg border border-input-border px-3 py-2 shadow-sm"
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
            <label for="operator" class="mb-1 block text-sm font-medium text-foreground-secondary">
              Operator
            </label>
            <select
              id="operator"
              name="operator"
              bind:value={newFilterOperator}
              class="block w-full rounded-lg border border-input-border px-3 py-2 shadow-sm"
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
            <label for="value" class="mb-1 block text-sm font-medium text-foreground-secondary"
              >Value</label
            >
            {#if newFilterField === "facet"}
              <input type="hidden" name="value" value={selectedFacetValues.join(",")} />
              <div class="text-sm text-muted-foreground">Select facet values below</div>
            {:else if newFilterField === "product"}
              <input type="hidden" name="value" value={selectedProducts.join(",")} />
              <div class="text-sm text-muted-foreground">Select products below</div>
            {:else if newFilterField === "visibility"}
              <select
                id="value"
                name="value"
                bind:value={newFilterValue}
                class="block w-full rounded-lg border border-input-border px-3 py-2 shadow-sm"
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
                class="block w-full rounded-lg border border-input-border px-3 py-2 shadow-sm"
              />
            {:else if newFilterField === "stock"}
              <input
                type="number"
                id="value"
                name="value"
                bind:value={newFilterValue}
                placeholder="Minimum stock (e.g., 0 for in stock)"
                class="block w-full rounded-lg border border-input-border px-3 py-2 shadow-sm"
              />
            {:else}
              <input
                type="text"
                id="value"
                name="value"
                bind:value={newFilterValue}
                class="block w-full rounded-lg border border-input-border px-3 py-2 shadow-sm"
              />
            {/if}
          </div>
        </div>

        <!-- Facet value selector -->
        {#if newFilterField === "facet"}
          <div class="mb-4 max-h-48 overflow-y-auto rounded-lg border border-border bg-surface p-3">
            {#each data.facets as facet}
              {@const facetTrans = facet.translations.find((t) => t.languageCode === "en")}
              <div class="mb-3">
                <div class="mb-1 text-sm font-medium text-foreground-secondary">
                  {facetTrans?.name ?? facet.code}
                </div>
                <div class="flex flex-wrap gap-2">
                  {#each facet.values as value}
                    {@const valueTrans = value.translations.find((t) => t.languageCode === "en")}
                    <label
                      class="inline-flex cursor-pointer items-center rounded-full border px-3 py-1 text-sm {selectedFacetValues.includes(
                        value.id
                      )
                        ? 'border-blue-500 bg-accent-subtle text-blue-700'
                        : 'border-border bg-surface text-foreground-secondary hover:border-input-border'}"
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
          <div class="mb-4">
            <Popover.Root bind:open={productComboboxOpen}>
              <Popover.Trigger
                class="flex h-9 w-full items-center justify-between rounded-lg border border-input-border bg-surface px-3 py-2 text-sm hover:bg-hover"
              >
                <span class="text-muted-foreground">
                  {selectedProducts.length > 0
                    ? `${selectedProducts.length} product(s) selected`
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
                        value={getProductName(product)}
                        onSelect={() => toggleProduct(product.id)}
                      >
                        <Check
                          class="mr-2 h-4 w-4 {selectedProducts.includes(product.id)
                            ? 'opacity-100'
                            : 'opacity-0'}"
                        />
                        {getProductName(product)}
                      </Command.Item>
                    {/each}
                  </Command.List>
                </Command.Root>
              </Popover.Content>
            </Popover.Root>
            {#if selectedProducts.length > 0}
              <div class="mt-2 flex flex-wrap gap-1">
                {#each selectedProducts as id}
                  <Badge variant="secondary" class="gap-1">
                    {getProductNameById(id)}
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

  <!-- Products -->
  <div class="overflow-hidden rounded-lg bg-surface shadow">
    <div class="p-6">
      <h2 class="mb-4 text-lg font-medium text-foreground">
        Products ({data.productCount})
      </h2>
      <DataTable
        data={data.preview}
        columns={previewColumns}
        searchPlaceholder="Filter products..."
        emptyIcon={Package}
        emptyTitle="No products"
        emptyDescription="Add filters above to populate this collection."
      />
    </div>
  </div>

  <button
    type="button"
    class="text-sm text-red-600 hover:text-red-800 dark:text-red-700"
    onclick={() => (showDelete = true)}
  >
    Delete this collection
  </button>
</div>

<DeleteConfirmDialog
  bind:open={showDelete}
  title="Delete Collection?"
  description="Are you sure you want to delete this collection? This action cannot be undone."
/>
