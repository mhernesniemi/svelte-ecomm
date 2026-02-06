<script lang="ts">
  import { enhance } from "$app/forms";
  import { toast } from "svelte-sonner";
  import { Button, buttonVariants } from "$lib/components/admin/ui/button";
  import { RichTextEditor } from "$lib/components/admin/ui/rich-text-editor";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";

  let { form } = $props();

  $effect(() => {
    if (form?.error) toast.error(form.error);
  });

  let isSubmitting = $state(false);

  let title = $state("");
  let slug = $state("");
  let body = $state("");

  $effect(() => {
    if (form?.title) title = form.title;
    if (form?.slug) slug = form.slug;
    if (form?.body) body = form.body;
  });

  import { slugify } from "$lib/utils";

  let autoSlug = $state(true);
  $effect(() => {
    if (autoSlug && title) {
      slug = slugify(title);
    }
  });
</script>

<svelte:head><title>New Content Page | Admin</title></svelte:head>

<div class="space-y-6">
  <div class="flex items-center gap-4">
    <a
      href="/admin/content-pages"
      class="text-gray-500 hover:text-gray-700"
      aria-label="Back to content pages"
    >
      <ChevronLeft class="h-5 w-5" />
    </a>
    <h1 class="text-2xl font-bold text-gray-900">Create Content Page</h1>
  </div>

  <form
    method="POST"
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
              oninput={() => (autoSlug = false)}
              required
              class="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm"
            />
          </div>

          <div>
            <label for="body" class="mb-1 block text-sm font-medium text-gray-700"> Body </label>
            <RichTextEditor
              name="body"
              content={body}
              placeholder="Write page content..."
              onchange={(html) => (body = html)}
            />
          </div>

          <div class="flex items-center gap-2">
            <input
              type="checkbox"
              id="published"
              name="published"
              checked
              class="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <label for="published" class="text-sm font-medium text-gray-700"> Published </label>
          </div>
        </div>
      </div>
    </div>

    <div class="flex justify-end gap-3">
      <a href="/admin/content-pages" class={buttonVariants({ variant: "outline" })}> Cancel </a>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Page"}
      </Button>
    </div>
  </form>
</div>
