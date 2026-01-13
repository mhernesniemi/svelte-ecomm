<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Debounced } from 'runed';
	import { formatPrice } from '$lib/utils/money';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Debounced search input
	let searchInput = $state(data.search ?? '');
	const debouncedSearch = new Debounced(() => searchInput, 300);

	// Navigate when debounced search value changes
	$effect(() => {
		const searchValue = debouncedSearch.current;
		if (searchValue !== undefined && searchValue !== data.search) {
			const params = new URLSearchParams($page.url.searchParams);
			if (searchValue) {
				params.set('q', searchValue);
			} else {
				params.delete('q');
			}
			params.delete('page'); // Reset to page 1
			goto(`?${params.toString()}`, { replaceState: true, keepFocus: true });
		}
	});

	function getProductName(product: (typeof data.products)[0]): string {
		return product.translations.find((t) => t.languageCode === 'en')?.name ?? 'Untitled';
	}

	function getProductSlug(product: (typeof data.products)[0]): string {
		return product.translations.find((t) => t.languageCode === 'en')?.slug ?? '';
	}

	function getLowestPrice(product: (typeof data.products)[0]): number | null {
		if (product.variants.length === 0) return null;
		return Math.min(...product.variants.map((v) => v.price));
	}

	function getFacetName(facet: (typeof data.facets)[0]): string {
		return facet.translations.find((t) => t.languageCode === 'en')?.name ?? facet.code;
	}

	function isFilterActive(facetCode: string, valueCode: string): boolean {
		return data.activeFilters[facetCode]?.includes(valueCode) ?? false;
	}

	function getFilterUrl(facetCode: string, valueCode: string, add: boolean): string {
		const params = new URLSearchParams($page.url.searchParams);

		if (add) {
			params.append(`facet_${facetCode}`, valueCode);
		} else {
			const values = params.getAll(`facet_${facetCode}`).filter((v) => v !== valueCode);
			params.delete(`facet_${facetCode}`);
			values.forEach((v) => params.append(`facet_${facetCode}`, v));
		}

		params.delete('page');
		const paramString = params.toString();
		return paramString ? `?${paramString}` : '/products';
	}

	function clearAllFilters(): string {
		const params = new URLSearchParams();
		if (data.search) {
			params.set('q', data.search);
		}
		const paramString = params.toString();
		return paramString ? `?${paramString}` : '/products';
	}

	const hasActiveFilters = $derived(Object.keys(data.activeFilters).length > 0);
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<h1 class="text-2xl font-bold mb-8">Products</h1>

	<div class="flex gap-8">
		<!-- Sidebar Filters -->
		<aside class="w-64 flex-shrink-0">
			<!-- Debounced Search -->
			<div class="mb-6">
				<input
					type="text"
					bind:value={searchInput}
					placeholder="Search products..."
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
				/>
			</div>

			{#if hasActiveFilters}
				<div class="mb-6">
					<a href={clearAllFilters()} class="text-blue-600 text-sm hover:underline">
						Clear all filters
					</a>
				</div>
			{/if}

			<!-- Facet Filters -->
			{#each data.facets as facet}
				{@const counts = data.facetCounts[facet.code] ?? []}
				{#if counts.length > 0}
					<div class="mb-6">
						<h3 class="font-semibold mb-3">{getFacetName(facet)}</h3>
						<div class="space-y-2">
							{#each counts as value}
								{@const active = isFilterActive(facet.code, value.code)}
								<a
									href={getFilterUrl(facet.code, value.code, !active)}
									class="flex items-center justify-between text-sm {active
										? 'text-blue-600 font-medium'
										: 'text-gray-600 hover:text-gray-900'}"
								>
									<span class="flex items-center gap-2">
										<span
											class="w-4 h-4 border rounded flex items-center justify-center {active
												? 'bg-blue-600 border-blue-600'
												: 'border-gray-300'}"
										>
											{#if active}
												<svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
													<path
														fill-rule="evenodd"
														d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
														clip-rule="evenodd"
													/>
												</svg>
											{/if}
										</span>
										{value.name}
									</span>
									<span class="text-gray-400">({value.count})</span>
								</a>
							{/each}
						</div>
					</div>
				{/if}
			{/each}
		</aside>

		<!-- Products Grid -->
		<div class="flex-1">
			{#if data.products.length === 0}
				<div class="text-center py-12 text-gray-500">
					<p>No products found matching your criteria.</p>
					{#if hasActiveFilters}
						<a href={clearAllFilters()} class="text-blue-600 hover:underline mt-2 inline-block">
							Clear filters
						</a>
					{/if}
				</div>
			{:else}
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each data.products as product}
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
										From {formatPrice(getLowestPrice(product)!)}
									</p>
								{/if}
							</div>
						</a>
					{/each}
				</div>

				<!-- Pagination -->
				{#if data.pagination.total > data.pagination.limit}
					<div class="mt-8 flex justify-center gap-2">
						{#if data.currentPage > 1}
							<a
								href="?page={data.currentPage - 1}"
								class="px-4 py-2 border rounded-lg hover:bg-gray-50"
							>
								Previous
							</a>
						{/if}
						<span class="px-4 py-2 text-gray-500">
							Page {data.currentPage} of {Math.ceil(data.pagination.total / data.pagination.limit)}
						</span>
						{#if data.pagination.hasMore}
							<a
								href="?page={data.currentPage + 1}"
								class="px-4 py-2 border rounded-lg hover:bg-gray-50"
							>
								Next
							</a>
						{/if}
					</div>
				{/if}
			{/if}
		</div>
	</div>
</div>
