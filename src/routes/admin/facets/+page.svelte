<script lang="ts">
  import { enhance } from "$app/forms";
  import { Button } from "$lib/components/admin/ui/button";
  import { Card } from "$lib/components/admin/ui/card";
  import type { PageData } from "./$types";
  import Tag from "@lucide/svelte/icons/tag";

  let { data }: { data: PageData } = $props();

  let showCreateFacet = $state(false);
  let addingValueToFacet = $state<number | null>(null);

  function getTranslation(translations: { languageCode: string; name: string }[]): string {
    return translations.find((t) => t.languageCode === "en")?.name ?? "";
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Facets</h1>
      <p class="mt-1 text-sm text-gray-600">Manage product attributes for filtering</p>
    </div>
    <Button type="button" onclick={() => (showCreateFacet = !showCreateFacet)}>
      Add Facet
    </Button>
  </div>

  <!-- Create Facet Form -->
  {#if showCreateFacet}
    <Card class="mb-6 p-6">
      <h2 class="mb-4 font-semibold">Create New Facet</h2>
      <form
        method="POST"
        action="?/create"
        use:enhance={() => {
          return async ({ update }) => {
            await update();
            showCreateFacet = false;
          };
        }}
      >
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label for="facet_code" class="mb-1 block text-sm font-medium text-gray-700">Code</label>
            <input
              type="text"
              id="facet_code"
              name="code"
              placeholder="e.g., color"
              class="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label for="facet_name_en" class="mb-1 block text-sm font-medium text-gray-700"
              >Name (EN)</label
            >
            <input
              type="text"
              id="facet_name_en"
              name="name_en"
              placeholder="e.g., Color"
              class="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onclick={() => (showCreateFacet = false)}>
            Cancel
          </Button>
          <Button type="submit">Create Facet</Button>
        </div>
      </form>
    </Card>
  {/if}

  <!-- Facets List -->
  {#if data.facets.length === 0}
    <div class="rounded-lg border border-dashed border-gray-300 p-12 text-center">
      <Tag class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900">No facets</h3>
      <p class="mt-1 text-sm text-gray-500">Get started by creating a new facet.</p>
      <div class="mt-6">
        <Button type="button" onclick={() => (showCreateFacet = true)}>
          Add Facet
        </Button>
      </div>
    </div>
  {:else}
    <div class="space-y-6">
      {#each data.facets as facet}
        <Card>
          <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h2 class="font-semibold">{getTranslation(facet.translations)}</h2>
              <p class="text-sm text-gray-500">Code: {facet.code}</p>
            </div>
            <div class="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onclick={() =>
                  (addingValueToFacet = addingValueToFacet === facet.id ? null : facet.id)}
              >
                Add Value
              </Button>
              <form method="POST" action="?/delete" use:enhance>
                <input type="hidden" name="id" value={facet.id} />
                <button type="submit" class="text-sm text-red-600 hover:text-red-800">
                  Delete
                </button>
              </form>
            </div>
          </div>

          <!-- Add Value Form -->
          {#if addingValueToFacet === facet.id}
            <div class="border-b border-gray-200 bg-gray-50 px-6 py-4">
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
                <div class="flex items-end gap-4">
                  <div class="flex-1">
                    <label
                      for="value_code_{facet.id}"
                      class="mb-1 block text-sm font-medium text-gray-700">Code</label
                    >
                    <input
                      type="text"
                      id="value_code_{facet.id}"
                      name="code"
                      placeholder="e.g., red"
                      class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div class="flex-1">
                    <label
                      for="value_name_{facet.id}"
                      class="mb-1 block text-sm font-medium text-gray-700">Name (EN)</label
                    >
                    <input
                      type="text"
                      id="value_name_{facet.id}"
                      name="name_en"
                      placeholder="e.g., Red"
                      class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <Button type="submit" size="sm">Add</Button>
                </div>
              </form>
            </div>
          {/if}

          <!-- Values -->
          <div class="px-6 py-4">
            {#if facet.values.length === 0}
              <p class="text-sm text-gray-500">No values yet</p>
            {:else}
              <div class="flex flex-wrap gap-2">
                {#each facet.values as value}
                  <span class="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm">
                    {getTranslation(value.translations)}
                    <span class="ml-1 text-gray-400">({value.code})</span>
                  </span>
                {/each}
              </div>
            {/if}
          </div>
        </Card>
      {/each}
    </div>
  {/if}
</div>
