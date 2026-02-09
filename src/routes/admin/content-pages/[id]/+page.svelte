<script lang="ts">
  import { enhance } from "$app/forms";
  import { page } from "$app/stores";
  import { toast } from "svelte-sonner";
  import { Button } from "$lib/components/admin/ui/button";
  import { Checkbox } from "$lib/components/admin/ui/checkbox";
  import { RichTextEditor } from "$lib/components/admin/ui/rich-text-editor";
  import DeleteConfirmDialog from "$lib/components/admin/DeleteConfirmDialog.svelte";
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
    if (form?.success) toast.success(form.message || "Page updated");
    if (form?.error) toast.error(form.error);
  });

  let isSubmitting = $state(false);
  let showDelete = $state(false);

  const translation = $derived(
    data.page.translations.find((t) => t.languageCode === "en") ?? data.page.translations[0]
  );

  let title = $state("");
  let slug = $state("");
  let published = $state(false);

  $effect(() => {
    title = translation?.title ?? "";
    slug = translation?.slug ?? "";
    published = data.page.published;
  });
</script>

<svelte:head><title>{title || "Edit Content Page"} | Admin</title></svelte:head>

<div class="space-y-6">
  <div class="mb-6 flex items-center justify-between">
    <a href="/admin/content-pages" class="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
      ><ChevronLeft class="h-4 w-4" /> Back to Pages</a
    >
  </div>
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold">{title || "Edit Content Page"}</h1>
    <div class="flex items-center gap-3">
      {#if published && slug}
        <a
          href="/pages/{data.page.id}/{slug}"
          target="_blank"
          class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground-secondary"
        >
          View on storefront <ExternalLink class="h-3.5 w-3.5" />
        </a>
      {/if}
      <Button type="submit" form="content-page-form" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  </div>

  <form
    id="content-page-form"
    method="POST"
    action="?/update"
    use:enhance={() => {
      isSubmitting = true;
      return async ({ update }) => {
        isSubmitting = false;
        await update({ reset: false });
      };
    }}
    class="space-y-6"
  >
    <div class="overflow-hidden rounded-lg bg-surface shadow">
      <div class="p-6">
        <h2 class="mb-4 text-lg font-medium text-foreground">Page Details</h2>

        <div class="space-y-4">
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
              content={translation?.body ?? ""}
              placeholder="Write page content..."
            />
          </div>

          <div class="flex items-center gap-2">
            <Checkbox id="published" bind:checked={published} />
            {#if published}
              <input type="hidden" name="published" value="on" />
            {/if}
            <label for="published" class="text-sm font-medium text-foreground-secondary">
              Published
            </label>
          </div>
        </div>
      </div>
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

<DeleteConfirmDialog
  bind:open={showDelete}
  title="Delete Page?"
  description="Are you sure you want to delete this page? This action cannot be undone."
/>
