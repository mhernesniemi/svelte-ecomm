<script lang="ts">
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const transitions: Record<string, string[]> = {
		created: ['payment_pending', 'cancelled'],
		payment_pending: ['paid', 'cancelled'],
		paid: ['shipped', 'cancelled'],
		shipped: ['delivered'],
		delivered: [],
		cancelled: []
	};

	const nextStates = $derived(transitions[data.order.state] ?? []);
</script>

<div>
	<div class="mb-8">
		<a href="/admin/orders" class="text-blue-600 hover:underline text-sm">&larr; Back to Orders</a>
		<h1 class="text-2xl font-bold mt-2">Order {data.order.code}</h1>
	</div>

	{#if form?.success}
		<div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
			Order updated successfully
		</div>
	{/if}

	{#if form?.error}
		<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
			{form.error}
		</div>
	{/if}

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<!-- Order Details -->
		<div class="lg:col-span-2 space-y-6">
			<!-- Status -->
			<div class="bg-white rounded-lg shadow p-6">
				<h2 class="font-semibold mb-4">Order Status</h2>
				<div class="flex items-center gap-4">
					<span
						class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize
						{data.order.state === 'paid'
							? 'bg-green-100 text-green-800'
							: data.order.state === 'cancelled'
								? 'bg-red-100 text-red-800'
								: 'bg-gray-100 text-gray-800'}"
					>
						{data.order.state.replace('_', ' ')}
					</span>

					{#if nextStates.length > 0}
						<div class="flex gap-2">
							{#each nextStates as state}
								<form method="POST" action="?/transition" class="inline">
									<input type="hidden" name="state" value={state} />
									<button
										type="submit"
										class="px-3 py-1 text-sm border rounded hover:bg-gray-50 capitalize"
									>
										Mark as {state.replace('_', ' ')}
									</button>
								</form>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- Line Items -->
			<div class="bg-white rounded-lg shadow">
				<div class="px-6 py-4 border-b">
					<h2 class="font-semibold">Items</h2>
				</div>
				<div class="divide-y">
					{#each data.order.lines as line}
						<div class="px-6 py-4 flex justify-between items-center">
							<div>
								<p class="font-medium">{line.productName}</p>
								{#if line.variantName}
									<p class="text-sm text-gray-500">{line.variantName}</p>
								{/if}
								<p class="text-sm text-gray-500">SKU: {line.sku}</p>
							</div>
							<div class="text-right">
								<p class="text-sm text-gray-500">
									{(line.unitPrice / 100).toFixed(2)} x {line.quantity}
								</p>
								<p class="font-medium">{(line.lineTotal / 100).toFixed(2)} EUR</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Order Summary -->
		<div class="space-y-6">
			<div class="bg-white rounded-lg shadow p-6">
				<h2 class="font-semibold mb-4">Summary</h2>
				<dl class="space-y-2">
					<div class="flex justify-between">
						<dt class="text-gray-500">Subtotal</dt>
						<dd>{(data.order.subtotal / 100).toFixed(2)} EUR</dd>
					</div>
					<div class="flex justify-between">
						<dt class="text-gray-500">Shipping</dt>
						<dd>{(data.order.shipping / 100).toFixed(2)} EUR</dd>
					</div>
					{#if data.order.discount > 0}
						<div class="flex justify-between text-green-600">
							<dt>Discount</dt>
							<dd>-{(data.order.discount / 100).toFixed(2)} EUR</dd>
						</div>
					{/if}
					<div class="flex justify-between font-bold border-t pt-2">
						<dt>Total</dt>
						<dd>{(data.order.total / 100).toFixed(2)} {data.order.currencyCode}</dd>
					</div>
				</dl>
			</div>

			{#if data.order.shippingFullName}
				<div class="bg-white rounded-lg shadow p-6">
					<h2 class="font-semibold mb-4">Shipping Address</h2>
					<address class="not-italic text-sm text-gray-600">
						<p class="font-medium text-gray-900">{data.order.shippingFullName}</p>
						<p>{data.order.shippingStreetLine1}</p>
						{#if data.order.shippingStreetLine2}
							<p>{data.order.shippingStreetLine2}</p>
						{/if}
						<p>{data.order.shippingPostalCode} {data.order.shippingCity}</p>
						<p>{data.order.shippingCountry}</p>
					</address>
				</div>
			{/if}

			{#if data.orderShipping && data.shippingMethod}
				<div class="bg-white rounded-lg shadow p-6">
					<h2 class="font-semibold mb-4">Shipping Information</h2>
					<dl class="space-y-2 text-sm">
						<div class="flex justify-between">
							<dt class="text-gray-500">Method</dt>
							<dd class="font-medium">{data.shippingMethod.name}</dd>
						</div>
						<div class="flex justify-between">
							<dt class="text-gray-500">Status</dt>
							<dd>
								<span
									class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize
									{data.orderShipping.status === 'delivered'
										? 'bg-green-100 text-green-800'
										: data.orderShipping.status === 'shipped' || data.orderShipping.status === 'in_transit'
											? 'bg-blue-100 text-blue-800'
											: 'bg-gray-100 text-gray-800'}"
								>
									{data.orderShipping.status.replace('_', ' ')}
								</span>
							</dd>
						</div>
						{#if data.orderShipping.trackingNumber}
							<div class="flex justify-between">
								<dt class="text-gray-500">Tracking</dt>
								<dd class="font-mono text-xs">{data.orderShipping.trackingNumber}</dd>
							</div>
						{/if}
						<div class="flex justify-between">
							<dt class="text-gray-500">Cost</dt>
							<dd>{(data.orderShipping.price / 100).toFixed(2)} EUR</dd>
						</div>
					</dl>

					{#if data.orderShipping.trackingNumber}
						<form method="POST" action="?/trackShipment" class="mt-4">
							<button
								type="submit"
								class="w-full px-3 py-2 text-sm border rounded hover:bg-gray-50"
							>
								Refresh Tracking Status
							</button>
						</form>
					{/if}

					{#if data.order.state === 'paid' && data.orderShipping.status === 'pending'}
						<form method="POST" action="?/updateShippingStatus" class="mt-4">
							<input type="hidden" name="status" value="shipped" />
							<button
								type="submit"
								class="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
							>
								Mark as Shipped
							</button>
						</form>
					{/if}
				</div>
			{/if}

			<div class="bg-white rounded-lg shadow p-6">
				<h2 class="font-semibold mb-4">Details</h2>
				<dl class="space-y-2 text-sm">
					<div class="flex justify-between">
						<dt class="text-gray-500">Order ID</dt>
						<dd>{data.order.id}</dd>
					</div>
					<div class="flex justify-between">
						<dt class="text-gray-500">Created</dt>
						<dd>{new Date(data.order.createdAt).toLocaleString()}</dd>
					</div>
					{#if data.order.orderPlacedAt}
						<div class="flex justify-between">
							<dt class="text-gray-500">Placed</dt>
							<dd>{new Date(data.order.orderPlacedAt).toLocaleString()}</dd>
						</div>
					{/if}
				</dl>
			</div>
		</div>
	</div>
</div>
