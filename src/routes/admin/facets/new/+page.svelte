<script lang="ts">
  import { enhance } from "$app/forms";
  import { Button, buttonVariants } from "$lib/components/admin/ui/button";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import type { ActionData } from "./$types";

  let { form }: { form: ActionData } = $props();

  let isSubmitting = $state(false);
</script>

<svelte:head><title>New Facet | Admin</title></svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a href="/admin/facets" class="text-gray-500 hover:text-gray-700" aria-label="Back to facets">
        <ChevronLeft class="h-5 w-5" />
      </a>
      <h1 class="text-2xl font-bold text-gray-900">New Facet</h1>
    </div>
    <div class="flex items-center gap-3">
      <a href="/admin/facets" class={buttonVariants({ variant: "outline" })}>Cancel</a>
      <Button type="submit" form="create-form" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Facet"}
      </Button>
    </div>
  </div>

  {#if form?.error}
    <div class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {form.error}
    </div>
  {/if}

  <!-- Facet Details -->
  <form
    method="POST"
    use:enhance={() => {
      isSubmitting = true;
      return async ({ update }) => {
        isSubmitting = false;
        await update({ reset: false });
      };
    }}
    id="create-form"
    class="overflow-hidden rounded-lg bg-white shadow"
  >
    <div class="p-6">
      <h2 class="mb-4 text-lg font-medium text-gray-900">Facet Details</h2>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label for="facet_name" class="mb-1 block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            id="facet_name"
            name="name_en"
            placeholder="e.g., Color"
            required
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label for="facet_code" class="mb-1 block text-sm font-medium text-gray-700">Code</label>
          <input
            type="text"
            id="facet_code"
            name="code"
            placeholder="e.g., color"
            required
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
    </div>
  </form>
</div>
