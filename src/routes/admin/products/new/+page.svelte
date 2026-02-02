<script lang="ts">
  import { enhance } from "$app/forms";
  import { toast } from "svelte-sonner";
  import { Button, buttonVariants } from "$lib/components/admin/ui/button";
  import { RichTextEditor } from "$lib/components/admin/ui/rich-text-editor";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  // Show toast notifications based on form results
  $effect(() => {
    if (form?.error) toast.error(form.error);
  });

  let activeTab = $state<"en" | "fi">("en");

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  let nameEn = $state("");
  let slugEn = $state("");
  let autoSlugEn = $state(true);

  // Initialize from form values if present (after form submission with errors)
  $effect(() => {
    if (form?.values?.nameEn) nameEn = form.values.nameEn;
    if (form?.values?.slugEn) slugEn = form.values.slugEn;
  });

  $effect(() => {
    if (autoSlugEn && nameEn) {
      slugEn = generateSlug(nameEn);
    }
  });
</script>

<svelte:head><title>New Product | Admin</title></svelte:head>

<div>
  <div class="mb-8">
    <a href="/admin/products" class="text-sm text-blue-600 hover:underline"
      >&larr; Back to Products</a
    >
    <h1 class="mt-2 text-2xl font-bold">Create Product</h1>
  </div>

  <form
    method="POST"
    use:enhance={() => {
      return async ({ update }) => {
        await update({ reset: false });
      };
    }}
    class="rounded-lg bg-white shadow"
  >
    <!-- Language Tabs -->
    <div class="border-b border-gray-200">
      <div class="flex">
        <button
          type="button"
          onclick={() => (activeTab = "en")}
          class="px-6 py-3 text-sm font-medium {activeTab === 'en'
            ? 'border-b-2 border-blue-500 text-blue-600'
            : 'text-gray-500 hover:text-gray-700'}"
        >
          English
        </button>
        <button
          type="button"
          onclick={() => (activeTab = "fi")}
          class="px-6 py-3 text-sm font-medium {activeTab === 'fi'
            ? 'border-b-2 border-blue-500 text-blue-600'
            : 'text-gray-500 hover:text-gray-700'}"
        >
          Finnish
        </button>
      </div>
    </div>

    <div class="space-y-6 p-6">
      <!-- English Fields -->
      <div class={activeTab === "en" ? "" : "hidden"}>
        <div class="space-y-4">
          <div>
            <label for="name_en" class="mb-1 block text-sm font-medium text-gray-700">
              Name <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name_en"
              name="name_en"
              bind:value={nameEn}
              required
              class="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label for="slug_en" class="mb-1 block text-sm font-medium text-gray-700">
              Slug <span class="text-red-500">*</span>
            </label>
            <div class="flex gap-2">
              <input
                type="text"
                id="slug_en"
                name="slug_en"
                bind:value={slugEn}
                required
                class="flex-1 rounded-lg border border-gray-300 px-3 py-2"
              />
              <label class="flex items-center gap-2 text-sm text-gray-500">
                <input type="checkbox" bind:checked={autoSlugEn} class="rounded border-gray-300" />
                Auto
              </label>
            </div>
          </div>

          <div>
            <label for="description_en" class="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <RichTextEditor
              name="description_en"
              content={form?.values?.descriptionEn ?? ""}
              placeholder="Write product description..."
            />
          </div>
        </div>
      </div>

      <!-- Finnish Fields -->
      <div class={activeTab === "fi" ? "" : "hidden"}>
        <div class="space-y-4">
          <div>
            <label for="name_fi" class="mb-1 block text-sm font-medium text-gray-700"> Name </label>
            <input
              type="text"
              id="name_fi"
              name="name_fi"
              value={form?.values?.nameFi ?? ""}
              class="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label for="slug_fi" class="mb-1 block text-sm font-medium text-gray-700"> Slug </label>
            <input
              type="text"
              id="slug_fi"
              name="slug_fi"
              value={form?.values?.slugFi ?? ""}
              class="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label for="description_fi" class="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <RichTextEditor
              name="description_fi"
              content={form?.values?.descriptionFi ?? ""}
              placeholder="Kirjoita tuotekuvaus..."
            />
          </div>
        </div>
      </div>

      <!-- Common Fields -->
      <div class="space-y-4 border-t border-gray-200 pt-6">
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

    <!-- Actions -->
    <div class="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
      <a href="/admin/products" class={buttonVariants({ variant: "outline" })}>
        Cancel
      </a>
      <Button type="submit">Create Product</Button>
    </div>
  </form>
</div>
