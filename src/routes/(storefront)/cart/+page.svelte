<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const cart = $derived(data.cart);
	const lines = $derived(cart?.lines ?? []);
	const subtotal = $derived(cart?.subtotal ?? 0);
	const discount = $derived(cart?.discount ?? 0);
	const total = $derived(cart?.total ?? 0);

	function formatPrice(cents: number): string {
		return (cents / 100).toFixed(2);
	}
</script>

<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<h1 class="text-2xl font-bold mb-8">Shopping Cart</h1>

	{#if lines.length === 0}
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
			{#each lines as line (line.id)}
				<div class="p-4 flex items-center justify-between gap-4">
					<div class="flex-1">
						<p class="font-medium">{line.productName}</p>
						{#if line.variantName}
							<p class="text-sm text-gray-500">{line.variantName}</p>
						{/if}
						<p class="text-sm text-gray-500">SKU: {line.sku}</p>
					</div>

					<div class="flex items-center gap-4">
						<!-- Quantity controls -->
						<div class="flex items-center gap-2">
							<form method="POST" action="?/updateQuantity" use:enhance>
								<input type="hidden" name="lineId" value={line.id} />
								<input type="hidden" name="quantity" value={line.quantity - 1} />
								<button
									type="submit"
									class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
									aria-label="Decrease quantity"
								>
									-
								</button>
							</form>
							<span class="w-8 text-center">{line.quantity}</span>
							<form method="POST" action="?/updateQuantity" use:enhance>
								<input type="hidden" name="lineId" value={line.id} />
								<input type="hidden" name="quantity" value={line.quantity + 1} />
								<button
									type="submit"
									class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
									aria-label="Increase quantity"
								>
									+
								</button>
							</form>
						</div>

						<!-- Line total -->
						<div class="w-24 text-right">
							<p class="font-medium">{formatPrice(line.lineTotal)} EUR</p>
							<p class="text-xs text-gray-500">{formatPrice(line.unitPrice)} each</p>
						</div>

						<!-- Remove button -->
						<form method="POST" action="?/removeLine" use:enhance>
							<input type="hidden" name="lineId" value={line.id} />
							<button
								type="submit"
								class="text-red-500 hover:text-red-700"
								aria-label="Remove item"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
									/>
								</svg>
							</button>
						</form>
					</div>
				</div>
			{/each}
		</div>

		<!-- Promotion Code -->
		<div class="mt-6 bg-white rounded-lg shadow p-6">
			<form method="POST" action="?/applyPromotion" use:enhance class="flex gap-2">
				<label for="promo-code" class="sr-only">Promotion code</label>
				<input
					id="promo-code"
					type="text"
					name="code"
					placeholder="Promotion code"
					class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				/>
				<button
					type="submit"
					class="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
				>
					Apply
				</button>
			</form>
		</div>

		<!-- Order Summary -->
		<div class="mt-6 bg-white rounded-lg shadow p-6">
			<h2 class="text-lg font-semibold mb-4">Order Summary</h2>

			<div class="space-y-2 text-sm">
				<div class="flex justify-between">
					<span class="text-gray-600">Subtotal</span>
					<span>{formatPrice(subtotal)} EUR</span>
				</div>

				{#if discount > 0}
					<div class="flex justify-between text-green-600">
						<span>Discount</span>
						<span>-{formatPrice(discount)} EUR</span>
					</div>
				{/if}

				<div class="flex justify-between pt-2 border-t font-semibold text-base">
					<span>Total</span>
					<span>{formatPrice(total)} EUR</span>
				</div>
			</div>

			<a
				href="/checkout"
				class="mt-6 block w-full bg-blue-600 text-white text-center px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
			>
				Proceed to Checkout
			</a>

			<a href="/products" class="mt-3 block text-center text-blue-600 hover:underline">
				Continue Shopping
			</a>
		</div>
	{/if}
</div>
