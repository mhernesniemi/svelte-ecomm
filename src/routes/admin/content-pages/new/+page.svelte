<script lang="ts">
  import { enhance } from "$app/forms";
  import { toast } from "svelte-sonner";
  import { Button, buttonVariants } from "$lib/components/admin/ui/button";
  import { Checkbox } from "$lib/components/admin/ui/checkbox";
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
  let published = $state(true);
  $effect(() => {
    if (autoSlug && title) {
      slug = slugify(title);
    }
  });
</script>

<svelte:head><title>New Content Page | Admin</title></svelte:head>

<div class="space-y-6">
  <div class="mb-6 flex items-center justify-between">
    <a
      href="/admin/content-pages"
      class="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
      ><ChevronLeft class="h-4 w-4" /> Back to Pages</a
    >
  </div>
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold">Create Content Page</h1>
    <div class="flex items-center gap-3">
      <a href="/admin/content-pages" class={buttonVariants({ variant: "outline" })}>Cancel</a>
      <Button type="submit" form="create-content-page-form" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Page"}
      </Button>
    </div>
  </div>

  <form
    id="create-content-page-form"
    method="POST"
    use:enhance={() => {
      isSubmitting = true;
      return async ({ update }) => {
        await update({ reset: false });
        isSubmitting = false;
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
              <div class="flex gap-2">
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  bind:value={slug}
                  required
                  class="flex-1 rounded-lg border border-input-border px-3 py-2 shadow-sm"
                />
                <label class="flex items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox bind:checked={autoSlug} />
                  Auto
                </label>
              </div>
            </div>
          </div>

          <div>
            <label for="body" class="mb-1 block text-sm font-medium text-foreground-secondary">
              Body
            </label>
            <RichTextEditor
              name="body"
              content={body}
              placeholder="Write page content..."
              onchange={(html) => (body = html)}
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
</div>
