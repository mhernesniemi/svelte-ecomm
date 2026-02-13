<script lang="ts">
  import { stripHtml } from "$lib/utils";

  let { data } = $props();
</script>

<svelte:head>
  <title>{data.page.title} | Hoikka</title>
  <meta
    name="description"
    content={stripHtml(data.page.body)?.slice(0, 160) || data.page.title || ""}
  />
  <meta property="og:title" content="{data.page.title} | Hoikka" />
  <meta
    property="og:description"
    content={stripHtml(data.page.body)?.slice(0, 160) || data.page.title || ""}
  />
  <meta property="og:type" content="article" />
  {#if data.page.imageUrl}
    <meta property="og:image" content="{data.page.imageUrl}?tr=w-1200,h-630,fo-auto" />
  {/if}
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
  {#if data.page.imageUrl}
    <img
      src="{data.page.imageUrl}?tr=w-768,h-400,fo-auto"
      alt={data.page.title}
      class="mb-8 h-auto w-full rounded-lg object-cover"
    />
  {/if}
  <h1 class="text-3xl font-bold text-gray-900">{data.page.title}</h1>
  {#if data.page.body}
    <div class="prose prose-lg mt-6 max-w-none prose-gray">
      {@html data.page.body}
    </div>
  {/if}
</div>
