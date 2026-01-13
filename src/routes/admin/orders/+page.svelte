<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const states = ['created', 'payment_pending', 'paid', 'shipped', 'delivered', 'cancelled'];

	function getStateColor(state: string): string {
		switch (state) {
			case 'paid':
				return 'bg-green-100 text-green-800';
			case 'shipped':
				return 'bg-blue-100 text-blue-800';
			case 'delivered':
				return 'bg-purple-100 text-purple-800';
			case 'cancelled':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}
</script>

<div>
	<h1 class="text-2xl font-bold mb-8">Orders</h1>

	<!-- State Filter -->
	<div class="mb-6 flex gap-2 flex-wrap">
		<a
			href="/admin/orders"
			class="px-3 py-1 rounded-full text-sm {!data.currentState
				? 'bg-blue-600 text-white'
				: 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
		>
			All
		</a>
		{#each states as state}
			<a
				href="/admin/orders?state={state}"
				class="px-3 py-1 rounded-full text-sm capitalize {data.currentState === state
					? 'bg-blue-600 text-white'
					: 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
			>
				{state.replace('_', ' ')}
			</a>
		{/each}
	</div>

	<div class="bg-white rounded-lg shadow overflow-hidden">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
					<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
				</tr>
			</thead>
			<tbody class="bg-white divide-y divide-gray-200">
				{#if data.orders.length === 0}
					<tr>
						<td colspan="6" class="px-6 py-12 text-center text-gray-500"> No orders found </td>
					</tr>
				{:else}
					{#each data.orders as order}
						<tr class="hover:bg-gray-50">
							<td class="px-6 py-4">
								<p class="font-medium">{order.code}</p>
								<p class="text-sm text-gray-500">{order.lines.length} items</p>
							</td>
							<td class="px-6 py-4 text-sm text-gray-500">
								{order.shippingFullName ?? 'Guest'}
							</td>
							<td class="px-6 py-4">
								<span
									class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize {getStateColor(
										order.state
									)}"
								>
									{order.state.replace('_', ' ')}
								</span>
							</td>
							<td class="px-6 py-4 text-sm font-medium">
								{(order.total / 100).toFixed(2)} {order.currencyCode}
							</td>
							<td class="px-6 py-4 text-sm text-gray-500">
								{new Date(order.createdAt).toLocaleDateString()}
							</td>
							<td class="px-6 py-4 text-right">
								<a href="/admin/orders/{order.id}" class="text-blue-600 hover:text-blue-900 text-sm">
									View
								</a>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>
