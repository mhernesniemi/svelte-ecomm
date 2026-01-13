<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function getProductName(product: (typeof data.featuredProducts)[0]): string {
		return product.translations.find((t) => t.languageCode === 'en')?.name ?? 'Untitled';
	}

	function getProductSlug(product: (typeof data.featuredProducts)[0]): string {
		return product.translations.find((t) => t.languageCode === 'en')?.slug ?? '';
	}

	function getLowestPrice(product: (typeof data.featuredProducts)[0]): number | null {
		if (product.variants.length === 0) return null;
		return Math.min(...product.variants.map((v) => v.price));
	}
</script>

<div>
	<!-- Hero Section -->
	<section class="bg-gray-900 text-white py-20">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
			<h1 class="text-4xl md:text-5xl font-bold mb-4">Opinionated Commerce with TypeScript</h1>
			<p class="text-xl text-gray-300 mb-8">
				A lightweight, type-safe ecommerce platform built with SvelteKit and Drizzle
			</p>
			<a
				href="/products"
				class="inline-block bg-white text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
			>
				Browse Products
			</a>
		</div>
	</section>

	<!-- Featured Products -->
	<section class="py-16">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<h2 class="text-2xl font-bold mb-8">Featured Products</h2>

			{#if data.featuredProducts.length === 0}
				<div class="text-center py-12 text-gray-500">
					<p>No products yet.</p>
					<a href="/admin/products/new" class="text-blue-600 hover:underline">
						Add your first product
					</a>
				</div>
			{:else}
				<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
					{#each data.featuredProducts as product}
						<a
							href="/products/{getProductSlug(product)}"
							class="group bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
						>
							<div class="aspect-square bg-gray-100 relative">
								{#if product.featuredAsset}
									<img
										src={product.featuredAsset.preview ?? product.featuredAsset.source}
										alt={getProductName(product)}
										class="w-full h-full object-cover"
									/>
								{:else}
									<div class="w-full h-full flex items-center justify-center text-gray-400">
										<svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
							<div class="p-4">
								<h3 class="font-medium group-hover:text-blue-600 transition-colors">
									{getProductName(product)}
								</h3>
								{#if getLowestPrice(product) !== null}
									<p class="text-gray-600 mt-1">
										From {(getLowestPrice(product)! / 100).toFixed(2)} EUR
									</p>
								{/if}
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</section>
</div>
