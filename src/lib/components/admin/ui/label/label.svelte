<script lang="ts">
  import { cn } from "$lib/utils.js";
  import type { HTMLLabelAttributes } from "svelte/elements";

  let {
    class: className,
    children,
    ...restProps
  }: HTMLLabelAttributes & { children?: import("svelte").Snippet } = $props();
</script>

<label
  class={cn(
    "mb-1 block text-sm font-medium text-foreground-secondary peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
    className
  )}
  {...restProps}
>
  {@render children?.()}
</label>
