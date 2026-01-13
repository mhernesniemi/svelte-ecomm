<script lang="ts">
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let activeTab = $state<'en' | 'fi'>('en');

	function generateSlug(name: string): string {
		return name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)/g, '');
	}

	let nameEn = $state('');
	let slugEn = $state('');
	let autoSlugEn = $state(true);

	// Initialize from form values if present (after form submission with errors)
	$effect(() => {
		if (form?.values?.nameEn) nameEn = form.values.nameEn;
		if (form?.values?.slugEn) slugEn = form.values.slugEn;
	});

	$effect(() => {
		if (autoSlugEn && nameEn) {
			slugEn = generateSlug(nameEn);
		}
	});
</script>

<div>
	<div class="mb-8">
		<a href="/admin/products" class="text-blue-600 hover:underline text-sm">&larr; Back to Products</a>
		<h1 class="text-2xl font-bold mt-2">Create Product</h1>
	</div>

	{#if form?.error}
		<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
			{form.error}
		</div>
	{/if}

	<form method="POST" class="bg-white rounded-lg shadow">
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
							bind:value={nameEn}
							required
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>

					<div>
						<label for="slug_en" class="block text-sm font-medium text-gray-700 mb-1">
							Slug <span class="text-red-500">*</span>
						</label>
						<div class="flex gap-2">
							<input
								type="text"
								id="slug_en"
								name="slug_en"
								bind:value={slugEn}
								required
								class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
							/>
							<label class="flex items-center gap-2 text-sm text-gray-500">
								<input
									type="checkbox"
									bind:checked={autoSlugEn}
									class="rounded border-gray-300"
								/>
								Auto
							</label>
						</div>
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
							value={form?.values?.descriptionEn ?? ''}
						></textarea>
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
							value={form?.values?.nameFi ?? ''}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>

					<div>
						<label for="slug_fi" class="block text-sm font-medium text-gray-700 mb-1"> Slug </label>
						<input
							type="text"
							id="slug_fi"
							name="slug_fi"
							value={form?.values?.slugFi ?? ''}
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
							value={form?.values?.descriptionFi ?? ''}
						></textarea>
					</div>
				</div>
			</div>

			<!-- Common Fields -->
			<div class="border-t pt-6">
				<label class="flex items-center gap-2">
					<input
						type="checkbox"
						name="enabled"
						checked={form?.values?.enabled ?? true}
						class="rounded border-gray-300 text-blue-600"
					/>
					<span class="text-sm font-medium text-gray-700">Product is active</span>
				</label>
			</div>
		</div>

		<!-- Actions -->
		<div class="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
			<a
				href="/admin/products"
				class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
			>
				Cancel
			</a>
			<button
				type="submit"
				class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
			>
				Create Product
			</button>
		</div>
	</form>
</div>
