<script lang="ts">
	import { updateCartQuantity, removeCartItem, applyPromoCode } from '$lib/remote/cart.remote';
	import { formatPrice } from '$lib/utils/money';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let cart = $state(data.cart);
	let promoCode = $state('');
	let isUpdating = $state(false);
	let message = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	const lines = $derived(cart?.lines ?? []);
	const subtotal = $derived(cart?.subtotal ?? 0);
	const discount = $derived(cart?.discount ?? 0);
	const total = $derived(cart?.total ?? 0);

	async function handleQuantityChange(lineId: number, newQuantity: number) {
		if (!cart) return;
		isUpdating = true;
		message = null;
		try {
			cart = await updateCartQuantity({ orderId: cart.id, lineId, quantity: newQuantity });
		} catch {
			message = { type: 'error', text: 'Failed to update quantity' };
		} finally {
			isUpdating = false;
		}
	}

	async function handleRemove(lineId: number) {
		if (!cart) return;
		isUpdating = true;
		message = null;
		try {
			cart = await removeCartItem({ orderId: cart.id, lineId });
		} catch {
			message = { type: 'error', text: 'Failed to remove item' };
		} finally {
			isUpdating = false;
		}
	}

	async function handleApplyPromo() {
		if (!cart || !promoCode.trim()) return;
		isUpdating = true;
		message = null;
		try {
			const result = await applyPromoCode({ orderId: cart.id, code: promoCode });
			if (result.success && result.cart) {
				cart = result.cart;
				message = { type: 'success', text: result.message };
				promoCode = '';
			} else {
				message = { type: 'error', text: result.message };
			}
		} catch {
			message = { type: 'error', text: 'Failed to apply promotion' };
		} finally {
			isUpdating = false;
		}
	}
</script>

<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<h1 class="text-2xl font-bold mb-8">Shopping Cart</h1>

	{#if message}
		<div
			class="mb-4 p-4 rounded-lg border {message.type === 'error'
				? 'bg-red-50 border-red-200 text-red-700'
				: 'bg-green-50 border-green-200 text-green-700'}"
		>
			{message.text}
		</div>
	{/if}

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
							<button
								onclick={() => handleQuantityChange(line.id, line.quantity - 1)}
								class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
								disabled={isUpdating}
								aria-label="Decrease quantity"
							>
								-
							</button>
							<span class="w-8 text-center">{line.quantity}</span>
							<button
								onclick={() => handleQuantityChange(line.id, line.quantity + 1)}
								class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
								disabled={isUpdating}
								aria-label="Increase quantity"
							>
								+
							</button>
						</div>

						<!-- Line total -->
						<div class="w-24 text-right">
							<p class="font-medium">{formatPrice(line.lineTotal)}</p>
							<p class="text-xs text-gray-500">{formatPrice(line.unitPrice)} each</p>
						</div>

						<!-- Remove button -->
						<button
							onclick={() => handleRemove(line.id)}
							class="text-red-500 hover:text-red-700 disabled:opacity-50"
							disabled={isUpdating}
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
					</div>
				</div>
			{/each}
		</div>

		<!-- Promotion Code -->
		<div class="mt-6 bg-white rounded-lg shadow p-6">
			<div class="flex gap-2">
				<label for="promo-code" class="sr-only">Promotion code</label>
				<input
					id="promo-code"
					type="text"
					bind:value={promoCode}
					placeholder="Promotion code"
					class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					disabled={isUpdating}
				/>
				<button
					onclick={handleApplyPromo}
					class="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium disabled:opacity-50"
					disabled={isUpdating || !promoCode.trim()}
				>
					Apply
				</button>
			</div>
		</div>

		<!-- Order Summary -->
		<div class="mt-6 bg-white rounded-lg shadow p-6">
			<h2 class="text-lg font-semibold mb-4">Order Summary</h2>

			<div class="space-y-2 text-sm">
				<div class="flex justify-between">
					<span class="text-gray-600">Subtotal</span>
					<span>{formatPrice(subtotal)}</span>
				</div>

				{#if discount > 0}
					<div class="flex justify-between text-green-600">
						<span>Discount</span>
						<span>-{formatPrice(discount)}</span>
					</div>
				{/if}

				<div class="flex justify-between pt-2 border-t font-semibold text-base">
					<span>Total</span>
					<span>{formatPrice(total)}</span>
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
