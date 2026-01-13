<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function formatDate(date: Date | string): string {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function formatPrice(cents: number): string {
		return (cents / 100).toFixed(2);
	}

	function getStateColor(state: string): string {
		switch (state) {
			case 'delivered':
				return 'bg-green-100 text-green-800';
			case 'shipped':
				return 'bg-blue-100 text-blue-800';
			case 'paid':
				return 'bg-indigo-100 text-indigo-800';
			case 'cancelled':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}
</script>

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<div class="mb-8">
		<h1 class="text-2xl font-bold">My Account</h1>
		<p class="text-gray-600 mt-1">Manage your account settings and view your orders</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-4 gap-8">
		<!-- Sidebar -->
		<aside class="md:col-span-1">
			<nav class="space-y-2">
				<a
					href="/account"
					class="block px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50"
				>
					Profile
				</a>
				<a
					href="/account/orders"
					class="block px-4 py-2 rounded-lg bg-blue-50 text-blue-600 font-medium"
				>
					Order History
				</a>
			</nav>
		</aside>

		<!-- Main Content -->
		<main class="md:col-span-3">
			<div class="bg-white rounded-lg shadow">
				<div class="p-6 border-b">
					<h2 class="text-lg font-semibold">Order History</h2>
				</div>

				{#if data.orders.length === 0}
					<div class="p-6 text-center text-gray-500">
						<p>You haven't placed any orders yet.</p>
						<a href="/products" class="text-blue-600 hover:underline mt-2 inline-block">
							Start shopping
						</a>
					</div>
				{:else}
					<div class="divide-y">
						{#each data.orders as order}
							<div class="p-6">
								<div class="flex items-center justify-between mb-4">
									<div>
										<p class="font-medium">Order #{order.code}</p>
										<p class="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
									</div>
									<span class="px-3 py-1 rounded-full text-sm font-medium {getStateColor(order.state)}">
										{order.state}
									</span>
								</div>

								<div class="flex justify-between items-center">
									<p class="text-gray-600">
										Total: <span class="font-medium text-gray-900">${formatPrice(order.total)}</span>
									</p>
									<a
										href="/account/orders/{order.id}"
										class="text-blue-600 hover:underline text-sm"
									>
										View details
									</a>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</main>
	</div>
</div>
