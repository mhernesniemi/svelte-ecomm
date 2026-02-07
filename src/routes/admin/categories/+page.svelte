<script lang="ts">
  import { enhance } from "$app/forms";
  import { Button } from "$lib/components/admin/ui/button";
  import type { PageData } from "./$types";
  import FolderOpen from "@lucide/svelte/icons/folder-open";
  import Pencil from "@lucide/svelte/icons/pencil";
  import PlusIcon from "@lucide/svelte/icons/plus";

  let { data }: { data: PageData } = $props();

  let showCreate = $state(false);
  let editingId = $state<number | null>(null);

  function getName(translations: { languageCode: string; name: string }[]): string {
    return translations.find((t) => t.languageCode === "en")?.name ?? "";
  }
</script>

<svelte:head><title>Categories | Admin</title></svelte:head>

<div>
  <div class="mb-6 flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-foreground">Categories</h1>
    </div>
    <Button type="button" onclick={() => (showCreate = !showCreate)}
      ><PlusIcon class="h-4 w-4" /> Add Category</Button
    >
  </div>

  <!-- Create Category Form -->
  {#if showCreate}
    <div class="mb-6 rounded-lg border border-border bg-surface p-6">
      <h2 class="mb-4 text-sm font-semibold text-foreground">New Category</h2>
      <form
        method="POST"
        action="?/create"
        use:enhance={() => {
          return async ({ update }) => {
            await update();
            showCreate = false;
          };
        }}
      >
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label
              for="cat_name_en"
              class="mb-1 block text-sm font-medium text-foreground-secondary"
            >
              Name
            </label>
            <input
              type="text"
              id="cat_name_en"
              name="name_en"
              placeholder="e.g., Electronics"
              class="w-full rounded-lg border border-input-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label for="cat_slug" class="mb-1 block text-sm font-medium text-foreground-secondary">
              Slug
            </label>
            <input
              type="text"
              id="cat_slug"
              name="slug"
              placeholder="e.g., electronics"
              class="w-full rounded-lg border border-input-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label
              for="cat_parent"
              class="mb-1 block text-sm font-medium text-foreground-secondary"
            >
              Parent
            </label>
            <select
              id="cat_parent"
              name="parent_id"
              class="w-full rounded-lg border border-input-border px-3 py-2 text-sm"
            >
              <option value="">None (Root)</option>
              {#each data.categories as category}
                <option value={category.id}>{getName(category.translations)}</option>
              {/each}
            </select>
          </div>
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onclick={() => (showCreate = false)}>
            Cancel
          </Button>
          <Button type="submit" size="sm">Create</Button>
        </div>
      </form>
    </div>
  {/if}

  <!-- Categories Tree -->
  {#if data.tree.length === 0}
    <div class="rounded-lg border border-dashed border-input-border p-12 text-center">
      <FolderOpen class="mx-auto h-12 w-12 text-placeholder" />
      <h3 class="mt-2 text-sm font-medium text-foreground">No categories</h3>
      <p class="mt-1 text-sm text-muted-foreground">Get started by creating a root category.</p>
      <div class="mt-6">
        <Button type="button" onclick={() => (showCreate = true)}>Add Category</Button>
      </div>
    </div>
  {:else}
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div class="overflow-hidden rounded-lg border border-border bg-surface py-2">
        {#snippet categoryNode(node: (typeof data.tree)[0], depth: number, parentPath: string)}
          {@const fullPath = `${parentPath}/${node.slug}`}
          <div>
            <!-- Display row -->
            <button
              type="button"
              class="group flex w-full cursor-pointer items-center justify-between px-4 py-2 text-left {editingId ===
              node.id
                ? 'bg-background'
                : 'hover:bg-hover'}"
              onclick={() => (editingId = editingId === node.id ? null : node.id)}
            >
              <div class="flex items-center gap-2">
                {#if depth > 0}
                  <span class="whitespace-pre text-gray-300">{"— ".repeat(depth)}</span>
                {/if}
                <span class="text-sm font-medium text-foreground">{getName(node.translations)}</span
                >
                <span class="text-sm text-placeholder">{fullPath}</span>
              </div>
              <Pencil
                class="h-4 w-4 text-placeholder opacity-0 transition-opacity group-hover:opacity-100 {editingId ===
                node.id
                  ? '!text-blue-600 !opacity-100'
                  : ''}"
              />
            </button>
            <!-- Edit panel -->
            {#if editingId === node.id}
              <div class="border-t border-border bg-background px-4 pt-3 pb-4">
                <form
                  method="POST"
                  action="?/update"
                  use:enhance={() => {
                    return async ({ update }) => {
                      await update();
                      editingId = null;
                    };
                  }}
                >
                  <input type="hidden" name="id" value={node.id} />
                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label
                        for="edit_name_{node.id}"
                        class="mb-1 block text-sm font-medium text-foreground-secondary"
                      >
                        Name
                      </label>
                      <input
                        type="text"
                        id="edit_name_{node.id}"
                        name="name_en"
                        value={getName(node.translations)}
                        class="w-full rounded-lg border border-input-border px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label
                        for="edit_slug_{node.id}"
                        class="mb-1 block text-sm font-medium text-foreground-secondary"
                      >
                        Slug
                      </label>
                      <input
                        type="text"
                        id="edit_slug_{node.id}"
                        name="slug"
                        value={node.slug}
                        class="w-full rounded-lg border border-input-border px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label
                        for="edit_parent_{node.id}"
                        class="mb-1 block text-sm font-medium text-foreground-secondary"
                      >
                        Parent
                      </label>
                      <select
                        id="edit_parent_{node.id}"
                        name="parent_id"
                        class="w-full rounded-lg border border-input-border px-3 py-2 text-sm"
                      >
                        <option value="">None (Root)</option>
                        {#each data.categories.filter((c) => c.id !== node.id) as category}
                          <option value={category.id} selected={category.id === node.parentId}>
                            {getName(category.translations)}
                          </option>
                        {/each}
                      </select>
                    </div>
                  </div>
                  <div class="mt-4 flex items-center justify-between">
                    <div class="flex gap-2">
                      <Button type="submit" size="sm">Save Changes</Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onclick={() => (editingId = null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </form>
                <div class="mt-3 border-t border-border pt-3">
                  <form
                    method="POST"
                    action="?/delete"
                    use:enhance={() => {
                      return async ({ update }) => {
                        await update();
                        editingId = null;
                      };
                    }}
                  >
                    <input type="hidden" name="id" value={node.id} />
                    <button
                      type="submit"
                      class="text-sm text-red-600 hover:text-red-800 dark:text-red-700"
                    >
                      Delete this category{node.children.length > 0 ? ` and all subcategories` : ""}
                    </button>
                  </form>
                </div>
              </div>
            {/if}
          </div>
          {#each node.children as child}
            {@render categoryNode(child, depth + 1, fullPath)}
          {/each}
        {/snippet}
        {#each data.tree as rootNode, i}
          <div>
            {@render categoryNode(rootNode, 0, "")}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
