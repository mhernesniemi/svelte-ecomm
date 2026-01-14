<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let showCreateFacet = $state(false);
	let addingValueToFacet = $state<number | null>(null);

	function getTranslation(translations: { languageCode: string; name: string }[]): string {
		return translations.find((t) => t.languageCode === 'en')?.name ?? '';
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

	<!-- Create Facet Form -->
	{#if showCreateFacet}
		<div class="bg-white rounded-lg shadow p-6 mb-6">
			<h2 class="font-semibold mb-4">Create New Facet</h2>
			<form method="POST" action="?/create" use:enhance={() => {
				return async ({ update }) => {
					await update();
					showCreateFacet = false;
				};
			}}>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="facet_code" class="block text-sm font-medium text-gray-700 mb-1">Code</label>
						<input
							type="text"
							id="facet_code"
							name="code"
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
							name="name_en"
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
						type="submit"
						class="px-4 py-2 bg-blue-600 text-white rounded-lg"
					>
						Create Facet
					</button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Facets List -->
	<div class="space-y-6">
		{#if data.facets.length === 0}
			<div class="bg-white rounded-lg shadow p-12 text-center text-gray-500">
				No facets yet. Create your first facet to start categorizing products.
			</div>
		{:else}
			{#each data.facets as facet}
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
							<form method="POST" action="?/delete" use:enhance>
								<input type="hidden" name="id" value={facet.id} />
								<button
									type="submit"
									class="px-3 py-1 text-sm text-red-600 hover:text-red-800"
								>
									Delete
								</button>
							</form>
						</div>
					</div>

					<!-- Add Value Form -->
					{#if addingValueToFacet === facet.id}
						<div class="px-6 py-4 bg-gray-50 border-b">
							<form method="POST" action="?/createValue" use:enhance={() => {
								return async ({ update }) => {
									await update();
									addingValueToFacet = null;
								};
							}}>
								<input type="hidden" name="facetId" value={facet.id} />
								<div class="flex gap-4 items-end">
									<div class="flex-1">
										<label
											for="value_code_{facet.id}"
											class="block text-sm font-medium text-gray-700 mb-1">Code</label
										>
										<input
											type="text"
											id="value_code_{facet.id}"
											name="code"
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
											name="name_en"
											placeholder="e.g., Red"
											class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
										/>
									</div>
									<button
										type="submit"
										class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
									>
										Add
									</button>
								</div>
							</form>
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
