<script lang="ts">
  import { enhance } from "$app/forms";
  import { toast } from "svelte-sonner";
  import { Button, buttonVariants } from "$lib/components/admin/ui/button";
  import UnsavedChangesDialog from "$lib/components/admin/UnsavedChangesDialog.svelte";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import type { ActionData } from "./$types";

  let { form }: { form: ActionData } = $props();

  $effect(() => {
    if (form?.error) toast.error(form.error);
  });

  let isSubmitting = $state(false);
  let name = $state("");

  const hasUnsavedChanges = $derived(name !== "");

  $effect(() => {
    if (form?.values?.name) name = form.values.name;
  });
</script>

<svelte:head><title>New Customer Group | Admin</title></svelte:head>

<div class="space-y-6">
  <div class="mb-6 flex items-center justify-between">
    <a
      href="/admin/customers?tab=groups"
      class="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
      ><ChevronLeft class="h-4 w-4" /> Back to Customer Groups</a
    >
  </div>
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold">Create Customer Group</h1>
    <div class="flex items-center gap-3">
      <a href="/admin/customers?tab=groups" class={buttonVariants({ variant: "outline" })}>
        Cancel
      </a>
      <Button type="submit" form="create-group-form" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Group"}
      </Button>
    </div>
  </div>

  <form
    id="create-group-form"
    method="POST"
    use:enhance={() => {
      isSubmitting = true;
      return async ({ update }) => {
        await update({ reset: false });
        isSubmitting = false;
      };
    }}
    class="rounded-lg bg-surface shadow"
  >
    <div class="p-10">
      <div class="max-w-md">
        <label for="name" class="mb-1 block text-sm font-medium text-foreground-secondary">
          Name <span class="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          bind:value={name}
          required
          placeholder="e.g., Wholesale"
          class="w-full rounded-lg border border-input-border px-3 py-2"
        />
      </div>
    </div>
  </form>
</div>

<UnsavedChangesDialog isDirty={() => hasUnsavedChanges} isSaving={() => isSubmitting} />
