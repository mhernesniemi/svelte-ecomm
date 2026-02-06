<script lang="ts">
  import type { ProductWithRelations } from "$lib/types";
  import { formatPrice } from "$lib/utils";
  import ImageIcon from "@lucide/svelte/icons/image";

  let { product }: { product: ProductWithRelations } = $props();

  const translation = $derived(
    product.translations.find((t) => t.languageCode === "en")
  );
  const name = $derived(translation?.name ?? "Untitled");
  const slug = $derived(translation?.slug ?? "");
  const lowestPrice = $derived(
    product.variants.length > 0
      ? Math.min(...product.variants.map((v) => v.price))
      : null
  );
</script>

<a
  href="/products/{product.id}/{slug}"
  class="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
>
  <div
    class="aspect-square overflow-hidden bg-gray-100"
    style="view-transition-name: product-image-{product.id}"
  >
    {#if product.featuredAsset}
      <img
        src="{product.featuredAsset.source}?tr=w-400,h-400,fo-auto"
        alt={name}
        class="h-full w-full object-cover transition-transform group-hover:scale-105"
      />
    {:else}
      <div class="flex h-full w-full items-center justify-center text-gray-400">
        <ImageIcon class="h-16 w-16" />
      </div>
    {/if}
  </div>
  <div class="p-4">
    <h3 class="text-sm font-medium text-gray-900 group-hover:text-blue-600">
      {name}
    </h3>
    {#if lowestPrice !== null}
      <p class="mt-1 text-sm text-gray-700">
        From {formatPrice(lowestPrice)}
      </p>
    {/if}
  </div>
</a>
