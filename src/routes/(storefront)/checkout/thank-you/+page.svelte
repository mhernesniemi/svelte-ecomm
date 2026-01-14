<script lang="ts">
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	function formatPrice(cents: number): string {
		return (cents / 100).toFixed(2);
	}
</script>

<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
	<div class="text-center mb-8">
		<div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
			<svg
				class="w-8 h-8 text-green-600"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M5 13l4 4L19 7"
				/>
			</svg>
		</div>
		<h1 class="text-3xl font-bold mb-2">Thank You for Your Order!</h1>
		<p class="text-gray-600">
			Your order <span class="font-semibold text-gray-900">{data.order.code}</span> has been
			placed successfully.
		</p>
	</div>

	<div class="bg-white rounded-lg shadow-lg p-8 mb-6">
		<h2 class="text-xl font-semibold mb-6">Order Summary</h2>

		<div class="space-y-4 mb-6">
			{#each data.order.lines as line}
				<div class="flex justify-between items-start pb-4 border-b border-gray-200 last:border-0">
					<div>
						<p class="font-medium">{line.productName}</p>
						{#if line.variantName}
							<p class="text-sm text-gray-500">{line.variantName}</p>
						{/if}
						<p class="text-sm text-gray-500">Quantity: {line.quantity}</p>
					</div>
					<p class="font-medium">{formatPrice(line.lineTotal)} EUR</p>
				</div>
			{/each}
		</div>

		<div class="space-y-2 pt-4 border-t">
			<div class="flex justify-between text-sm">
				<span class="text-gray-600">Subtotal</span>
				<span class="font-medium">{formatPrice(data.order.subtotal)} EUR</span>
			</div>

			{#if data.order.discount > 0}
				<div class="flex justify-between text-sm">
					<span class="text-gray-600">Discount</span>
					<span class="font-medium text-green-600">
						-{formatPrice(data.order.discount)} EUR
					</span>
				</div>
			{/if}

			<div class="flex justify-between text-sm">
				<span class="text-gray-600">Shipping</span>
				<span class="font-medium">{formatPrice(data.order.shipping)} EUR</span>
			</div>

			<div class="flex justify-between text-lg font-bold pt-2 border-t">
				<span>Total</span>
				<span>{formatPrice(data.order.total)} EUR</span>
			</div>
		</div>
	</div>

	{#if data.order.shippingFullName}
		<div class="bg-white rounded-lg shadow p-6 mb-6">
			<h2 class="text-lg font-semibold mb-4">Shipping Address</h2>
			<address class="not-italic text-gray-600">
				<p class="font-medium text-gray-900">{data.order.shippingFullName}</p>
				<p>{data.order.shippingStreetLine1}</p>
				{#if data.order.shippingStreetLine2}
					<p>{data.order.shippingStreetLine2}</p>
				{/if}
				<p>
					{data.order.shippingPostalCode} {data.order.shippingCity}
				</p>
				<p>{data.order.shippingCountry}</p>
			</address>
		</div>
	{/if}

	<div class="text-center space-y-4">
		<p class="text-gray-600">
			We've sent a confirmation email with your order details. You'll receive another email when
			your order ships.
		</p>
		<div class="flex gap-4 justify-center">
			<a
				href="/products"
				class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
			>
				Continue Shopping
			</a>
			{#if data.order.customerId}
				<a
					href="/account/orders"
					class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
				>
					View My Orders
				</a>
			{/if}
		</div>
	</div>
</div>
