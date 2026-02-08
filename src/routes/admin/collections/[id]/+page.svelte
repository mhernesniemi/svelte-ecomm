<script lang="ts">
  import { deserialize, enhance } from "$app/forms";
  import { beforeNavigate } from "$app/navigation";
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
  import * as DropdownMenu from "$lib/components/admin/ui/dropdown-menu";
  import X from "@lucide/svelte/icons/x";
  import ImageIcon from "@lucide/svelte/icons/image";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import ExternalLink from "@lucide/svelte/icons/external-link";
  import ChevronsUpDown from "@lucide/svelte/icons/chevrons-up-down";
  import Check from "@lucide/svelte/icons/check";
  import Package from "@lucide/svelte/icons/package";
  import Plus from "@lucide/svelte/icons/plus";

  let { data, form } = $props();

  $effect(() => {
    if (form?.success) toast.success(form.message || "Collection updated");
    if (form?.error) toast.error(form.error);
  });

  let isSubmitting = $state(false);
  let showDelete = $state(false);

  // ── Form state (reset from server data) ──────────────────────────────
  let name = $state("");
  let slug = $state("");
  let description = $state("");
  let isPrivate = $state(false);

  type LocalFilter = { key: number; field: string; operator: string; value: unknown };
  type PreviewProduct = (typeof data.preview)[0];
  let filterKey = 0;
  let localFilters = $state<LocalFilter[]>([]);

  $effect(() => {
    const trans =
      data.collection.translations.find((t) => t.languageCode === "en") ??
      data.collection.translations[0];
    name = trans?.name ?? "";
    slug = trans?.slug ?? "";
    description = trans?.description ?? "";
    isPrivate = data.collection.isPrivate;

    localFilters = data.collection.filters.map((f) => ({
      key: filterKey++,
      field: f.field,
      operator: f.operator,
      value: structuredClone(f.value)
    }));
  });

  // Serialized filters for the hidden form input
  const filtersJson = $derived(
    JSON.stringify(localFilters.map((f) => ({ field: f.field, operator: f.operator, value: f.value })))
  );

  // Unsaved changes detection
  const hasUnsavedChanges = $derived.by(() => {
    const trans =
      data.collection.translations.find((t) => t.languageCode === "en") ??
      data.collection.translations[0];
    const savedName = trans?.name ?? "";
    const savedSlug = trans?.slug ?? "";
    const savedDescription = trans?.description ?? "";
    const savedIsPrivate = data.collection.isPrivate;
    const savedFilters = JSON.stringify(
      data.collection.filters.map((f) => ({ field: f.field, operator: f.operator, value: f.value }))
    );

    return (
      name !== savedName ||
      slug !== savedSlug ||
      description !== savedDescription ||
      isPrivate !== savedIsPrivate ||
      filtersJson !== savedFilters
    );
  });

  // Warn on browser refresh / tab close
  $effect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  });

  // Warn on in-app navigation
  beforeNavigate(({ cancel }) => {
    if (hasUnsavedChanges && !confirm("You have unsaved changes. Leave anyway?")) {
      cancel();
    }
  });

  // Live preview — debounce-fetch matching products when filters change
  let previewProducts = $state<PreviewProduct[] | null>(null);
  let previewCount = $state<number | null>(null);

  $effect(() => {
    const current = filtersJson;

    const formData = new FormData();
    formData.set("filters", current);

    let cancelled = false;

    fetch("?/preview", { method: "POST", body: formData })
      .then((response) => response.text())
      .then((text) => {
        if (cancelled) return;
        const result = deserialize(text);
        if (result.type === "success" && result.data) {
          previewProducts = result.data.preview as PreviewProduct[];
          previewCount = result.data.productCount as number;
        }
      });

    return () => {
      cancelled = true;
    };
  });

  // ── Filter helpers ───────────────────────────────────────────────────
  let openPopover = $state<number | null>(null);
  let addFilterOpen = $state(false);

  const filterTypes = [
    { field: "facet", operator: "in", label: "Facet Values" },
    { field: "product", operator: "in", label: "Products" },
    { field: "price", operator: "gte", label: "Price" },
    { field: "stock", operator: "gt", label: "Stock" },
    { field: "visibility", operator: "eq", label: "Visibility" }
  ] as const;

  const defaultValues: Record<string, unknown> = {
    facet: [],
    product: [],
    price: 0,
    stock: 0,
    visibility: "public"
  };

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

  function addFilter(field: string, operator: string) {
    localFilters = [
      ...localFilters,
      { key: filterKey++, field, operator, value: structuredClone(defaultValues[field] ?? "") }
    ];
  }

  function removeFilter(index: number) {
    openPopover = null;
    localFilters = localFilters.filter((_, i) => i !== index);
  }

  function toggleArrayValue(index: number, toggleId: number) {
    const filter = localFilters[index];
    const arr = Array.isArray(filter.value) ? (filter.value as number[]) : [];
    localFilters[index] = {
      ...filter,
      value: arr.includes(toggleId) ? arr.filter((id) => id !== toggleId) : [...arr, toggleId]
    };
  }

  // ── Display helpers ──────────────────────────────────────────────────
  type FlatFacetValue = { id: number; name: string; facetName: string };
  const flatFacetValues: FlatFacetValue[] = $derived(
    data.facets.flatMap((facet) => {
      const facetName =
        facet.translations.find((t) => t.languageCode === "en")?.name ?? facet.code;
      return facet.values.map((value) => ({
        id: value.id,
        name: value.translations.find((t) => t.languageCode === "en")?.name ?? value.code,
        facetName
      }));
    })
  );

  function getFacetValueName(id: number): string {
    const fv = flatFacetValues.find((v) => v.id === id);
    return fv ? `${fv.facetName}: ${fv.name}` : `ID: ${id}`;
  }

  function getProductName(product: (typeof data.products)[0]): string {
    const trans = product.translations.find((t) => t.languageCode === "en");
    return trans?.name ?? `Product #${product.id}`;
  }

  function getProductNameById(id: number): string {
    const product = data.products.find((p) => p.id === id);
    return product ? getProductName(product) : `Product #${id}`;
  }

  // ── Preview table ────────────────────────────────────────────────────

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
    variant={visibility === "public" ? "success" : visibility === "private" ? "warning" : "outline"}
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

  <!-- Main form (basic info + filters submitted together) -->
  <form
    id="collection-form"
    method="POST"
    action="?/update"
    use:enhance={() => {
      isSubmitting = true;
      return async ({ result, update }) => {
        isSubmitting = false;
        await update({ reset: false });
        if (result.type === "success") await invalidateAll();
      };
    }}
    class="space-y-6"
  >
    <input type="hidden" name="filters" value={filtersJson} />

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
        Products are included based on these filters (AND logic).
      </p>

      {#if localFilters.length > 0}
        <div class="mb-4 space-y-3">
          {#each localFilters as filter, index (filter.key)}
            <div class="rounded-lg border border-border">
              <!-- Card header -->
              <div class="flex items-center justify-between border-b border-border px-4 py-2.5">
                <span class="text-sm font-medium text-foreground"
                  >{getFieldLabel(filter.field)}</span
                >
                <button
                  type="button"
                  onclick={() => removeFilter(index)}
                  class="rounded p-1 text-muted-foreground hover:bg-destructive-subtle hover:text-red-600"
                  aria-label="Remove filter"
                >
                  <X class="h-4 w-4" />
                </button>
              </div>

              <!-- Card body -->
              <div class="p-4">
                {#if filter.field === "facet"}
                  {@const selected = Array.isArray(filter.value) ? (filter.value as number[]) : []}
                  <Popover.Root
                    open={openPopover === filter.key}
                    onOpenChange={(open) => (openPopover = open ? filter.key : null)}
                  >
                    <Popover.Trigger
                      class="flex w-full items-center justify-between rounded-lg border border-input-border bg-surface px-3 py-2 text-sm hover:bg-hover"
                      aria-expanded={openPopover === filter.key}
                      aria-haspopup="listbox"
                    >
                      <span class="text-muted-foreground">Search facet values...</span>
                      <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Popover.Trigger>
                    <Popover.Content class="w-72 p-0" align="start">
                      <Command.Root>
                        <Command.Input placeholder="Search facet values..." />
                        <Command.List class="max-h-64">
                          <Command.Empty>No facet values found.</Command.Empty>
                          {#each data.facets as facet}
                            {@const facetName =
                              facet.translations.find((t) => t.languageCode === "en")?.name ??
                              facet.code}
                            <Command.Group heading={facetName}>
                              {#each facet.values as value}
                                {@const valueName =
                                  value.translations.find((t) => t.languageCode === "en")?.name ??
                                  value.code}
                                <Command.Item
                                  value="{facetName} {valueName}"
                                  onSelect={() => toggleArrayValue(index, value.id)}
                                  class="cursor-pointer"
                                >
                                  <div class="flex w-full items-center gap-2">
                                    <div class="flex h-4 w-4 items-center justify-center">
                                      {#if selected.includes(value.id)}
                                        <Check class="h-4 w-4" />
                                      {/if}
                                    </div>
                                    <span>{valueName}</span>
                                  </div>
                                </Command.Item>
                              {/each}
                            </Command.Group>
                          {/each}
                        </Command.List>
                      </Command.Root>
                    </Popover.Content>
                  </Popover.Root>
                  {#if selected.length > 0}
                    <div class="mt-3 flex flex-wrap gap-1.5">
                      {#each selected as id}
                        <Badge class="gap-1">
                          {getFacetValueName(id)}
                          <button
                            type="button"
                            onclick={() => toggleArrayValue(index, id)}
                            class="ml-0.5 rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-500/20"
                            aria-label="Remove {getFacetValueName(id)}"
                          >
                            <X class="h-3 w-3" />
                          </button>
                        </Badge>
                      {/each}
                    </div>
                  {/if}

                {:else if filter.field === "product"}
                  {@const selected = Array.isArray(filter.value) ? (filter.value as number[]) : []}
                  <Popover.Root
                    open={openPopover === filter.key}
                    onOpenChange={(open) => (openPopover = open ? filter.key : null)}
                  >
                    <Popover.Trigger
                      class="flex w-full items-center justify-between rounded-lg border border-input-border bg-surface px-3 py-2 text-sm hover:bg-hover"
                      aria-expanded={openPopover === filter.key}
                      aria-haspopup="listbox"
                    >
                      <span class="text-muted-foreground">Search products...</span>
                      <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Popover.Trigger>
                    <Popover.Content
                      class="w-[var(--bits-popover-trigger-width)] p-0"
                      align="start"
                    >
                      <Command.Root>
                        <Command.Input placeholder="Search products..." />
                        <Command.List class="max-h-60">
                          <Command.Empty>No products found.</Command.Empty>
                          {#each data.products as product}
                            <Command.Item
                              value={getProductName(product)}
                              onSelect={() => toggleArrayValue(index, product.id)}
                              class="cursor-pointer"
                            >
                              <div class="flex w-full items-center gap-2">
                                <div class="flex h-4 w-4 items-center justify-center">
                                  {#if selected.includes(product.id)}
                                    <Check class="h-4 w-4" />
                                  {/if}
                                </div>
                                <span>{getProductName(product)}</span>
                              </div>
                            </Command.Item>
                          {/each}
                        </Command.List>
                      </Command.Root>
                    </Popover.Content>
                  </Popover.Root>
                  {#if selected.length > 0}
                    <div class="mt-3 flex flex-wrap gap-1.5">
                      {#each selected as id}
                        <Badge variant="secondary" class="gap-1">
                          {getProductNameById(id)}
                          <button
                            type="button"
                            onclick={() => toggleArrayValue(index, id)}
                            class="ml-0.5 rounded-full p-0.5 hover:bg-muted-strong"
                            aria-label="Remove {getProductNameById(id)}"
                          >
                            <X class="h-3 w-3" />
                          </button>
                        </Badge>
                      {/each}
                    </div>
                  {/if}

                {:else if filter.field === "price"}
                  <div class="flex items-center gap-3">
                    <select
                      class="rounded-lg border border-input-border px-3 py-2 text-sm shadow-sm"
                      value={filter.operator}
                      onchange={(e) => {
                        localFilters[index] = { ...filter, operator: (e.target as HTMLSelectElement).value };
                      }}
                    >
                      <option value="gte">{"≥"}</option>
                      <option value="lte">{"≤"}</option>
                    </select>
                    <input
                      type="number"
                      class="w-32 rounded-lg border border-input-border px-3 py-2 text-sm shadow-sm"
                      value={filter.value}
                      placeholder="Price in cents"
                      onchange={(e) => {
                        localFilters[index] = { ...filter, value: Number((e.target as HTMLInputElement).value) };
                      }}
                    />
                    <span class="text-sm text-muted-foreground">cents</span>
                  </div>

                {:else if filter.field === "stock"}
                  <div class="flex items-center gap-3">
                    <select
                      class="rounded-lg border border-input-border px-3 py-2 text-sm shadow-sm"
                      value={filter.operator}
                      onchange={(e) => {
                        localFilters[index] = { ...filter, operator: (e.target as HTMLSelectElement).value };
                      }}
                    >
                      <option value="gt">{">"}</option>
                      <option value="gte">{"≥"}</option>
                    </select>
                    <input
                      type="number"
                      class="w-32 rounded-lg border border-input-border px-3 py-2 text-sm shadow-sm"
                      value={filter.value}
                      placeholder="Stock level"
                      onchange={(e) => {
                        localFilters[index] = { ...filter, value: Number((e.target as HTMLInputElement).value) };
                      }}
                    />
                  </div>

                {:else if filter.field === "visibility"}
                  <select
                    class="rounded-lg border border-input-border px-3 py-2 text-sm shadow-sm"
                    value={filter.value}
                    onchange={(e) => {
                      localFilters[index] = { ...filter, value: (e.target as HTMLSelectElement).value };
                    }}
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="draft">Draft</option>
                  </select>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="mb-4 rounded-lg border border-dashed border-input-border p-6 text-center">
          <p class="text-sm text-muted-foreground">
            No filters defined. Add a filter to populate this collection.
          </p>
        </div>
      {/if}

      <!-- Add filter dropdown -->
      <DropdownMenu.Root bind:open={addFilterOpen}>
        <DropdownMenu.Trigger>
          {#snippet child({ props })}
            <Button variant="outline" size="sm" {...props}>
              <Plus class="mr-2 h-4 w-4" />
              Add filter
            </Button>
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="start">
          {#each filterTypes as ft}
            <DropdownMenu.Item
              onclick={() => {
                addFilterOpen = false;
                addFilter(ft.field, ft.operator);
              }}
            >
              {ft.label}
            </DropdownMenu.Item>
          {/each}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  </div>

  <!-- Products -->
  <div class="overflow-hidden rounded-lg bg-surface shadow">
    <div class="p-6">
      <h2 class="mb-4 text-lg font-medium text-foreground">
        Products ({previewCount ?? data.productCount})
      </h2>
      <DataTable
        data={previewProducts ?? data.preview}
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
