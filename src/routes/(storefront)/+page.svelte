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
	<section class="bg-gray-100 py-20">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex items-center gap-14">
				<div>
					<h1 class="mb-4 text-4xl font-bold md:text-5xl">Opinionated Commerce</h1>
					<p class="mb-10 text-lg leading-[1.75] text-gray-600">
						A lightweight, ecommerce kit for <span class="font-semibold text-gray-900"
							>TypeScript</span
						>, <span class="font-semibold text-gray-900">SvelteKit</span> and
						<span class="font-semibold text-gray-900">Drizzle</span>, <br />
						that is truly <span class="font-semibold text-gray-900">100% customizable</span> and owned
						by you.
					</p>
					<div class="flex items-center gap-4">
						<img src="/kuvitus2.png" alt="Svelte" class="h-20 w-20" />
						<a
							href="/products"
							class="inline-block rounded-lg border bg-white px-8 py-3 font-semibold text-gray-900 transition-colors hover:bg-gray-100"
						>
							Get Started: Docs
						</a>
					</div>
				</div>
				<div class="max-w-[300px]">
					<img
						src="/kuvitus.png"
						alt="Opinionated Commerce"
						class="floating h-full w-full object-cover"
					/>
				</div>
			</div>
		</div>
	</section>

	<!-- Featured Products -->
	<section class="py-16">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<h2 class="mb-8 text-xl font-bold">Demo Store Products</h2>

			{#if data.featuredProducts.length === 0}
				<div class="py-12 text-center text-gray-500">
					<p>No products yet.</p>
					<a href="/admin/products/new" class="text-blue-600 hover:underline">
						Add your first product
					</a>
				</div>
			{:else}
				<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
					{#each data.featuredProducts as product}
						<a
							href="/products/{getProductSlug(product)}"
							class="group overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-lg"
						>
							<div class="relative aspect-square bg-gray-100">
								{#if product.featuredAsset}
									<img
										src={product.featuredAsset.preview ?? product.featuredAsset.source}
										alt={getProductName(product)}
										class="h-full w-full object-cover"
									/>
								{:else}
									<div class="flex h-full w-full items-center justify-center text-gray-400">
										<svg class="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
								<h3 class="font-medium transition-colors group-hover:text-blue-600">
									{getProductName(product)}
								</h3>
								{#if getLowestPrice(product) !== null}
									<p class="mt-1 text-gray-600">
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

<style>
	@keyframes float {
		0%,
		100% {
			transform: translateY(0px);
		}
		50% {
			transform: translateY(-20px);
		}
	}

	.floating {
		animation: float 9s ease-in-out infinite;
	}
</style>
