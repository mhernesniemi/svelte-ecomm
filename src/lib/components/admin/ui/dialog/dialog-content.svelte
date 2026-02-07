<script lang="ts">
  import { cn } from "$lib/utils.js";
  import { Dialog as DialogPrimitive } from "bits-ui";
  import DialogOverlay from "./dialog-overlay.svelte";

  let {
    class: className,
    children,
    ...restProps
  }: DialogPrimitive.ContentProps & { children?: import("svelte").Snippet } = $props();
</script>

<DialogPrimitive.Portal>
  <DialogOverlay />
  <DialogPrimitive.Content
    class={cn(
      "fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg bg-surface p-6 font-sans text-foreground shadow-xl",
      className
    )}
    {...restProps}
  >
    {@render children?.()}
  </DialogPrimitive.Content>
</DialogPrimitive.Portal>
