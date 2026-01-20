<script lang="ts">
  import { cn } from "$lib/utils.js";
  import type { HTMLAttributes } from "svelte/elements";

  let {
    class: className,
    children,
    ...restProps
  }: HTMLAttributes<HTMLParagraphElement> & { children?: import("svelte").Snippet } = $props();
</script>

<p class={cn("text-sm text-gray-500", className)} {...restProps}>
  {@render children?.()}
</p>
