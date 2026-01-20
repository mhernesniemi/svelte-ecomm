<script lang="ts">
  import FolderOpen from "@lucide/svelte/icons/folder-open";

  let { data } = $props();

  function getTranslation(
    translations: {
      languageCode: string;
      name: string;
      slug: string;
      description?: string | null;
    }[],
    lang: string
  ) {
    return translations.find((t) => t.languageCode === lang) ?? translations[0];
  }
</script>

<svelte:head>
  <title>Collections</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
  <h1 class="mb-8 text-3xl font-bold text-gray-900">Collections</h1>

  {#if data.collections.length === 0}
    <div class="py-16 text-center">
      <FolderOpen class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-4 text-lg font-medium text-gray-900">No collections available</h3>
      <p class="mt-2 text-gray-500">
        <a href="/products" class="text-blue-600 hover:text-blue-700">View all products</a>
      </p>
    </div>
  {:else}
    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {#each data.collections as collection}
        {@const trans = getTranslation(collection.translations, "en")}
        <a
          href="/collections/{trans?.slug}"
          class="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
        >
          {#if collection.featuredAsset}
            <div class="aspect-video overflow-hidden">
              <img
                src="{collection.featuredAsset.source}?tr=w-600,h-400,fo-auto"
                alt={trans?.name ?? "Collection"}
                class="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </div>
          {:else}
            <div
              class="flex aspect-video items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200"
            >
              <FolderOpen class="h-16 w-16 text-gray-400" />
            </div>
          {/if}

          <div class="p-4">
            <h2 class="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
              {trans?.name ?? "Untitled"}
            </h2>
            {#if trans?.description}
              <p class="mt-1 line-clamp-2 text-sm text-gray-600">{trans.description}</p>
            {/if}
            <p class="mt-2 text-sm text-gray-500">
              {collection.productCount} products
            </p>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>
