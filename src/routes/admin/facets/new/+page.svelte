<script lang="ts">
  import { enhance } from "$app/forms";
  import { Button, buttonVariants } from "$lib/components/admin/ui/button";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import { toast } from "svelte-sonner";
  import type { ActionData } from "./$types";

  let { form }: { form: ActionData } = $props();

  $effect(() => {
    if (form?.error) toast.error(form.error);
  });

  let isSubmitting = $state(false);
</script>

<svelte:head><title>New Facet | Admin</title></svelte:head>

<div class="space-y-6">
  <div class="mb-6 flex items-center justify-between">
    <a
      href="/admin/facets"
      class="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
      ><ChevronLeft class="h-4 w-4" /> Back to Facets</a
    >
  </div>
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold">New Facet</h1>
    <div class="flex items-center gap-3">
      <a href="/admin/facets" class={buttonVariants({ variant: "outline" })}>Cancel</a>
      <Button type="submit" form="create-form" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Facet"}
      </Button>
    </div>
  </div>

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
    class="overflow-hidden rounded-lg bg-surface shadow"
  >
    <div class="p-6">
      <h2 class="mb-4 text-lg font-medium text-foreground">Facet Details</h2>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label for="facet_name" class="mb-1 block text-sm font-medium text-foreground-secondary"
            >Name</label
          >
          <input
            type="text"
            id="facet_name"
            name="name_en"
            placeholder="e.g., Color"
            required
            autofocus
            class="w-full rounded-lg border border-input-border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label for="facet_code" class="mb-1 block text-sm font-medium text-foreground-secondary"
            >Code</label
          >
          <input
            type="text"
            id="facet_code"
            name="code"
            placeholder="e.g., color"
            required
            class="w-full rounded-lg border border-input-border px-3 py-2 text-sm"
          />
        </div>
      </div>
    </div>
  </form>
</div>
