<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "$lib/utils";

  let {
    title,
    description,
    variant = "main",
    noPadding = false,
    headerActions,
    headerExtra,
    children
  }: {
    title: string;
    description?: string;
    variant?: "main" | "sidebar";
    noPadding?: boolean;
    headerActions?: Snippet;
    headerExtra?: Snippet;
    children: Snippet;
  } = $props();
</script>

<div class={cn("rounded-lg bg-surface shadow", variant === "main" && "overflow-hidden")}>
  <div class={cn("border-b border-border", variant === "main" ? "px-6 py-4" : "px-4 py-3")}>
    {#if headerActions}
      <div class="flex items-center justify-between">
        <h2 class={variant === "main" ? "text-lg font-semibold" : "font-semibold"}>{title}</h2>
        {@render headerActions()}
      </div>
    {:else}
      <h2 class={variant === "main" ? "text-lg font-semibold" : "font-semibold"}>{title}</h2>
    {/if}
    {#if description}
      <p class="mt-1 text-sm text-foreground-tertiary">{description}</p>
    {/if}
  </div>
  {#if headerExtra}
    {@render headerExtra()}
  {/if}
  {#if noPadding}
    {@render children()}
  {:else}
    <div class={variant === "main" ? "p-6" : "p-4"}>
      {@render children()}
    </div>
  {/if}
</div>
