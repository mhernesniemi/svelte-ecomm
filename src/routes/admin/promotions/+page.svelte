<script lang="ts">
	import {
		createPromotion,
		togglePromotion,
		deletePromotion,
		listPromotions
	} from '$lib/remote/promotions.remote';
	import { formatPrice } from '$lib/utils/money';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let promotions = $state(data.promotions);
	let showCreateForm = $state(false);
	let isLoading = $state(false);
	let message = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	// Form state
	let code = $state('');
	let discountType = $state<'percentage' | 'fixed_amount'>('percentage');
	let discountValue = $state('');
	let minOrderAmount = $state('');
	let usageLimit = $state('');

	async function handleCreate() {
		if (!code || !discountValue) return;
		isLoading = true;
		message = null;
		try {
			const value = discountType === 'fixed_amount'
				? parseFloat(discountValue) * 100
				: parseFloat(discountValue);

			await createPromotion({
				code: code.toUpperCase(),
				discountType,
				discountValue: value,
				minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) * 100 : undefined,
				usageLimit: usageLimit ? parseInt(usageLimit) : undefined
			});

			const result = await listPromotions({});
			promotions = result.items;
			showCreateForm = false;
			code = '';
			discountValue = '';
			minOrderAmount = '';
			usageLimit = '';
			message = { type: 'success', text: 'Promotion created successfully' };
		} catch {
			message = { type: 'error', text: 'Failed to create promotion' };
		} finally {
			isLoading = false;
		}
	}

	async function handleToggle(id: number, currentEnabled: boolean) {
		isLoading = true;
		try {
			await togglePromotion({ id, enabled: !currentEnabled });
			const result = await listPromotions({});
			promotions = result.items;
		} catch {
			message = { type: 'error', text: 'Failed to toggle promotion' };
		} finally {
			isLoading = false;
		}
	}

	async function handleDelete(id: number) {
		isLoading = true;
		try {
			await deletePromotion({ id });
			const result = await listPromotions({});
			promotions = result.items;
		} catch {
			message = { type: 'error', text: 'Failed to delete promotion' };
		} finally {
			isLoading = false;
		}
	}
</script>

<div>
	<div class="flex justify-between items-center mb-8">
		<h1 class="text-2xl font-bold">Promotions</h1>
		<button
			type="button"
			onclick={() => (showCreateForm = !showCreateForm)}
			class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
		>
			Add Promotion
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

	<!-- Create Form -->
	{#if showCreateForm}
		<div class="bg-white rounded-lg shadow p-6 mb-6">
			<h2 class="font-semibold mb-4">Create Promotion</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="promo_code" class="block text-sm font-medium text-gray-700 mb-1">Code</label>
					<input
						type="text"
						id="promo_code"
						bind:value={code}
						placeholder="e.g., SUMMER20"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg uppercase"
					/>
				</div>
				<div>
					<label for="promo_discount_type" class="block text-sm font-medium text-gray-700 mb-1"
						>Discount Type</label
					>
					<select
						id="promo_discount_type"
						bind:value={discountType}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg"
					>
						<option value="percentage">Percentage (%)</option>
						<option value="fixed_amount">Fixed Amount (EUR)</option>
					</select>
				</div>
				<div>
					<label for="promo_value" class="block text-sm font-medium text-gray-700 mb-1">Value</label
					>
					<input
						type="number"
						id="promo_value"
						bind:value={discountValue}
						placeholder="e.g., 20"
						min="0"
						step="0.01"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg"
					/>
				</div>
				<div>
					<label for="promo_min_order" class="block text-sm font-medium text-gray-700 mb-1"
						>Min Order (EUR)</label
					>
					<input
						type="number"
						id="promo_min_order"
						bind:value={minOrderAmount}
						placeholder="Optional"
						min="0"
						step="0.01"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg"
					/>
				</div>
				<div>
					<label for="promo_usage_limit" class="block text-sm font-medium text-gray-700 mb-1"
						>Usage Limit</label
					>
					<input
						type="number"
						id="promo_usage_limit"
						bind:value={usageLimit}
						placeholder="Unlimited"
						min="0"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg"
					/>
				</div>
			</div>
			<div class="mt-4 flex justify-end gap-2">
				<button
					type="button"
					onclick={() => (showCreateForm = false)}
					class="px-4 py-2 border rounded-lg"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={handleCreate}
					disabled={isLoading || !code || !discountValue}
					class="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
				>
					{isLoading ? 'Creating...' : 'Create Promotion'}
				</button>
			</div>
		</div>
	{/if}

	<!-- Promotions Table -->
	<div class="bg-white rounded-lg shadow overflow-hidden">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Order</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
					<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
				</tr>
			</thead>
			<tbody class="bg-white divide-y divide-gray-200">
				{#if promotions.length === 0}
					<tr>
						<td colspan="6" class="px-6 py-12 text-center text-gray-500"> No promotions yet </td>
					</tr>
				{:else}
					{#each promotions as promo}
						<tr class="hover:bg-gray-50">
							<td class="px-6 py-4 font-mono font-medium">{promo.code}</td>
							<td class="px-6 py-4 text-sm">
								{#if promo.discountType === 'percentage'}
									{promo.discountValue}%
								{:else}
									{formatPrice(promo.discountValue)}
								{/if}
							</td>
							<td class="px-6 py-4 text-sm text-gray-500">
								{promo.minOrderAmount ? formatPrice(promo.minOrderAmount) : '-'}
							</td>
							<td class="px-6 py-4 text-sm text-gray-500">
								{promo.usageCount}{promo.usageLimit ? ` / ${promo.usageLimit}` : ''}
							</td>
							<td class="px-6 py-4">
								<span
									class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {promo.enabled
										? 'bg-green-100 text-green-800'
										: 'bg-gray-100 text-gray-800'}"
								>
									{promo.enabled ? 'Active' : 'Inactive'}
								</span>
							</td>
							<td class="px-6 py-4 text-right text-sm">
								<button
									type="button"
									onclick={() => handleToggle(promo.id, promo.enabled)}
									disabled={isLoading}
									class="text-blue-600 hover:text-blue-800 mr-3 disabled:opacity-50"
								>
									{promo.enabled ? 'Disable' : 'Enable'}
								</button>
								<button
									type="button"
									onclick={() => handleDelete(promo.id)}
									disabled={isLoading}
									class="text-red-600 hover:text-red-800 disabled:opacity-50"
								>
									Delete
								</button>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>
