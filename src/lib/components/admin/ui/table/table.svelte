<script lang="ts">
  import type { HTMLTableAttributes } from "svelte/elements";
  import { cn, type WithElementRef } from "$lib/utils.js";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLTableAttributes> = $props();
</script>

<div
  data-slot="table-container"
  class={cn("overflow-hidden rounded-lg border border-gray-200 bg-white shadow", className)}
>
  <table
    bind:this={ref}
    data-slot="table"
    class="min-w-full divide-y divide-gray-200"
    {...restProps}
  >
    {@render children?.()}
  </table>
</div>
