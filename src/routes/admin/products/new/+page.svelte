<script lang="ts">
  import { enhance } from "$app/forms";
  import { toast } from "svelte-sonner";
  import { Button, buttonVariants } from "$lib/components/admin/ui/button";
  import { Checkbox } from "$lib/components/admin/ui/checkbox";
  import type { ActionData } from "./$types";

  import { slugify } from "$lib/utils";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";

  let { form }: { form: ActionData } = $props();

  // Show toast notifications based on form results
  $effect(() => {
    if (form?.error) toast.error(form.error);
  });

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
  <div class="mb-6 flex items-center justify-between">
    <a
      href="/admin/products"
      class="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
      ><ChevronLeft class="h-4 w-4" /> Back to Products</a
    >
  </div>
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold">Create Product</h1>
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
    class="rounded-lg bg-surface shadow"
  >
    <div class="grid grid-cols-2 gap-4 p-10">
      <div>
        <label for="name" class="mb-1 block text-sm font-medium text-foreground-secondary">
          Name <span class="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          bind:value={name}
          required
          autofocus
          class="w-full rounded-lg border border-input-border px-3 py-2"
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
            class="flex-1 rounded-lg border border-input-border px-3 py-2"
          />
          <label class="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox bind:checked={autoSlug} />
            Auto
          </label>
        </div>
      </div>
    </div>
  </form>
</div>
