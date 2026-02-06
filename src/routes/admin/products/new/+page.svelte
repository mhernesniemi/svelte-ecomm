<script lang="ts">
  import { enhance } from "$app/forms";
  import { toast } from "svelte-sonner";
  import { Button, buttonVariants } from "$lib/components/admin/ui/button";
  import { RichTextEditor } from "$lib/components/admin/ui/rich-text-editor";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  // Show toast notifications based on form results
  $effect(() => {
    if (form?.error) toast.error(form.error);
  });

  import { slugify } from "$lib/utils";

  let name = $state("");
  let slug = $state("");
  let autoSlug = $state(true);

  // Initialize from form values if present (after form submission with errors)
  $effect(() => {
    if (form?.values?.name) name = form.values.name;
    if (form?.values?.slug) slug = form.values.slug;
  });

  $effect(() => {
    if (autoSlug && name) {
      slug = slugify(name);
    }
  });
</script>

<svelte:head><title>New Product | Admin</title></svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a
        href="/admin/products"
        class="text-gray-500 hover:text-gray-700"
        aria-label="Back to products"
      >
        <ChevronLeft class="h-5 w-5" />
      </a>
      <h1 class="text-2xl font-bold text-gray-900">Create Product</h1>
    </div>
    <div class="flex items-center gap-3">
      <a href="/admin/products" class={buttonVariants({ variant: "outline" })}>Cancel</a>
      <Button type="submit" form="create-product-form">Create Product</Button>
    </div>
  </div>

  <form
    id="create-product-form"
    method="POST"
    use:enhance={() => {
      return async ({ update }) => {
        await update({ reset: false });
      };
    }}
    class="rounded-lg bg-white shadow"
  >
    <div class="space-y-6 p-6">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
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
              class="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label for="slug" class="mb-1 block text-sm font-medium text-gray-700">
              Slug <span class="text-red-500">*</span>
            </label>
            <div class="flex gap-2">
              <input
                type="text"
                id="slug"
                name="slug"
                bind:value={slug}
                required
                class="flex-1 rounded-lg border border-gray-300 px-3 py-2"
              />
              <label class="flex items-center gap-2 text-sm text-gray-500">
                <input type="checkbox" bind:checked={autoSlug} class="rounded border-gray-300" />
                Auto
              </label>
            </div>
          </div>
        </div>

        <div>
          <label for="description" class="mb-1 block text-sm font-medium text-gray-700">
            Description
          </label>
          <RichTextEditor
            name="description"
            content={form?.values?.description ?? ""}
            placeholder="Write product description..."
          />
        </div>
      </div>

      <!-- Common Fields -->
      <div class="grid grid-cols-2 gap-4 space-y-4 border-t border-gray-200 pt-6">
        <label class="block">
          <span class="text-sm font-medium text-gray-700">Product Type</span>
          <select name="type" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
            <option value="physical" selected={form?.values?.type !== "digital"}>
              Physical - Requires shipping
            </option>
            <option value="digital" selected={form?.values?.type === "digital"}>
              Digital - Delivered via email
            </option>
          </select>
        </label>

        <label class="block">
          <span class="text-sm font-medium text-gray-700">Visibility</span>
          <select name="visibility" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
            <option
              value="public"
              selected={form?.values?.visibility !== "private" &&
                form?.values?.visibility !== "hidden"}
            >
              Public - Visible to everyone
            </option>
            <option value="private" selected={form?.values?.visibility === "private"}>
              Private - B2B customers only
            </option>
            <option value="hidden" selected={form?.values?.visibility === "hidden"}>
              Hidden - Not visible
            </option>
          </select>
        </label>
      </div>
    </div>
  </form>
</div>
