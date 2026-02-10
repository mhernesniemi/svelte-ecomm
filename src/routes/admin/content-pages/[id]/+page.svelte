<script lang="ts">
  import { enhance } from "$app/forms";
  import { page } from "$app/stores";
  import { toast } from "svelte-sonner";
  import { Button } from "$lib/components/admin/ui/button";
  import { Checkbox } from "$lib/components/admin/ui/checkbox";
  import { RichTextEditor } from "$lib/components/admin/ui/rich-text-editor";
  import DeleteConfirmDialog from "$lib/components/admin/DeleteConfirmDialog.svelte";
  import {
    translationsToMap,
    LANGUAGES,
    DEFAULT_LANGUAGE,
    TRANSLATION_LANGUAGES
  } from "$lib/config/languages.js";
  import { cn } from "$lib/utils";
  import { onMount } from "svelte";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import ExternalLink from "@lucide/svelte/icons/external-link";
  let { data, form } = $props();

  onMount(() => {
    if ($page.url.searchParams.has("created")) {
      toast.success("Content page created successfully");
      history.replaceState({}, "", $page.url.pathname);
    }
  });

  $effect(() => {
    if (form?.error) toast.error(form.error);
  });

  let isSubmitting = $state(false);
  let showDelete = $state(false);

  let title = $state("");
  let slug = $state("");
  let published = $state(false);
  let activeLanguageTab = $state(DEFAULT_LANGUAGE);
  const translationMap = $derived(translationsToMap(data.translations));

  $effect(() => {
    title = data.page.title ?? "";
    slug = data.page.slug ?? "";
    published = data.page.published;
  });
</script>

<svelte:head><title>{title || "Edit Content Page"} | Admin</title></svelte:head>

<div class="space-y-6">
  <div class="mb-6 flex items-center justify-between">
    <a
      href="/admin/content-pages"
      class="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
      ><ChevronLeft class="h-4 w-4" /> Back to Pages</a
    >
    {#if published && slug}
      <a
        href="/pages/{data.page.id}/{slug}"
        target="_blank"
        class="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
      >
        View in store <ExternalLink class="h-3.5 w-3.5" />
      </a>
    {/if}
  </div>
  <div class="mt-2 flex items-center justify-between">
    <h1 class="text-2xl font-bold">{title || "Edit Content Page"}</h1>
    <Button type="submit" form="content-page-form" disabled={isSubmitting}>
      {isSubmitting ? "Saving..." : "Save Changes"}
    </Button>
  </div>

  <!-- Two Column Layout -->
  <div class="flex flex-col gap-6 lg:flex-row">
    <!-- Main Content (Left) -->
    <div class="flex-1 space-y-6">
  <form
    id="content-page-form"
    method="POST"
    action="?/update"
    use:enhance={() => {
      isSubmitting = true;
      return async ({ result, update }) => {
        await update({ reset: false });
        isSubmitting = false;
        if (result.type === "success") {
          toast.success("Page updated");
        }
      };
    }}
    class="space-y-6"
  >
    <div class="overflow-hidden rounded-lg bg-surface shadow">
      <!-- Language Tabs -->
      {#if TRANSLATION_LANGUAGES.length > 0}
        <div class="flex border-b border-border">
          {#each LANGUAGES as lang}
            <button
              type="button"
              class={cn(
                "border-b-2 border-transparent px-4 py-2.5 text-sm font-medium",
                activeLanguageTab === lang.code
                  ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onclick={() => (activeLanguageTab = lang.code)}
            >
              {lang.name}
            </button>
          {/each}
        </div>
      {/if}

      <!-- Default language fields -->
      <div class={activeLanguageTab !== DEFAULT_LANGUAGE ? "hidden" : ""}>
        <div class="space-y-4 p-6">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="title" class="mb-1 block text-sm font-medium text-foreground-secondary">
                Title <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                bind:value={title}
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
            <label for="body" class="mb-1 block text-sm font-medium text-foreground-secondary">
              Body
            </label>
            <RichTextEditor
              name="body"
              content={data.page.body ?? ""}
              placeholder="Write page content..."
            />
          </div>

        </div>
      </div>

      <!-- Translation language fields -->
      {#each TRANSLATION_LANGUAGES as lang}
        <div class={activeLanguageTab !== lang.code ? "hidden" : ""}>
          <div class="space-y-4 p-6">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label
                  for="translation_{lang.code}_title"
                  class="mb-1 block text-sm font-medium text-foreground-secondary"
                >
                  Title
                </label>
                <input
                  type="text"
                  id="translation_{lang.code}_title"
                  name="title_{lang.code}"
                  value={translationMap[lang.code]?.title ?? ""}
                  class="w-full rounded-lg border border-input-border px-3 py-2 shadow-sm"
                />
              </div>

              <div>
                <label
                  for="translation_{lang.code}_slug"
                  class="mb-1 block text-sm font-medium text-foreground-secondary"
                >
                  Slug
                </label>
                <input
                  type="text"
                  id="translation_{lang.code}_slug"
                  name="slug_{lang.code}"
                  value={translationMap[lang.code]?.slug ?? ""}
                  class="w-full rounded-lg border border-input-border px-3 py-2 shadow-sm"
                />
              </div>
            </div>

            <div>
              <label
                for="translation_{lang.code}_body"
                class="mb-1 block text-sm font-medium text-foreground-secondary"
              >
                Body
              </label>
              <RichTextEditor
                name="body_{lang.code}"
                content={translationMap[lang.code]?.body ?? ""}
                placeholder="Write page content..."
              />
            </div>

            <p class="text-xs text-muted-foreground">
              Leave empty to use the {LANGUAGES.find((l) => l.code === DEFAULT_LANGUAGE)?.name} value.
            </p>
          </div>
        </div>
      {/each}
    </div>
  </form>

  <button
    type="button"
    class="text-sm text-red-600 hover:text-red-800 dark:text-red-700"
    onclick={() => (showDelete = true)}
  >
    Delete this page
  </button>
    </div>

    <!-- Sidebar (Right) -->
    <div class="w-full space-y-6 lg:w-80 lg:shrink-0">
      <div class="rounded-lg bg-surface shadow">
        <div class="border-b border-border px-4 py-3">
          <h2 class="font-semibold">Visibility</h2>
        </div>
        <div class="p-4">
          <div class="flex items-center gap-2">
            <Checkbox id="published" bind:checked={published} />
            {#if published}
              <input type="hidden" name="published" value="on" form="content-page-form" />
            {/if}
            <label for="published" class="text-sm font-medium text-foreground-secondary">
              Published
            </label>
          </div>
          <p class="mt-3 text-xs text-foreground-secondary">
            Set this to published to make it visible on the storefront
          </p>
        </div>
      </div>
    </div>
  </div>
</div>

<DeleteConfirmDialog
  bind:open={showDelete}
  title="Delete Page?"
  description="Are you sure you want to delete this page? This action cannot be undone."
/>
