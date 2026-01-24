<script lang="ts">
  import { Toaster as SonnerToaster, type ToasterProps } from "svelte-sonner";

  let { ...props }: ToasterProps = $props();
</script>

<SonnerToaster
  class="toaster group"
  toastOptions={{
    classes: {
      toast:
        "group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-950 group-[.toaster]:border-gray-200 group-[.toaster]:shadow-lg",
      description: "group-[.toast]:text-gray-500",
      actionButton: "group-[.toast]:bg-gray-900 group-[.toast]:text-gray-50",
      cancelButton: "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-500",
      error: "group-[.toaster]:bg-red-50 group-[.toaster]:text-red-600 group-[.toaster]:border-red-200",
      success: "group-[.toaster]:bg-green-50 group-[.toaster]:text-green-600 group-[.toaster]:border-green-200"
    }
  }}
  {...props}
/>
