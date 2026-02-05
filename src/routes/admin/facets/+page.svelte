<script lang="ts">
  import { enhance } from "$app/forms";
  import { Button } from "$lib/components/admin/ui/button";
  import type { PageData } from "./$types";
  import Tag from "@lucide/svelte/icons/tag";
  import Pencil from "@lucide/svelte/icons/pencil";
  import Plus from "@lucide/svelte/icons/plus";

  let { data }: { data: PageData } = $props();

  let showCreate = $state(false);
  let editingFacetId = $state<number | null>(null);
  let editingValueId = $state<number | null>(null);
  let addingValueToFacet = $state<number | null>(null);

  function getName(translations: { languageCode: string; name: string }[]): string {
    return translations.find((t) => t.languageCode === "en")?.name ?? "";
  }
</script>

<svelte:head><title>Facets | Admin</title></svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Facets</h1>
      <p class="mt-1 text-sm text-gray-600">Manage product attributes for filtering</p>
    </div>
    <Button type="button" onclick={() => (showCreate = !showCreate)}>Add Facet</Button>
  </div>

  <!-- Create Facet Form -->
  {#if showCreate}
    <div class="rounded-lg border border-gray-200 bg-white p-6">
      <h2 class="mb-4 text-sm font-semibold text-gray-900">New Facet</h2>
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
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label for="facet_name_en" class="mb-1 block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              id="facet_name_en"
              name="name_en"
              placeholder="e.g., Color"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label for="facet_code" class="mb-1 block text-sm font-medium text-gray-700">
              Code
            </label>
            <input
              type="text"
              id="facet_code"
              name="code"
              placeholder="e.g., color"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
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

  <!-- Facets List -->
  {#if data.facets.length === 0}
    <div class="rounded-lg border border-dashed border-gray-300 p-12 text-center">
      <Tag class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900">No facets</h3>
      <p class="mt-1 text-sm text-gray-500">Get started by creating a new facet.</p>
      <div class="mt-6">
        <Button type="button" onclick={() => (showCreate = true)}>Add Facet</Button>
      </div>
    </div>
  {:else}
    <div class="overflow-hidden rounded-lg border border-gray-200 bg-white">
      {#each data.facets as facet, i}
        <div class={i > 0 ? "border-t border-gray-200" : ""}>
          <!-- Facet row -->
          <button
            type="button"
            class="group flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left {editingFacetId ===
            facet.id
              ? 'bg-gray-50'
              : 'hover:bg-gray-50'}"
            onclick={() => {
              editingFacetId = editingFacetId === facet.id ? null : facet.id;
              editingValueId = null;
              addingValueToFacet = null;
            }}
          >
            <div class="flex items-center gap-3">
              <span class="font-medium text-gray-900">{getName(facet.translations)}</span>
              <span class="text-sm text-gray-400">{facet.code}</span>
              <span class="text-xs text-gray-400">
                {facet.values.length} value{facet.values.length !== 1 ? "s" : ""}
              </span>
            </div>
            <Pencil
              class="h-4 w-4 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 {editingFacetId ===
              facet.id
                ? '!text-blue-600 !opacity-100'
                : ''}"
            />
          </button>

          <!-- Facet edit panel -->
          {#if editingFacetId === facet.id}
            <div class="border-t border-gray-100 bg-gray-50 px-4 pt-3 pb-4">
              <form
                method="POST"
                action="?/update"
                use:enhance={() => {
                  return async ({ update }) => {
                    await update();
                    editingFacetId = null;
                  };
                }}
              >
                <input type="hidden" name="id" value={facet.id} />
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      for="edit_facet_name_{facet.id}"
                      class="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      id="edit_facet_name_{facet.id}"
                      name="name_en"
                      value={getName(facet.translations)}
                      class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      for="edit_facet_code_{facet.id}"
                      class="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Code
                    </label>
                    <input
                      type="text"
                      id="edit_facet_code_{facet.id}"
                      name="code"
                      value={facet.code}
                      class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div class="mt-4 flex items-center justify-between">
                  <div class="flex gap-2">
                    <Button type="submit" size="sm">Save Changes</Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onclick={() => (editingFacetId = null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </form>
              <div class="mt-3 border-t border-gray-200 pt-3">
                <form
                  method="POST"
                  action="?/delete"
                  use:enhance={() => {
                    return async ({ update }) => {
                      await update();
                      editingFacetId = null;
                    };
                  }}
                >
                  <input type="hidden" name="id" value={facet.id} />
                  <button type="submit" class="text-sm text-red-600 hover:text-red-800">
                    Delete this facet{facet.values.length > 0
                      ? ` and ${facet.values.length} values`
                      : ""}
                  </button>
                </form>
              </div>
            </div>
          {/if}

          <!-- Values -->
          {#if facet.values.length > 0 || editingFacetId === facet.id}
            <div class={editingFacetId === facet.id ? "" : "border-t border-gray-100"}>
              {#each facet.values as value}
                <div>
                  <!-- Value row -->
                  <button
                    type="button"
                    class="group flex w-full cursor-pointer items-center justify-between py-2 pr-4 pl-8 text-left {editingValueId ===
                    value.id
                      ? 'bg-gray-50'
                      : 'hover:bg-gray-50'}"
                    onclick={() => {
                      editingValueId = editingValueId === value.id ? null : value.id;
                      addingValueToFacet = null;
                    }}
                  >
                    <div class="flex items-center gap-2">
                      <span class="text-sm text-gray-300">—</span>
                      <span class="text-sm text-gray-700">{getName(value.translations)}</span>
                      <span class="text-xs text-gray-400">{value.code}</span>
                    </div>
                    <Pencil
                      class="h-4 w-4 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 {editingValueId ===
                      value.id
                        ? '!text-blue-600 !opacity-100'
                        : ''}"
                    />
                  </button>

                  <!-- Value edit panel -->
                  {#if editingValueId === value.id}
                    <div class="border-t border-gray-100 bg-gray-50 py-3 pr-4 pl-8">
                      <form
                        method="POST"
                        action="?/updateValue"
                        use:enhance={() => {
                          return async ({ update }) => {
                            await update();
                            editingValueId = null;
                          };
                        }}
                      >
                        <input type="hidden" name="id" value={value.id} />
                        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label
                              for="edit_value_name_{value.id}"
                              class="mb-1 block text-sm font-medium text-gray-700"
                            >
                              Name
                            </label>
                            <input
                              type="text"
                              id="edit_value_name_{value.id}"
                              name="name_en"
                              value={getName(value.translations)}
                              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label
                              for="edit_value_code_{value.id}"
                              class="mb-1 block text-sm font-medium text-gray-700"
                            >
                              Code
                            </label>
                            <input
                              type="text"
                              id="edit_value_code_{value.id}"
                              name="code"
                              value={value.code}
                              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            />
                          </div>
                        </div>
                        <div class="mt-3 flex gap-2">
                          <Button type="submit" size="sm">Save</Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onclick={() => (editingValueId = null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                      <div class="mt-3 border-t border-gray-200 pt-3">
                        <form
                          method="POST"
                          action="?/deleteValue"
                          use:enhance={() => {
                            return async ({ update }) => {
                              await update();
                              editingValueId = null;
                            };
                          }}
                        >
                          <input type="hidden" name="id" value={value.id} />
                          <button type="submit" class="text-sm text-red-600 hover:text-red-800">
                            Delete this value
                          </button>
                        </form>
                      </div>
                    </div>
                  {/if}
                </div>
              {/each}

              <!-- Add Value row -->
              {#if addingValueToFacet === facet.id}
                <div class="border-t border-gray-100 bg-gray-50 py-3 pr-4 pl-8">
                  <form
                    method="POST"
                    action="?/createValue"
                    use:enhance={() => {
                      return async ({ update }) => {
                        await update();
                        addingValueToFacet = null;
                      };
                    }}
                  >
                    <input type="hidden" name="facetId" value={facet.id} />
                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          for="new_value_name_{facet.id}"
                          class="mb-1 block text-sm font-medium text-gray-700"
                        >
                          Name
                        </label>
                        <input
                          type="text"
                          id="new_value_name_{facet.id}"
                          name="name_en"
                          placeholder="e.g., Red"
                          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label
                          for="new_value_code_{facet.id}"
                          class="mb-1 block text-sm font-medium text-gray-700"
                        >
                          Code
                        </label>
                        <input
                          type="text"
                          id="new_value_code_{facet.id}"
                          name="code"
                          placeholder="e.g., red"
                          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <div class="mt-3 flex gap-2">
                      <Button type="submit" size="sm">Add Value</Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onclick={() => (addingValueToFacet = null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              {:else if editingFacetId === facet.id}
                <button
                  type="button"
                  class="flex w-full items-center gap-1 py-2 pl-8 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  onclick={() => (addingValueToFacet = facet.id)}
                >
                  <Plus class="h-3.5 w-3.5" />
                  Add value
                </button>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
