<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const product = $derived(data.product);
	const enTrans = $derived(product.translations.find((t) => t.languageCode === 'en'));

	let selectedVariantId = $state<number | null>(null);
	let quantity = $state(1);

	// Initialize selected variant when product loads
	$effect(() => {
		if (product.variants[0] && selectedVariantId === null) {
			selectedVariantId = product.variants[0].id;
		}
	});

	const selectedVariant = $derived(
		product.variants.find((v) => v.id === selectedVariantId)
	);

	function getVariantName(variant: (typeof product.variants)[0]): string {
		const trans = variant.translations.find((t) => t.languageCode === 'en');
		return trans?.name ?? variant.sku;
	}

	async function addToCart() {
		if (!selectedVariantId) return;

		// For now, just show an alert - in a full implementation, this would
		// add to a cart stored in cookies/session or call a server action
		alert(`Added ${quantity} x ${selectedVariant?.sku} to cart`);
	}
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<nav class="mb-6">
		<a href="/products" class="text-blue-600 hover:underline text-sm">&larr; Back to Products</a>
	</nav>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
		<!-- Product Image -->
		<div class="aspect-square bg-gray-100 rounded-lg overflow-hidden">
			{#if product.featuredAsset}
				<img
					src={product.featuredAsset.preview ?? product.featuredAsset.source}
					alt={enTrans?.name}
					class="w-full h-full object-cover"
				/>
			{:else}
				<div class="w-full h-full flex items-center justify-center text-gray-400">
					<svg class="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
				</div>
			{/if}
		</div>

		<!-- Product Info -->
		<div>
			<h1 class="text-3xl font-bold mb-4">{enTrans?.name ?? 'Product'}</h1>

			{#if enTrans?.description}
				<p class="text-gray-600 mb-6">{enTrans.description}</p>
			{/if}

			{#if selectedVariant}
				<p class="text-2xl font-bold mb-6">
					{(selectedVariant.price / 100).toFixed(2)} EUR
				</p>
			{/if}

			<!-- Variant Selection -->
			{#if product.variants.length > 1}
				<div class="mb-6">
					<p class="block text-sm font-medium text-gray-700 mb-2">Select Variant</p>
					<div class="flex flex-wrap gap-2" role="group" aria-label="Product variants">
						{#each product.variants as variant}
							<button
								type="button"
								onclick={() => (selectedVariantId = variant.id)}
								class="px-4 py-2 border rounded-lg transition-colors {selectedVariantId ===
								variant.id
									? 'border-blue-600 bg-blue-50 text-blue-600'
									: 'border-gray-300 hover:border-gray-400'}"
							>
								{getVariantName(variant)}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Stock Status -->
			{#if selectedVariant}
				<div class="mb-6">
					{#if selectedVariant.stock > 0}
						<span class="text-green-600 text-sm">In stock ({selectedVariant.stock} available)</span>
					{:else}
						<span class="text-red-600 text-sm">Out of stock</span>
					{/if}
				</div>
			{/if}

			<!-- Quantity & Add to Cart -->
			{#if selectedVariant && selectedVariant.stock > 0}
				<div class="flex items-center gap-4 mb-6">
					<div class="flex items-center border rounded-lg">
						<button
							type="button"
							onclick={() => quantity > 1 && (quantity -= 1)}
							class="px-3 py-2 hover:bg-gray-50"
						>
							-
						</button>
						<span class="px-4 py-2 border-x">{quantity}</span>
						<button
							type="button"
							onclick={() => quantity < selectedVariant.stock && (quantity += 1)}
							class="px-3 py-2 hover:bg-gray-50"
						>
							+
						</button>
					</div>

					<button
						type="button"
						onclick={addToCart}
						class="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
					>
						Add to Cart
					</button>
				</div>
			{/if}

			<!-- Facet Values / Tags -->
			{#if product.facetValues.length > 0}
				<div class="border-t pt-6">
					<h3 class="text-sm font-medium text-gray-700 mb-2">Details</h3>
					<div class="flex flex-wrap gap-2">
						{#each product.facetValues as fv}
							{@const name = fv.translations.find((t) => t.languageCode === 'en')?.name ?? fv.code}
							<span class="px-3 py-1 bg-gray-100 rounded-full text-sm">{name}</span>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
