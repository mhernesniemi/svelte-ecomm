<script lang="ts">
	import { cn } from "$lib/utils.js";
	import { Dialog as DialogPrimitive } from "bits-ui";

	let {
		class: className,
		children,
		...restProps
	}: DialogPrimitive.TitleProps & { children?: import("svelte").Snippet } = $props();
</script>

<DialogPrimitive.Title
	class={cn("text-lg font-semibold leading-none tracking-tight", className)}
	{...restProps}
>
	{@render children?.()}
</DialogPrimitive.Title>
