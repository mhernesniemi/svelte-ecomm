<script lang="ts">
  import { enhance } from "$app/forms";
  import { page } from "$app/stores";
  import { toast } from "svelte-sonner";
  import { Button } from "$lib/components/admin/ui/button";
  import { RichTextEditor } from "$lib/components/admin/ui/rich-text-editor";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import { onMount } from "svelte";

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

  const translation = $derived(
    data.page.translations.find((t) => t.languageCode === "en") ??
    data.page.translations[0]
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

<svelte:head><title>Edit Content Page | Admin</title></svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a
        href="/admin/content-pages"
        class="text-gray-500 hover:text-gray-700"
        aria-label="Back to content pages"
      >
        <ChevronLeft class="h-5 w-5" />
      </a>
      <h1 class="text-2xl font-bold text-gray-900">Edit Content Page</h1>
    </div>
    {#if published && slug}
      <a
        href="/pages/{data.page.id}/{slug}"
        target="_blank"
        class="text-sm text-gray-500 hover:text-gray-700"
      >
        View on storefront &rarr;
      </a>
    {/if}
  </div>

  <form
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
    <div class="overflow-hidden rounded-lg bg-white shadow">
      <div class="p-6">
        <h2 class="mb-4 text-lg font-medium text-gray-900">Page Details</h2>

        <div class="space-y-4">
          <div>
            <label for="title" class="mb-1 block text-sm font-medium text-gray-700">
              Title <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              bind:value={title}
              required
              class="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm"
            />
          </div>

          <div>
            <label for="slug" class="mb-1 block text-sm font-medium text-gray-700">
              Slug <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="slug"
              name="slug"
              bind:value={slug}
              required
              class="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm"
            />
          </div>

          <div>
            <label for="body" class="mb-1 block text-sm font-medium text-gray-700">
              Body
            </label>
            <RichTextEditor
              name="body"
              content={translation?.body ?? ""}
              placeholder="Write page content..."
            />
          </div>

          <div class="flex items-center gap-2">
            <input
              type="checkbox"
              id="published"
              name="published"
              bind:checked={published}
              class="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <label for="published" class="text-sm font-medium text-gray-700">
              Published
            </label>
          </div>
        </div>

        <div class="mt-6 flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  </form>

  <!-- Delete -->
  <div class="overflow-hidden rounded-lg border border-red-200 bg-red-50">
    <div class="p-6">
      <h2 class="mb-2 text-lg font-medium text-red-900">Danger Zone</h2>
      <p class="mb-4 text-sm text-red-700">
        Deleting this page cannot be undone.
      </p>
      <form
        method="POST"
        action="?/delete"
        use:enhance={() => {
          return async ({ result, update }) => {
            await update();
          };
        }}
      >
        <Button
          type="submit"
          variant="destructive-outline"
          onclick={(e) => {
            if (!confirm("Are you sure you want to delete this page?")) {
              e.preventDefault();
            }
          }}
        >
          Delete Page
        </Button>
      </form>
    </div>
  </div>
</div>
