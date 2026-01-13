<script lang="ts">
	// In a full implementation, cart state would be stored in cookies/session
	// and managed via server actions. This is a placeholder for the MVP.

	let cartItems = $state<
		{ variantId: number; productName: string; variantName: string; price: number; quantity: number }[]
	>([]);

	const subtotal = $derived(cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0));
</script>

<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<h1 class="text-2xl font-bold mb-8">Shopping Cart</h1>

	{#if cartItems.length === 0}
		<div class="text-center py-12">
			<svg
				class="w-16 h-16 mx-auto text-gray-400 mb-4"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
				/>
			</svg>
			<p class="text-gray-500 mb-4">Your cart is empty</p>
			<a
				href="/products"
				class="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
			>
				Continue Shopping
			</a>
		</div>
	{:else}
		<div class="bg-white rounded-lg shadow divide-y">
			{#each cartItems as item}
				<div class="p-4 flex items-center justify-between">
					<div>
						<p class="font-medium">{item.productName}</p>
						<p class="text-sm text-gray-500">{item.variantName}</p>
					</div>
					<div class="text-right">
						<p class="font-medium">{(item.price / 100).toFixed(2)} EUR</p>
						<p class="text-sm text-gray-500">Qty: {item.quantity}</p>
					</div>
				</div>
			{/each}
		</div>

		<div class="mt-6 bg-white rounded-lg shadow p-6">
			<div class="flex justify-between mb-4">
				<span class="font-semibold">Subtotal</span>
				<span class="font-semibold">{(subtotal / 100).toFixed(2)} EUR</span>
			</div>
			<a
				href="/checkout"
				class="block w-full bg-blue-600 text-white text-center px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
			>
				Proceed to Checkout
			</a>
		</div>
	{/if}
</div>
