<script lang="ts">
  import { enhance } from "$app/forms";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let showCreate = $state(false);
  let editingId = $state<number | null>(null);

  function getName(translations: { languageCode: string; name: string }[]): string {
    return translations.find((t) => t.languageCode === "en")?.name ?? "";
  }

  function getCategory(id: number) {
    return data.categories.find((c) => c.id === id);
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Categories</h1>
      <p class="mt-1 text-sm text-gray-600">Organize products in a hierarchical navigation tree</p>
    </div>
    <button
      type="button"
      onclick={() => (showCreate = !showCreate)}
      class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
    >
      Add Category
    </button>
  </div>

  <!-- Create Category Form -->
  {#if showCreate}
    <div class="mb-6 rounded-lg bg-white p-6 shadow">
      <h2 class="mb-4 font-semibold">Create New Category</h2>
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
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label for="cat_slug" class="mb-1 block text-sm font-medium text-gray-700">Slug</label>
            <input
              type="text"
              id="cat_slug"
              name="slug"
              placeholder="e.g., electronics"
              class="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label for="cat_name_en" class="mb-1 block text-sm font-medium text-gray-700"
              >Name (EN)</label
            >
            <input
              type="text"
              id="cat_name_en"
              name="name_en"
              placeholder="e.g., Electronics"
              class="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label for="cat_parent" class="mb-1 block text-sm font-medium text-gray-700"
              >Parent Category</label
            >
            <select
              id="cat_parent"
              name="parent_id"
              class="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="">None (Root)</option>
              {#each data.categories as category}
                <option value={category.id}>{getName(category.translations)}</option>
              {/each}
            </select>
          </div>
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onclick={() => (showCreate = false)}
            class="rounded-lg border px-4 py-2"
          >
            Cancel
          </button>
          <button type="submit" class="rounded-lg bg-blue-600 px-4 py-2 text-white">
            Create Category
          </button>
        </div>
      </form>
    </div>
  {/if}

  <!-- Categories Tree -->
  {#if data.tree.length === 0}
    <div class="rounded-lg border border-dashed border-gray-300 p-12 text-center">
      <svg
        class="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
        />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No categories</h3>
      <p class="mt-1 text-sm text-gray-500">Get started by creating a root category.</p>
      <div class="mt-6">
        <button
          type="button"
          onclick={() => (showCreate = true)}
          class="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add Category
        </button>
      </div>
    </div>
  {:else}
    <div class="rounded-lg bg-white shadow">
      <div class="divide-y">
        {#snippet categoryNode(node: (typeof data.tree)[0], depth: number)}
          <div class="px-6 py-3" style="padding-left: {24 + depth * 24}px">
            {#if editingId === node.id}
              <!-- Edit Form -->
              <form
                method="POST"
                action="?/update"
                class="flex items-center gap-4"
                use:enhance={() => {
                  return async ({ update }) => {
                    await update();
                    editingId = null;
                  };
                }}
              >
                <input type="hidden" name="id" value={node.id} />
                <input
                  type="text"
                  name="slug"
                  value={node.slug}
                  class="rounded border px-2 py-1 text-sm"
                  placeholder="Slug"
                />
                <input
                  type="text"
                  name="name_en"
                  value={getName(node.translations)}
                  class="rounded border px-2 py-1 text-sm"
                  placeholder="Name"
                />
                <select name="parent_id" class="rounded border px-2 py-1 text-sm">
                  <option value="">None (Root)</option>
                  {#each data.categories.filter((c) => c.id !== node.id) as category}
                    <option value={category.id} selected={category.id === node.parentId}>
                      {getName(category.translations)}
                    </option>
                  {/each}
                </select>
                <button type="submit" class="text-sm text-blue-600 hover:text-blue-800">Save</button
                >
                <button
                  type="button"
                  onclick={() => (editingId = null)}
                  class="text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </form>
            {:else}
              <!-- Display -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  {#if node.children.length > 0}
                    <svg
                      class="h-4 w-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  {:else}
                    <span class="w-4"></span>
                  {/if}
                  <span class="font-medium">{getName(node.translations)}</span>
                  <span class="text-sm text-gray-400">/{node.slug}</span>
                </div>
                <div class="flex gap-2">
                  <button
                    type="button"
                    onclick={() => (editingId = node.id)}
                    class="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Edit
                  </button>
                  <form method="POST" action="?/delete" use:enhance>
                    <input type="hidden" name="id" value={node.id} />
                    <button type="submit" class="text-sm text-red-600 hover:text-red-800"
                      >Delete</button
                    >
                  </form>
                </div>
              </div>
            {/if}
          </div>
          {#each node.children as child}
            {@render categoryNode(child, depth + 1)}
          {/each}
        {/snippet}

        {#each data.tree as rootNode}
          {@render categoryNode(rootNode, 0)}
        {/each}
      </div>
    </div>
  {/if}
</div>
