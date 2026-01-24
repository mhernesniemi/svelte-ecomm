<script lang="ts">
  import { enhance } from "$app/forms";
  import { toast } from "svelte-sonner";
  import { Button, buttonVariants } from "$lib/components/admin/ui/button";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import Info from "@lucide/svelte/icons/info";

  let { data, form } = $props();

  // Show toast notifications based on form results
  $effect(() => {
    if (form?.error) toast.error(form.error);
  });

  let activeTab = $state<"en" | "fi">("en");
  let isSubmitting = $state(false);

  // Form values
  let code = $state(form?.code ?? "");
  let nameEn = $state(form?.nameEn ?? "");
  let nameFi = $state(form?.nameFi ?? "");
  let slugEn = $state(form?.slugEn ?? "");
  let slugFi = $state(form?.slugFi ?? "");
  let descriptionEn = $state(form?.descriptionEn ?? "");
  let descriptionFi = $state(form?.descriptionFi ?? "");

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  // Auto-generate slug from name
  $effect(() => {
    if (nameEn && !slugEn) {
      slugEn = slugify(nameEn);
    }
  });

  // Auto-generate code from name
  $effect(() => {
    if (nameEn && !code) {
      code = slugify(nameEn);
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

        <div class="mb-4">
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

        <div class="mb-4">
          <div class="flex border-b border-gray-200">
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium {activeTab === 'en'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'}"
              onclick={() => (activeTab = "en")}
            >
              English
            </button>
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium {activeTab === 'fi'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'}"
              onclick={() => (activeTab = "fi")}
            >
              Finnish
            </button>
          </div>
        </div>

        {#if activeTab === "en"}
          <div class="space-y-4">
            <div>
              <label for="name_en" class="mb-1 block text-sm font-medium text-gray-700">
                Name (EN) <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name_en"
                name="name_en"
                bind:value={nameEn}
                required
                class="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm"
              />
            </div>
            <div>
              <label for="slug_en" class="mb-1 block text-sm font-medium text-gray-700">
                Slug (EN) <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="slug_en"
                name="slug_en"
                bind:value={slugEn}
                required
                class="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm"
              />
            </div>
            <div>
              <label for="description_en" class="mb-1 block text-sm font-medium text-gray-700">
                Description (EN)
              </label>
              <textarea
                id="description_en"
                name="description_en"
                bind:value={descriptionEn}
                rows="3"
                class="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm"
              ></textarea>
            </div>
          </div>
        {:else}
          <div class="space-y-4">
            <div>
              <label for="name_fi" class="mb-1 block text-sm font-medium text-gray-700">
                Name (FI)
              </label>
              <input
                type="text"
                id="name_fi"
                name="name_fi"
                bind:value={nameFi}
                class="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm"
                placeholder="Leave empty to use English"
              />
            </div>
            <div>
              <label for="slug_fi" class="mb-1 block text-sm font-medium text-gray-700">
                Slug (FI)
              </label>
              <input
                type="text"
                id="slug_fi"
                name="slug_fi"
                bind:value={slugFi}
                class="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm"
                placeholder="Leave empty to use English"
              />
            </div>
            <div>
              <label for="description_fi" class="mb-1 block text-sm font-medium text-gray-700">
                Description (FI)
              </label>
              <textarea
                id="description_fi"
                name="description_fi"
                bind:value={descriptionFi}
                rows="3"
                class="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm"
                placeholder="Leave empty to use English"
              ></textarea>
            </div>
          </div>
        {/if}

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
