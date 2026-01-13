<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div>
	<h1 class="text-2xl font-bold mb-8">Dashboard</h1>

	<!-- Stats Grid -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
		<div class="bg-white rounded-lg shadow p-6">
			<h3 class="text-sm font-medium text-gray-500">Total Products</h3>
			<p class="text-3xl font-bold text-gray-900">{data.stats.totalProducts}</p>
		</div>
		<div class="bg-white rounded-lg shadow p-6">
			<h3 class="text-sm font-medium text-gray-500">Total Orders</h3>
			<p class="text-3xl font-bold text-gray-900">{data.stats.totalOrders}</p>
		</div>
		<div class="bg-white rounded-lg shadow p-6">
			<h3 class="text-sm font-medium text-gray-500">Total Customers</h3>
			<p class="text-3xl font-bold text-gray-900">{data.stats.totalCustomers}</p>
		</div>
	</div>

	<!-- Recent Orders -->
	<div class="bg-white rounded-lg shadow">
		<div class="px-6 py-4 border-b">
			<h2 class="text-lg font-semibold">Recent Orders</h2>
		</div>
		<div class="divide-y">
			{#if data.recentOrders.length === 0}
				<div class="p-6 text-center text-gray-500">No orders yet</div>
			{:else}
				{#each data.recentOrders as order}
					<div class="px-6 py-4 flex items-center justify-between">
						<div>
							<p class="font-medium">{order.code}</p>
							<p class="text-sm text-gray-500">
								{new Date(order.createdAt).toLocaleDateString()}
							</p>
						</div>
						<div class="text-right">
							<p class="font-medium">{(order.total / 100).toFixed(2)} {order.currencyCode}</p>
							<span
								class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
								{order.state === 'paid'
									? 'bg-green-100 text-green-800'
									: order.state === 'created'
										? 'bg-gray-100 text-gray-800'
										: order.state === 'shipped'
											? 'bg-blue-100 text-blue-800'
											: 'bg-yellow-100 text-yellow-800'}"
							>
								{order.state}
							</span>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>

	<!-- Quick Actions -->
	<div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
		<a
			href="/admin/products/new"
			class="bg-blue-600 text-white rounded-lg p-4 text-center hover:bg-blue-700 transition-colors"
		>
			Add New Product
		</a>
		<a
			href="/admin/promotions"
			class="bg-gray-600 text-white rounded-lg p-4 text-center hover:bg-gray-700 transition-colors"
		>
			Manage Promotions
		</a>
	</div>
</div>
