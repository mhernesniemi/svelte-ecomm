<script lang="ts" module>
  import { tv, type VariantProps } from "tailwind-variants";

  export const alertVariants = tv({
    base: "relative w-full rounded-lg border p-4 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg~*]:pl-7",
    variants: {
      variant: {
        default: "border-border bg-background text-foreground-secondary",
        success:
          "border-green-200 bg-green-50 text-green-700 dark:border-green-500/25 dark:bg-green-500/10 dark:text-green-300",
        warning:
          "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-500/25 dark:bg-yellow-500/10 dark:text-yellow-300",
        destructive:
          "border-red-200 bg-destructive-subtle text-red-700 dark:border-red-500/25 dark:text-red-300",
        info: "border-blue-200 bg-accent-subtle text-blue-700 dark:border-blue-500/25 dark:text-blue-300"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  });

  export type AlertVariant = VariantProps<typeof alertVariants>["variant"];
</script>

<script lang="ts">
  import { cn } from "$lib/utils.js";
  import type { HTMLAttributes } from "svelte/elements";

  let {
    class: className,
    variant = "default",
    children,
    ...restProps
  }: HTMLAttributes<HTMLDivElement> & {
    variant?: AlertVariant;
    children?: import("svelte").Snippet;
  } = $props();
</script>

<div role="alert" class={cn(alertVariants({ variant }), className)} {...restProps}>
  {@render children?.()}
</div>
