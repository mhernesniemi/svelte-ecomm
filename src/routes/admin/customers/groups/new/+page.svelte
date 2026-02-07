<script lang="ts">
  import { enhance } from "$app/forms";
  import { toast } from "svelte-sonner";
  import { Button, buttonVariants } from "$lib/components/admin/ui/button";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import type { ActionData } from "./$types";

  let { form }: { form: ActionData } = $props();

  $effect(() => {
    if (form?.error) toast.error(form.error);
  });

  let name = $state("");

  $effect(() => {
    if (form?.values?.name) name = form.values.name;
  });
</script>

<svelte:head><title>New Customer Group | Admin</title></svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a
        href="/admin/customers?tab=groups"
        class="text-muted-foreground hover:text-foreground-secondary"
        aria-label="Back to customer groups"
      >
        <ChevronLeft class="h-5 w-5" />
      </a>
      <h1 class="text-2xl font-bold text-foreground">Create Customer Group</h1>
    </div>
    <div class="flex items-center gap-3">
      <a href="/admin/customers?tab=groups" class={buttonVariants({ variant: "outline" })}>
        Cancel
      </a>
      <Button type="submit" form="create-group-form">Create Group</Button>
    </div>
  </div>

  <form
    id="create-group-form"
    method="POST"
    use:enhance={() => {
      return async ({ update }) => {
        await update({ reset: false });
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
