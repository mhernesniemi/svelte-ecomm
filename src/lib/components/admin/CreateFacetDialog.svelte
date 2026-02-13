<script lang="ts">
  import { enhance } from "$app/forms";
  import { Button } from "$lib/components/admin/ui/button";
  import * as Dialog from "$lib/components/admin/ui/dialog";
  import { slugify } from "$lib/utils";

  let {
    open = $bindable(false)
  }: {
    open: boolean;
  } = $props();

  let name = $state("");
  const code = $derived(slugify(name));

  function reset() {
    name = "";
  }

  $effect(() => {
    if (open) reset();
  });
</script>

<Dialog.Root bind:open>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>New Facet</Dialog.Title>
      <Dialog.Description>Create a new facet. You'll be redirected to edit its details.</Dialog.Description>
    </Dialog.Header>
    <form
      method="POST"
      action="/admin/facets?/create"
      use:enhance={() => {
        return async ({ update }) => {
          open = false;
          await update();
        };
      }}
    >
      <input type="hidden" name="code" value={code} />
      <div class="my-4">
        <label for="create_facet_name" class="mb-1 block text-sm font-medium text-foreground-secondary">
          Name
        </label>
        <input
          type="text"
          id="create_facet_name"
          name="name_en"
          bind:value={name}
          required
          placeholder="e.g., Color"
          class="w-full rounded-lg border border-input-border px-3 py-2 text-sm"
        />
      </div>
      <Dialog.Footer>
        <Button type="button" variant="outline" onclick={() => (open = false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={!name.trim()}>Create</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
