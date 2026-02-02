<script lang="ts">
  import { enhance } from "$app/forms";
  import { toast } from "svelte-sonner";
  import { Button, buttonVariants } from "$lib/components/admin/ui/button";
  import { RichTextEditor } from "$lib/components/admin/ui/rich-text-editor";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import Info from "@lucide/svelte/icons/info";

  let { data, form } = $props();

  // Show toast notifications based on form results
  $effect(() => {
    if (form?.error) toast.error(form.error);
  });

  let isSubmitting = $state(false);

  // Form values
  let code = $state("");
  let name = $state("");
  let slug = $state("");
  let description = $state("");

  // Restore values from form after failed submission
  $effect(() => {
    if (form?.code) code = form.code;
    if (form?.name) name = form.name;
    if (form?.slug) slug = form.slug;
    if (form?.description) description = form.description;
  });

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  // Auto-generate slug from name
  let autoSlug = $state(true);
  $effect(() => {
    if (autoSlug && name) {
      slug = slugify(name);
    }
  });

  // Auto-generate code from name
  let autoCode = $state(true);
  $effect(() => {
    if (autoCode && name) {
      code = slugify(name);
    }
  });
</script>

<svelte:head><title>New Collection | Admin</title></svelte:head>

<div class="space-y-6">
  <div class="flex items-center gap-4">
    <a
      href="/admin/collections"
      class="text-gray-500 hover:text-gray-700"
      aria-label="Back to collections"
    >
      <ChevronLeft class="h-5 w-5" />
    </a>
    <h1 class="text-2xl font-bold text-gray-900">Create Collection</h1>
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
        <h2 class="mb-4 text-lg font-medium text-gray-900">Basic Information</h2>

        <div class="space-y-4">
          <div>
            <label for="code" class="mb-1 block text-sm font-medium text-gray-700">
              Code <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="code"
              name="code"
              bind:value={code}
              required
              class="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm"
              placeholder="e.g., summer-sale"
            />
            <p class="mt-1 text-xs text-gray-500">Unique identifier for this collection</p>
          </div>

          <div>
            <label for="name" class="mb-1 block text-sm font-medium text-gray-700">
              Name <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              bind:value={name}
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
            <label for="description" class="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <RichTextEditor
              name="description"
              content={description}
              placeholder="Write collection description..."
              onchange={(html) => (description = html)}
            />
          </div>
        </div>

        <div class="mt-6 space-y-4">
          <div class="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              name="enabled"
              checked
              class="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <label for="enabled" class="text-sm font-medium text-gray-700">
              Collection is enabled
            </label>
          </div>

          <div class="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_private"
              name="is_private"
              class="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <label for="is_private" class="text-sm font-medium text-gray-700">
              Private collection (hidden from storefront)
            </label>
          </div>
        </div>
      </div>
    </div>

    <div class="rounded-lg bg-blue-50 p-4">
      <div class="flex items-start gap-3">
        <Info class="mt-0.5 h-5 w-5 text-blue-600" />
        <div>
          <h3 class="text-sm font-medium text-blue-800">Add filters after creation</h3>
          <p class="mt-1 text-sm text-blue-600">
            After creating the collection, you'll be able to add filters (facet values, price
            ranges, manual product selection) to define which products belong to this collection.
          </p>
        </div>
      </div>
    </div>

    <div class="flex justify-end gap-3">
      <a href="/admin/collections" class={buttonVariants({ variant: "outline" })}>
        Cancel
      </a>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Collection"}
      </Button>
    </div>
  </form>
</div>
