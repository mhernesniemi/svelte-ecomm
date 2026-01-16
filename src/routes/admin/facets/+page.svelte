<script lang="ts">
  import { enhance } from "$app/forms";
  import type { PageData } from "./$types";

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
    <button
      type="button"
      onclick={() => (showCreateFacet = !showCreateFacet)}
      class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
    >
      Add Facet
    </button>
  </div>

  <!-- Create Facet Form -->
  {#if showCreateFacet}
    <div class="mb-6 rounded-lg bg-white p-6 shadow">
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
            <label for="facet_code" class="mb-1 block text-sm font-medium text-gray-700">Code</label
            >
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
          <button
            type="button"
            onclick={() => (showCreateFacet = false)}
            class="rounded-lg border px-4 py-2"
          >
            Cancel
          </button>
          <button type="submit" class="rounded-lg bg-blue-600 px-4 py-2 text-white">
            Create Facet
          </button>
        </div>
      </form>
    </div>
  {/if}

  <!-- Facets List -->
  {#if data.facets.length === 0}
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
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"
        />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No facets</h3>
      <p class="mt-1 text-sm text-gray-500">Get started by creating a new facet.</p>
      <div class="mt-6">
        <button
          type="button"
          onclick={() => (showCreateFacet = true)}
          class="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add Facet
        </button>
      </div>
    </div>
  {:else}
    <div class="space-y-6">
      {#each data.facets as facet}
        <div class="rounded-lg bg-white shadow">
          <div class="flex items-center justify-between border-b px-6 py-4">
            <div>
              <h2 class="font-semibold">{getTranslation(facet.translations)}</h2>
              <p class="text-sm text-gray-500">Code: {facet.code}</p>
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                onclick={() =>
                  (addingValueToFacet = addingValueToFacet === facet.id ? null : facet.id)}
                class="rounded border px-3 py-1 text-sm hover:bg-gray-50"
              >
                Add Value
              </button>
              <form method="POST" action="?/delete" use:enhance>
                <input type="hidden" name="id" value={facet.id} />
                <button type="submit" class="px-3 py-1 text-sm text-red-600 hover:text-red-800">
                  Delete
                </button>
              </form>
            </div>
          </div>

          <!-- Add Value Form -->
          {#if addingValueToFacet === facet.id}
            <div class="border-b bg-gray-50 px-6 py-4">
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
                  <button type="submit" class="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">
                    Add
                  </button>
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
        </div>
      {/each}
    </div>
  {/if}
</div>
