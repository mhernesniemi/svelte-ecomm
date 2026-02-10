<script lang="ts">
  import { stripHtml, getTranslation } from "$lib/utils";

  let { data } = $props();

  const trans = $derived(getTranslation(data.page.translations));
</script>

<svelte:head>
  <title>{trans?.title ?? "Page"} | Hoikka</title>
  <meta name="description" content={stripHtml(trans?.body)?.slice(0, 160) || trans?.title || ""} />
  <meta property="og:title" content="{trans?.title ?? 'Page'} | Hoikka" />
  <meta
    property="og:description"
    content={stripHtml(trans?.body)?.slice(0, 160) || trans?.title || ""}
  />
  <meta property="og:type" content="article" />
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
  <h1 class="text-3xl font-bold text-gray-900">{trans?.title ?? "Page"}</h1>
  {#if trans?.body}
    <div class="prose prose-lg mt-6 max-w-none prose-gray">
      {@html trans.body}
    </div>
  {/if}
</div>
