<script lang="ts">
	import { cn } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		class: className,
		children,
		...restProps
	}: HTMLAttributes<HTMLHeadingElement> & { children?: import("svelte").Snippet } = $props();
</script>

<h5 class={cn("mb-1 font-medium leading-none tracking-tight", className)} {...restProps}>
	{@render children?.()}
</h5>
