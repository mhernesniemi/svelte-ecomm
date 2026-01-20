<script lang="ts">
  import { cn } from "$lib/utils.js";
  import type { HTMLAttributes } from "svelte/elements";

  let {
    class: className,
    children,
    ...restProps
  }: HTMLAttributes<HTMLHeadingElement> & { children?: import("svelte").Snippet } = $props();
</script>

<h3 class={cn("text-lg leading-none font-semibold tracking-tight", className)} {...restProps}>
  {@render children?.()}
</h3>
