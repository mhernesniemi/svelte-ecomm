<script lang="ts">
	import { createFacet, createFacetValue, deleteFacet, listFacets } from '$lib/remote/facets.remote';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let facets = $state(data.facets);
	let showCreateFacet = $state(false);
	let addingValueToFacet = $state<number | null>(null);
	let isLoading = $state(false);
	let message = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	// Form state
	let newFacetCode = $state('');
	let newFacetName = $state('');
	let newValueCode = $state('');
	let newValueName = $state('');

	function getTranslation(translations: { languageCode: string; name: string }[]): string {
		return translations.find((t) => t.languageCode === 'en')?.name ?? '';
	}

	async function handleCreateFacet() {
		if (!newFacetCode || !newFacetName) return;
		isLoading = true;
		message = null;
		try {
			await createFacet({
				code: newFacetCode,
				translations: [{ languageCode: 'en', name: newFacetName }]
			});
			facets = await listFacets({});
			showCreateFacet = false;
			newFacetCode = '';
			newFacetName = '';
			message = { type: 'success', text: 'Facet created successfully' };
		} catch {
			message = { type: 'error', text: 'Failed to create facet' };
		} finally {
			isLoading = false;
		}
	}

	async function handleCreateValue(facetId: number) {
		if (!newValueCode || !newValueName) return;
		isLoading = true;
		message = null;
		try {
			await createFacetValue({
				facetId,
				code: newValueCode,
				translations: [{ languageCode: 'en', name: newValueName }]
			});
			facets = await listFacets({});
			addingValueToFacet = null;
			newValueCode = '';
			newValueName = '';
		} catch {
			message = { type: 'error', text: 'Failed to create value' };
		} finally {
			isLoading = false;
		}
	}

	async function handleDelete(id: number) {
		isLoading = true;
		message = null;
		try {
			await deleteFacet({ id });
			facets = await listFacets({});
		} catch {
			message = { type: 'error', text: 'Failed to delete facet' };
		} finally {
			isLoading = false;
		}
	}
</script>

<div>
	<div class="flex justify-between items-center mb-8">
		<h1 class="text-2xl font-bold">Facets</h1>
		<button
			type="button"
			onclick={() => (showCreateFacet = !showCreateFacet)}
			class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
		>
			Add Facet
		</button>
	</div>

	{#if message}
		<div
			class="px-4 py-3 rounded mb-6 {message.type === 'success'
				? 'bg-green-50 border border-green-200 text-green-700'
				: 'bg-red-50 border border-red-200 text-red-700'}"
		>
			{message.text}
		</div>
	{/if}

	<!-- Create Facet Form -->
	{#if showCreateFacet}
		<div class="bg-white rounded-lg shadow p-6 mb-6">
			<h2 class="font-semibold mb-4">Create New Facet</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="facet_code" class="block text-sm font-medium text-gray-700 mb-1">Code</label>
					<input
						type="text"
						id="facet_code"
						bind:value={newFacetCode}
						placeholder="e.g., color"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg"
					/>
				</div>
				<div>
					<label for="facet_name_en" class="block text-sm font-medium text-gray-700 mb-1"
						>Name (EN)</label
					>
					<input
						type="text"
						id="facet_name_en"
						bind:value={newFacetName}
						placeholder="e.g., Color"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg"
					/>
				</div>
			</div>
			<div class="mt-4 flex justify-end gap-2">
				<button
					type="button"
					onclick={() => (showCreateFacet = false)}
					class="px-4 py-2 border rounded-lg"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={handleCreateFacet}
					disabled={isLoading || !newFacetCode || !newFacetName}
					class="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
				>
					{isLoading ? 'Creating...' : 'Create Facet'}
				</button>
			</div>
		</div>
	{/if}

	<!-- Facets List -->
	<div class="space-y-6">
		{#if facets.length === 0}
			<div class="bg-white rounded-lg shadow p-12 text-center text-gray-500">
				No facets yet. Create your first facet to start categorizing products.
			</div>
		{:else}
			{#each facets as facet}
				<div class="bg-white rounded-lg shadow">
					<div class="px-6 py-4 border-b flex justify-between items-center">
						<div>
							<h2 class="font-semibold">{getTranslation(facet.translations)}</h2>
							<p class="text-sm text-gray-500">Code: {facet.code}</p>
						</div>
						<div class="flex gap-2">
							<button
								type="button"
								onclick={() =>
									(addingValueToFacet = addingValueToFacet === facet.id ? null : facet.id)}
								class="px-3 py-1 text-sm border rounded hover:bg-gray-50"
							>
								Add Value
							</button>
							<button
								type="button"
								onclick={() => handleDelete(facet.id)}
								disabled={isLoading}
								class="px-3 py-1 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
							>
								Delete
							</button>
						</div>
					</div>

					<!-- Add Value Form -->
					{#if addingValueToFacet === facet.id}
						<div class="px-6 py-4 bg-gray-50 border-b">
							<div class="flex gap-4 items-end">
								<div class="flex-1">
									<label
										for="value_code_{facet.id}"
										class="block text-sm font-medium text-gray-700 mb-1">Code</label
									>
									<input
										type="text"
										id="value_code_{facet.id}"
										bind:value={newValueCode}
										placeholder="e.g., red"
										class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
									/>
								</div>
								<div class="flex-1">
									<label
										for="value_name_{facet.id}"
										class="block text-sm font-medium text-gray-700 mb-1">Name (EN)</label
									>
									<input
										type="text"
										id="value_name_{facet.id}"
										bind:value={newValueName}
										placeholder="e.g., Red"
										class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
									/>
								</div>
								<button
									type="button"
									onclick={() => handleCreateValue(facet.id)}
									disabled={isLoading || !newValueCode || !newValueName}
									class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
								>
									Add
								</button>
							</div>
						</div>
					{/if}

					<!-- Values -->
					<div class="px-6 py-4">
						{#if facet.values.length === 0}
							<p class="text-sm text-gray-500">No values yet</p>
						{:else}
							<div class="flex flex-wrap gap-2">
								{#each facet.values as value}
									<span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100">
										{getTranslation(value.translations)}
										<span class="ml-1 text-gray-400">({value.code})</span>
									</span>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
