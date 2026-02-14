<script lang="ts">
  import { cn } from "$lib/utils.js";
  import type { HTMLSelectAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  let {
    class: className,
    children,
    value = $bindable(),
    ...restProps
  }: HTMLSelectAttributes & { children?: Snippet } = $props();
</script>

<select
  class={cn(
    "w-full rounded-lg border border-input-border bg-surface px-3 py-2 text-sm text-foreground hover:border-foreground/20 disabled:cursor-not-allowed disabled:opacity-50",
    className
  )}
  bind:value
  {...restProps}
>
  {#if children}
    {@render children()}
  {/if}
</select>
