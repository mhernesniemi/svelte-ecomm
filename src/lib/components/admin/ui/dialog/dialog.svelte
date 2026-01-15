<script lang="ts">
	import { Dialog as DialogPrimitive } from "bits-ui";

	let { children, ...restProps }: DialogPrimitive.RootProps = $props();
</script>

<DialogPrimitive.Root {...restProps}>
	{@render children?.()}
</DialogPrimitive.Root>
