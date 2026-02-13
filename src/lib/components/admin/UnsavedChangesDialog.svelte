<script lang="ts">
  import { Button } from "$lib/components/admin/ui/button";
  import * as Dialog from "$lib/components/admin/ui/dialog";

  let {
    open = $bindable(false),
    onconfirm,
    oncancel
  }: {
    open: boolean;
    onconfirm: () => void;
    oncancel: () => void;
  } = $props();
</script>

<Dialog.Root
  bind:open
  onOpenChange={(v) => {
    if (!v) oncancel();
  }}
>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Unsaved changes</Dialog.Title>
      <Dialog.Description class="mb-4">
        You have unsaved changes. Are you sure you want to leave?
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button variant="outline" onclick={oncancel}>Stay on page</Button>
      <Button variant="destructive" onclick={onconfirm}>Leave page</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
