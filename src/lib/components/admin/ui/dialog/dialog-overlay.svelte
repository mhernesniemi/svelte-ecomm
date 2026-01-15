<script lang="ts">
	import { cn } from "$lib/utils.js";
	import { Dialog as DialogPrimitive } from "bits-ui";

	let { class: className, ...restProps }: DialogPrimitive.OverlayProps = $props();
</script>

<DialogPrimitive.Overlay
	class={cn("fixed inset-0 z-50 bg-black/50", className)}
	{...restProps}
/>
