<script lang="ts">
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let activeTab = $state<'en' | 'fi'>('en');
	let showDeleteConfirm = $state(false);
	let showAddVariant = $state(false);
	let editingVariantFacets = $state<number | null>(null);

	function getTranslation(lang: string) {
		return data.product.translations.find((t) => t.languageCode === lang);
	}

	const enTrans = getTranslation('en');
	const fiTrans = getTranslation('fi');
</script>

<div>
	<div class="mb-8">
		<a href="/admin/products" class="text-blue-600 hover:underline text-sm">&larr; Back to Products</a>
		<h1 class="text-2xl font-bold mt-2">Edit Product</h1>
	</div>

	{#if form?.success}
		<div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
			Product updated successfully
		</div>
	{/if}

	{#if form?.error}
		<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
			{form.error}
		</div>
	{/if}

	<!-- Product Form -->
	<form method="POST" action="?/update" class="bg-white rounded-lg shadow mb-8">
		<!-- Language Tabs -->
		<div class="border-b">
			<div class="flex">
				<button
					type="button"
					onclick={() => (activeTab = 'en')}
					class="px-6 py-3 text-sm font-medium {activeTab === 'en'
						? 'border-b-2 border-blue-500 text-blue-600'
						: 'text-gray-500 hover:text-gray-700'}"
				>
					English
				</button>
				<button
					type="button"
					onclick={() => (activeTab = 'fi')}
					class="px-6 py-3 text-sm font-medium {activeTab === 'fi'
						? 'border-b-2 border-blue-500 text-blue-600'
						: 'text-gray-500 hover:text-gray-700'}"
				>
					Finnish
				</button>
			</div>
		</div>

		<div class="p-6 space-y-6">
			<!-- English Fields -->
			<div class={activeTab === 'en' ? '' : 'hidden'}>
				<div class="space-y-4">
					<div>
						<label for="name_en" class="block text-sm font-medium text-gray-700 mb-1">
							Name <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							id="name_en"
							name="name_en"
							value={enTrans?.name ?? ''}
							required
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>

					<div>
						<label for="slug_en" class="block text-sm font-medium text-gray-700 mb-1">
							Slug <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							id="slug_en"
							name="slug_en"
							value={enTrans?.slug ?? ''}
							required
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>

					<div>
						<label for="description_en" class="block text-sm font-medium text-gray-700 mb-1">
							Description
						</label>
						<textarea
							id="description_en"
							name="description_en"
							rows="4"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
							>{enTrans?.description ?? ''}</textarea
						>
					</div>
				</div>
			</div>

			<!-- Finnish Fields -->
			<div class={activeTab === 'fi' ? '' : 'hidden'}>
				<div class="space-y-4">
					<div>
						<label for="name_fi" class="block text-sm font-medium text-gray-700 mb-1"> Name </label>
						<input
							type="text"
							id="name_fi"
							name="name_fi"
							value={fiTrans?.name ?? ''}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>

					<div>
						<label for="slug_fi" class="block text-sm font-medium text-gray-700 mb-1"> Slug </label>
						<input
							type="text"
							id="slug_fi"
							name="slug_fi"
							value={fiTrans?.slug ?? ''}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>

					<div>
						<label for="description_fi" class="block text-sm font-medium text-gray-700 mb-1">
							Description
						</label>
						<textarea
							id="description_fi"
							name="description_fi"
							rows="4"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
							>{fiTrans?.description ?? ''}</textarea
						>
					</div>
				</div>
			</div>

			<!-- Common Fields -->
			<div class="border-t pt-6">
				<label class="flex items-center gap-2">
					<input
						type="checkbox"
						name="enabled"
						checked={data.product.enabled}
						class="rounded border-gray-300 text-blue-600"
					/>
					<span class="text-sm font-medium text-gray-700">Product is active</span>
				</label>
			</div>
		</div>

		<!-- Actions -->
		<div class="px-6 py-4 bg-gray-50 border-t flex justify-between">
			<button
				type="button"
				onclick={() => (showDeleteConfirm = true)}
				class="px-4 py-2 text-red-600 hover:text-red-800"
			>
				Delete Product
			</button>
			<button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
				Save Changes
			</button>
		</div>
	</form>

	<!-- Facet Values Section -->
	<div class="bg-white rounded-lg shadow mb-8">
		<div class="px-6 py-4 border-b">
			<h2 class="text-lg font-semibold">Facet Values</h2>
			<p class="text-sm text-gray-500">Assign attributes to this product for filtering</p>
		</div>

		{#if form?.facetSuccess}
			<div class="mx-6 mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
				Facet values updated
			</div>
		{/if}

		<form method="POST" action="?/updateFacetValues" class="p-6">
			{#if data.facets.length === 0}
				<p class="text-gray-500">No facets defined. Create facets first in the Facets section.</p>
			{:else}
				<div class="space-y-6">
					{#each data.facets as facet}
						{@const facetName = facet.translations.find((t) => t.languageCode === 'en')?.name ?? facet.code}
						<div>
							<p class="text-sm font-medium text-gray-700 mb-2">{facetName}</p>
							{#if facet.values.length === 0}
								<p class="text-sm text-gray-400">No values defined for this facet</p>
							{:else}
								<div class="flex flex-wrap gap-2">
									{#each facet.values as value}
										{@const valueName = value.translations.find((t) => t.languageCode === 'en')?.name ?? value.code}
										{@const isSelected = data.product.facetValues.some((fv) => fv.id === value.id)}
										<label
											class="inline-flex items-center px-3 py-1.5 rounded-full text-sm cursor-pointer transition-colors {isSelected
												? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
												: 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'}"
										>
											<input
												type="checkbox"
												name="facetValueIds"
												value={value.id}
												checked={isSelected}
												class="sr-only"
											/>
											{valueName}
										</label>
									{/each}
								</div>
							{/if}
						</div>
					{/each}
				</div>
				<div class="mt-6 pt-4 border-t">
					<button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
						Save Facet Values
					</button>
				</div>
			{/if}
		</form>
	</div>

	<!-- Variants Section -->
	<div class="bg-white rounded-lg shadow">
		<div class="px-6 py-4 border-b flex justify-between items-center">
			<h2 class="text-lg font-semibold">Variants</h2>
			<button
				type="button"
				onclick={() => (showAddVariant = !showAddVariant)}
				class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
			>
				Add Variant
			</button>
		</div>

		{#if form?.variantSuccess}
			<div class="mx-6 mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
				Variant added successfully
			</div>
		{/if}

		{#if form?.variantError}
			<div class="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
				{form.variantError}
			</div>
		{/if}

		<!-- Add Variant Form -->
		{#if showAddVariant}
			<form method="POST" action="?/addVariant" class="p-6 border-b bg-gray-50">
				<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
					<div>
						<label for="variant_sku" class="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
						<input
							type="text"
							id="variant_sku"
							name="sku"
							required
							class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
						/>
					</div>
					<div>
						<label for="variant_price" class="block text-sm font-medium text-gray-700 mb-1">Price *</label>
						<input
							type="number"
							id="variant_price"
							name="price"
							step="0.01"
							min="0"
							required
							class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
						/>
					</div>
					<div>
						<label for="variant_stock" class="block text-sm font-medium text-gray-700 mb-1">Stock</label>
						<input
							type="number"
							id="variant_stock"
							name="stock"
							min="0"
							value="0"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
						/>
					</div>
					<div>
						<label for="variant_name_en" class="block text-sm font-medium text-gray-700 mb-1">Name (EN)</label>
						<input
							type="text"
							id="variant_name_en"
							name="variant_name_en"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
						/>
					</div>
				</div>
				<div class="mt-4 flex justify-end gap-2">
					<button
						type="button"
						onclick={() => (showAddVariant = false)}
						class="px-3 py-1 border rounded text-sm"
					>
						Cancel
					</button>
					<button type="submit" class="px-3 py-1 bg-blue-600 text-white rounded text-sm">
						Add Variant
					</button>
				</div>
			</form>
		{/if}

		{#if form?.variantFacetSuccess}
			<div class="mx-6 mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
				Variant facet values updated
			</div>
		{/if}

		<!-- Variants Table -->
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Facets</th>
					<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200">
				{#if data.product.variants.length === 0}
					<tr>
						<td colspan="6" class="px-6 py-8 text-center text-gray-500">
							No variants yet. Add a variant to start selling this product.
						</td>
					</tr>
				{:else}
					{#each data.product.variants as variant}
						<tr>
							<td class="px-6 py-4 text-sm font-mono">{variant.sku}</td>
							<td class="px-6 py-4 text-sm">
								{variant.translations.find((t) => t.languageCode === 'en')?.name ?? '-'}
							</td>
							<td class="px-6 py-4 text-sm">{(variant.price / 100).toFixed(2)} EUR</td>
							<td class="px-6 py-4 text-sm">{variant.stock}</td>
							<td class="px-6 py-4 text-sm">
								{#if variant.facetValues.length === 0}
									<span class="text-gray-400">None</span>
								{:else}
									<div class="flex flex-wrap gap-1">
										{#each variant.facetValues as fv}
											{@const name = fv.translations.find((t) => t.languageCode === 'en')?.name ?? fv.code}
											<span class="px-2 py-0.5 bg-gray-100 rounded text-xs">{name}</span>
										{/each}
									</div>
								{/if}
							</td>
							<td class="px-6 py-4 text-right text-sm">
								<button
									type="button"
									onclick={() => (editingVariantFacets = editingVariantFacets === variant.id ? null : variant.id)}
									class="text-blue-600 hover:text-blue-800"
								>
									{editingVariantFacets === variant.id ? 'Cancel' : 'Edit Facets'}
								</button>
							</td>
						</tr>
						{#if editingVariantFacets === variant.id}
							<tr class="bg-gray-50">
								<td colspan="6" class="px-6 py-4">
									<form method="POST" action="?/updateVariantFacetValues">
										<input type="hidden" name="variantId" value={variant.id} />
										<div class="space-y-4">
											{#each data.facets as facet}
												{@const facetName = facet.translations.find((t) => t.languageCode === 'en')?.name ?? facet.code}
												<div>
													<p class="text-sm font-medium text-gray-700 mb-2">{facetName}</p>
													{#if facet.values.length === 0}
														<p class="text-sm text-gray-400">No values</p>
													{:else}
														<div class="flex flex-wrap gap-2">
															{#each facet.values as value}
																{@const valueName = value.translations.find((t) => t.languageCode === 'en')?.name ?? value.code}
																{@const isSelected = variant.facetValues.some((fv) => fv.id === value.id)}
																<label
																	class="inline-flex items-center px-3 py-1.5 rounded-full text-sm cursor-pointer transition-colors {isSelected
																		? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
																		: 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'}"
																>
																	<input
																		type="checkbox"
																		name="facetValueIds"
																		value={value.id}
																		checked={isSelected}
																		class="sr-only"
																	/>
																	{valueName}
																</label>
															{/each}
														</div>
													{/if}
												</div>
											{/each}
										</div>
										<div class="mt-4">
											<button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
												Save Variant Facets
											</button>
										</div>
									</form>
								</td>
							</tr>
						{/if}
					{/each}
				{/if}
			</tbody>
		</table>
	</div>

	<!-- Delete Confirmation Modal -->
	{#if showDeleteConfirm}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
				<h3 class="text-lg font-semibold mb-4">Delete Product?</h3>
				<p class="text-gray-600 mb-6">
					Are you sure you want to delete this product? This action cannot be undone.
				</p>
				<div class="flex justify-end gap-3">
					<button
						type="button"
						onclick={() => (showDeleteConfirm = false)}
						class="px-4 py-2 border rounded-lg"
					>
						Cancel
					</button>
					<form method="POST" action="?/delete" class="inline">
						<button type="submit" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
							Delete
						</button>
					</form>
				</div>
			</div>
		</div>
	{/if}
</div>
