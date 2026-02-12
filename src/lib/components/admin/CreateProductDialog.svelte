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
  const slug = $derived(slugify(name));

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
      <Dialog.Title>New Product</Dialog.Title>
      <Dialog.Description>Create a new product. You'll be redirected to edit its details.</Dialog.Description>
    </Dialog.Header>
    <form
      method="POST"
      action="/admin/products?/create"
      use:enhance={() => {
        return async ({ update }) => {
          open = false;
          await update();
        };
      }}
    >
      <input type="hidden" name="slug" value={slug} />
      <div class="my-4">
        <label for="create_product_name" class="mb-1 block text-sm font-medium text-foreground-secondary">
          Name
        </label>
        <input
          type="text"
          id="create_product_name"
          name="name"
          bind:value={name}
          required
          placeholder="e.g., Winter Jacket"
          class="w-full rounded-lg border border-input-border px-3 py-2 text-sm"
        />
      </div>
      <Dialog.Footer>
        <Button type="button" variant="outline" onclick={() => (open = false)}>
          Cancel
        </Button>
        <Button type="submit">Create</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
