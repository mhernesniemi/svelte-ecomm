<script lang="ts">
  import { enhance } from "$app/forms";
  import { Button } from "$lib/components/admin/ui/button";
  import { Badge } from "$lib/components/admin/ui/badge";
  import * as Dialog from "$lib/components/admin/ui/dialog";
  import * as Collapsible from "$lib/components/admin/ui/collapsible";
  import { TRANSLATION_LANGUAGES } from "$lib/config/languages.js";
  import { slugify, cn } from "$lib/utils.js";
  import FolderOpen from "@lucide/svelte/icons/folder-open";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import Pencil from "@lucide/svelte/icons/pencil";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  type CategoryNode = (typeof data.tree)[0];
  type FlatCategory = { id: number; name: string; depth: number };

  function flattenTree(nodes: CategoryNode[], depth = 0): FlatCategory[] {
    return nodes.flatMap((node) => [
      { id: node.id, name: node.name, depth },
      ...flattenTree(node.children, depth + 1)
    ]);
  }

  function collectIds(nodes: CategoryNode[]): number[] {
    return nodes.flatMap((node) => [node.id, ...collectIds(node.children)]);
  }

  const flatCategories = $derived(flattenTree(data.tree));
  let expandedIds = $state(new Set<number>(collectIds(data.tree)));

  // Dialog state
  let createDialogOpen = $state(false);
  let editDialogOpen = $state(false);
  let editingCategory = $state<CategoryNode | null>(null);
  let createParentId = $state<number | null>(null);

  // Auto-slug for create dialog
  let createName = $state("");
  let createSlug = $state("");
  let createSlugManual = $state(false);

  function openCreateDialog(parentId: number | null = null) {
    createParentId = parentId;
    createName = "";
    createSlug = "";
    createSlugManual = false;
    createDialogOpen = true;
  }

  function openEditDialog(node: CategoryNode) {
    editingCategory = node;
    editDialogOpen = true;
  }

  function toggleExpand(id: number) {
    const next = new Set(expandedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    expandedIds = next;
  }

  function handleCreateNameInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    createName = value;
    if (!createSlugManual) {
      createSlug = slugify(value);
    }
  }

  function handleCreateSlugInput(e: Event) {
    createSlug = (e.target as HTMLInputElement).value;
    createSlugManual = true;
  }

  // Re-expand all when tree changes (new data after create/update/delete)
  $effect(() => {
    expandedIds = new Set(collectIds(data.tree));
  });
</script>

<svelte:head><title>Categories | Admin</title></svelte:head>

<div>
  <div class="mb-6">
    <h1 class="text-2xl font-bold text-foreground">Categories</h1>
  </div>

  {#if data.tree.length === 0}
    <!-- Empty state -->
    <div class="rounded-lg border border-dashed border-input-border p-12 text-center">
      <FolderOpen class="mx-auto h-12 w-12 text-placeholder" />
      <h3 class="mt-2 text-sm font-medium text-foreground">No categories</h3>
      <p class="mt-1 text-sm text-muted-foreground">Get started by creating a root category.</p>
      <div class="mt-6">
        <Button type="button" onclick={() => openCreateDialog()}>Add Category</Button>
      </div>
    </div>
  {:else}
    <!-- Category tree -->
    <div class="overflow-hidden rounded-lg border border-border bg-surface">
      {#snippet categoryNode(node: CategoryNode, depth: number, parentPath: string)}
        {@const fullPath = `${parentPath}/${node.slug}`}
        {@const hasChildren = node.children.length > 0}
        {@const isExpanded = expandedIds.has(node.id)}
        {@const taxRate = data.taxRates.find((r) => r.code === node.taxCode)}
        {@const translations = data.categoryTranslations[node.id]}
        {@const translatedLangs = TRANSLATION_LANGUAGES.filter((lang) =>
          translations?.find((t) => t.languageCode === lang.code && t.name)
        )}

        <Collapsible.Root open={isExpanded}>
          <div
            class={cn(
              "group flex w-full items-center border-b border-border last:border-b-0",
              "hover:bg-hover"
            )}
            style="padding-left: {depth * 1.5 + 0.5}rem"
          >
            <!-- Chevron toggle -->
            <button
              type="button"
              class={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                hasChildren ? "cursor-pointer hover:bg-muted" : "cursor-default"
              )}
              onclick={(e) => {
                e.stopPropagation();
                if (hasChildren) toggleExpand(node.id);
              }}
              tabindex={hasChildren ? 0 : -1}
            >
              {#if hasChildren}
                <ChevronRight
                  class={cn(
                    "h-4 w-4 text-muted-foreground transition-transform duration-200",
                    isExpanded && "rotate-90"
                  )}
                />
              {/if}
            </button>

            <!-- Row content -->
            <div class="flex min-w-0 flex-1 items-center gap-3 py-2.5 pr-4">
              <span class="text-sm font-medium text-foreground">{node.name}</span>
              <span class="truncate text-sm text-placeholder">{fullPath}</span>
              <span class="ml-auto flex shrink-0 items-center gap-3">
                <span class="flex items-center gap-1.5">
                  {#each translatedLangs as lang}
                    <Badge variant="outline">{lang.code.toUpperCase()}</Badge>
                  {/each}
                </span>
                {#if taxRate}
                  <Badge variant="outline">{taxRate.name}</Badge>
                {/if}
              </span>
            </div>

            <!-- Action buttons -->
            <div class="flex shrink-0 items-center gap-1 pr-3 pl-4">
              <button
                type="button"
                class="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted"
                title="Add child category"
                onclick={() => openCreateDialog(node.id)}
              >
                <PlusIcon class="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <button
                type="button"
                class="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted"
                title="Edit category"
                onclick={() => openEditDialog(node)}
              >
                <Pencil class="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>

          <Collapsible.Content>
            {#each node.children as child}
              {@render categoryNode(child, depth + 1, fullPath)}
            {/each}
          </Collapsible.Content>
        </Collapsible.Root>
      {/snippet}

      {#each data.tree as rootNode}
        {@render categoryNode(rootNode, 0, "")}
      {/each}
      <button
        type="button"
        class="flex w-full cursor-pointer items-center justify-center gap-2 py-2.5 text-sm text-foreground-secondary hover:bg-hover hover:text-foreground"
        onclick={() => openCreateDialog()}
      >
        <PlusIcon class="h-4 w-4" /> Add Category
      </button>
    </div>
  {/if}
</div>

<!-- Create Dialog -->
<Dialog.Root bind:open={createDialogOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>New Category</Dialog.Title>
      <Dialog.Description>Create a new category for your store.</Dialog.Description>
    </Dialog.Header>
    <form
      method="POST"
      action="?/create"
      use:enhance={() => {
        return async ({ update }) => {
          await update();
          createDialogOpen = false;
        };
      }}
    >
      <div class="my-4 grid grid-cols-2 gap-4">
        <div>
          <label
            for="create_name_en"
            class="mb-1 block text-sm font-medium text-foreground-secondary"
          >
            Name
          </label>
          <input
            type="text"
            id="create_name_en"
            name="name_en"
            value={createName}
            oninput={handleCreateNameInput}
            placeholder="e.g., Electronics"
            class="w-full rounded-lg border border-input-border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label for="create_slug" class="mb-1 block text-sm font-medium text-foreground-secondary">
            Slug
          </label>
          <input
            type="text"
            id="create_slug"
            name="slug"
            value={createSlug}
            oninput={handleCreateSlugInput}
            placeholder="e.g., electronics"
            class="w-full rounded-lg border border-input-border px-3 py-2 text-sm"
          />
        </div>
        {#each TRANSLATION_LANGUAGES as lang}
          <div class="col-span-2">
            <label
              for="create_name_{lang.code}"
              class="mb-1 block text-sm font-medium text-foreground-secondary"
            >
              {lang.name} name
            </label>
            <input
              type="text"
              id="create_name_{lang.code}"
              name="name_{lang.code}"
              placeholder="Leave empty to use default"
              class="w-full rounded-lg border border-input-border px-3 py-2 text-sm"
            />
          </div>
        {/each}
        <div>
          <label
            for="create_parent"
            class="mb-1 block text-sm font-medium text-foreground-secondary"
          >
            Parent
          </label>
          <select
            id="create_parent"
            name="parent_id"
            class="w-full rounded-lg border border-input-border px-3 py-2 text-sm"
          >
            <option value="">None (Root)</option>
            {#each flatCategories as category}
              <option value={category.id} selected={category.id === createParentId}>
                {"— ".repeat(category.depth)}{category.name}
              </option>
            {/each}
          </select>
        </div>
        <div>
          <label
            for="create_tax_code"
            class="mb-1 block text-sm font-medium text-foreground-secondary"
          >
            Tax Rate
          </label>
          <select
            id="create_tax_code"
            name="tax_code"
            class="w-full rounded-lg border border-input-border px-3 py-2 text-sm"
          >
            {#each data.taxRates as rate}
              <option value={rate.code} selected={rate.code === "standard"}>{rate.name}</option>
            {/each}
          </select>
        </div>
      </div>
      <Dialog.Footer class="mt-6">
        <Button type="button" variant="outline" onclick={() => (createDialogOpen = false)}>
          Cancel
        </Button>
        <Button type="submit">Create</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>

<!-- Edit Dialog -->
<Dialog.Root bind:open={editDialogOpen}>
  <Dialog.Content>
    {#if editingCategory}
      <Dialog.Header>
        <Dialog.Title>Edit Category</Dialog.Title>
        <Dialog.Description>Update category details.</Dialog.Description>
      </Dialog.Header>
      <form
        method="POST"
        action="?/update"
        use:enhance={() => {
          return async ({ update }) => {
            await update();
            editDialogOpen = false;
          };
        }}
        class="my-4"
      >
        <input type="hidden" name="id" value={editingCategory.id} />
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label
              for="edit_name_{editingCategory.id}"
              class="mb-1 block text-sm font-medium text-foreground-secondary"
            >
              Name
            </label>
            <input
              type="text"
              id="edit_name_{editingCategory.id}"
              name="name_en"
              value={editingCategory.name}
              class="w-full rounded-lg border border-input-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label
              for="edit_slug_{editingCategory.id}"
              class="mb-1 block text-sm font-medium text-foreground-secondary"
            >
              Slug
            </label>
            <input
              type="text"
              id="edit_slug_{editingCategory.id}"
              name="slug"
              value={editingCategory.slug}
              class="w-full rounded-lg border border-input-border px-3 py-2 text-sm"
            />
          </div>
          {#each TRANSLATION_LANGUAGES as lang}
            <div class="col-span-2">
              <label
                for="edit_name_{lang.code}_{editingCategory.id}"
                class="mb-1 block text-sm font-medium text-foreground-secondary"
              >
                {lang.name} name
              </label>
              <input
                type="text"
                id="edit_name_{lang.code}_{editingCategory.id}"
                name="name_{lang.code}"
                value={data.categoryTranslations[editingCategory.id]?.find(
                  (t) => t.languageCode === lang.code
                )?.name ?? ""}
                class="w-full rounded-lg border border-input-border px-3 py-2 text-sm"
              />
            </div>
          {/each}
          <div>
            <label
              for="edit_parent_{editingCategory.id}"
              class="mb-1 block text-sm font-medium text-foreground-secondary"
            >
              Parent
            </label>
            <select
              id="edit_parent_{editingCategory.id}"
              name="parent_id"
              class="w-full rounded-lg border border-input-border px-3 py-2 text-sm"
            >
              <option value="">None (Root)</option>
              {#each flatCategories.filter((c) => c.id !== editingCategory!.id) as category}
                <option value={category.id} selected={category.id === editingCategory!.parentId}>
                  {"— ".repeat(category.depth)}{category.name}
                </option>
              {/each}
            </select>
          </div>
          <div>
            <label
              for="edit_tax_code_{editingCategory.id}"
              class="mb-1 block text-sm font-medium text-foreground-secondary"
            >
              Tax Rate
            </label>
            <select
              id="edit_tax_code_{editingCategory.id}"
              name="tax_code"
              class="w-full rounded-lg border border-input-border px-3 py-2 text-sm"
            >
              {#each data.taxRates as rate}
                <option value={rate.code} selected={rate.code === editingCategory!.taxCode}>
                  {rate.name}
                </option>
              {/each}
            </select>
          </div>
        </div>
        <Dialog.Footer class="mt-6">
          <Button type="button" variant="outline" onclick={() => (editDialogOpen = false)}>
            Cancel
          </Button>
          <Button type="submit">Save Changes</Button>
        </Dialog.Footer>
      </form>
      {#if editingCategory.children.length === 0}
        <div class="border-t border-border pt-4">
          <form
            method="POST"
            action="?/delete"
            use:enhance={() => {
              return async ({ update }) => {
                await update();
                editDialogOpen = false;
              };
            }}
          >
            <input type="hidden" name="id" value={editingCategory.id} />
            <button
              type="submit"
              class="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            >
              Delete this category
            </button>
          </form>
        </div>
      {/if}
    {/if}
  </Dialog.Content>
</Dialog.Root>
