<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let showCreateForm = $state(false);

	function formatPrice(cents: number): string {
		return (cents / 100).toFixed(2);
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

	<!-- Create Form -->
	{#if showCreateForm}
		<div class="bg-white rounded-lg shadow p-6 mb-6">
			<h2 class="font-semibold mb-4">Create Promotion</h2>
			<form method="POST" action="?/create" use:enhance={() => {
				return async ({ update }) => {
					await update();
					showCreateForm = false;
				};
			}}>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="promo_code" class="block text-sm font-medium text-gray-700 mb-1">Code</label>
						<input
							type="text"
							id="promo_code"
							name="code"
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
							name="discountType"
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
							name="discountValue"
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
							name="minOrderAmount"
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
							name="usageLimit"
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
						type="submit"
						class="px-4 py-2 bg-blue-600 text-white rounded-lg"
					>
						Create Promotion
					</button>
				</div>
			</form>
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
				{#if data.promotions.length === 0}
					<tr>
						<td colspan="6" class="px-6 py-12 text-center text-gray-500"> No promotions yet </td>
					</tr>
				{:else}
					{#each data.promotions as promo}
						<tr class="hover:bg-gray-50">
							<td class="px-6 py-4 font-mono font-medium">{promo.code}</td>
							<td class="px-6 py-4 text-sm">
								{#if promo.discountType === 'percentage'}
									{promo.discountValue}%
								{:else}
									{formatPrice(promo.discountValue)} EUR
								{/if}
							</td>
							<td class="px-6 py-4 text-sm text-gray-500">
								{promo.minOrderAmount ? `${formatPrice(promo.minOrderAmount)} EUR` : '-'}
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
								<form method="POST" action="?/toggle" use:enhance class="inline">
									<input type="hidden" name="id" value={promo.id} />
									<input type="hidden" name="enabled" value={!promo.enabled} />
									<button
										type="submit"
										class="text-blue-600 hover:text-blue-800 mr-3"
									>
										{promo.enabled ? 'Disable' : 'Enable'}
									</button>
								</form>
								<form method="POST" action="?/delete" use:enhance class="inline">
									<input type="hidden" name="id" value={promo.id} />
									<button
										type="submit"
										class="text-red-600 hover:text-red-800"
									>
										Delete
									</button>
								</form>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>
