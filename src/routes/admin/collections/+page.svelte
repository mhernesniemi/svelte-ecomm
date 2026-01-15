<script lang="ts">
	import { enhance } from "$app/forms";

	let { data } = $props();

	function getTranslation(
		translations: { languageCode: string; name: string; slug: string }[],
		lang: string
	) {
		return translations.find((t) => t.languageCode === lang) ?? translations[0];
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Collections</h1>
			<p class="mt-1 text-sm text-gray-600">
				Manage product collections with dynamic filters
			</p>
		</div>
		<a
			href="/admin/collections/new"
			class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
		>
			Create Collection
		</a>
	</div>

	{#if data.collections.length === 0}
		<div class="rounded-lg border border-dashed border-gray-300 p-12 text-center">
			<svg
				class="mx-auto h-12 w-12 text-gray-400"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
				/>
			</svg>
			<h3 class="mt-2 text-sm font-medium text-gray-900">No collections</h3>
			<p class="mt-1 text-sm text-gray-500">Get started by creating a new collection.</p>
			<div class="mt-6">
				<a
					href="/admin/collections/new"
					class="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
				>
					Create Collection
				</a>
			</div>
		</div>
	{:else}
		<div class="overflow-hidden rounded-lg bg-white shadow">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th
							scope="col"
							class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
						>
							Collection
						</th>
						<th
							scope="col"
							class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
						>
							Products
						</th>
						<th
							scope="col"
							class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
						>
							Status
						</th>
						<th
							scope="col"
							class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
						>
							Created
						</th>
						<th scope="col" class="relative px-6 py-3">
							<span class="sr-only">Actions</span>
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 bg-white">
					{#each data.collections as collection}
						{@const translation = getTranslation(collection.translations, "en")}
						<tr class="hover:bg-gray-50">
							<td class="whitespace-nowrap px-6 py-4">
								<div class="flex items-center">
									<div>
										<div class="text-sm font-medium text-gray-900">
											{translation?.name ?? "Untitled"}
										</div>
										<div class="text-sm text-gray-500">
											{collection.code}
										</div>
									</div>
								</div>
							</td>
							<td class="whitespace-nowrap px-6 py-4">
								<span class="text-sm text-gray-900">{collection.productCount} products</span>
							</td>
							<td class="whitespace-nowrap px-6 py-4">
								<div class="flex gap-2">
									{#if collection.enabled}
										<span
											class="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800"
										>
											Enabled
										</span>
									{:else}
										<span
											class="inline-flex rounded-full bg-gray-100 px-2 text-xs font-semibold leading-5 text-gray-800"
										>
											Disabled
										</span>
									{/if}
									{#if collection.isPrivate}
										<span
											class="inline-flex rounded-full bg-yellow-100 px-2 text-xs font-semibold leading-5 text-yellow-800"
										>
											Private
										</span>
									{/if}
								</div>
							</td>
							<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
								{new Date(collection.createdAt).toLocaleDateString()}
							</td>
							<td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
								<div class="flex justify-end gap-2">
									<a
										href="/admin/collections/{collection.id}"
										class="text-blue-600 hover:text-blue-900"
									>
										Edit
									</a>
									<form
										method="POST"
										action="?/delete"
										use:enhance={() => {
											return async ({ result, update }) => {
												if (result.type === "success") {
													await update();
												}
											};
										}}
									>
										<input type="hidden" name="id" value={collection.id} />
										<button
											type="submit"
											class="text-red-600 hover:text-red-900"
											onclick={(e) => {
												if (
													!confirm(
														"Are you sure you want to delete this collection?"
													)
												) {
													e.preventDefault();
												}
											}}
										>
											Delete
										</button>
									</form>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
