<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types.js';

	let { data, form }: { data: PageData; form: any } = $props();

	let selectedShippingRate = $state<(typeof data.shippingRates)[0] | null>(null);
	let selectedPaymentMethod = $state<NonNullable<typeof data.paymentMethods>[number] | null>(null);
	let isProcessingPayment = $state(false);
	let isCompletingOrder = $state(false);

	// Combine form and data for reactive state
	// After form submission, form object contains the updated data
	const currentOrderShipping = $derived(form?.orderShipping ?? data.orderShipping);
	const currentPaymentMethods = $derived(form?.paymentMethods ?? data.paymentMethods);
	const currentPaymentInfo = $derived(form?.paymentInfo ?? data.paymentInfo);
	const currentCart = $derived(form?.cart ?? data.cart);
	const currentShippingRates = $derived(form?.shippingRates ?? data.shippingRates);

	// Initialize selected shipping rate if already set
	$effect(() => {
		if (currentOrderShipping && currentShippingRates.length > 0 && !selectedShippingRate) {
			const rate = currentShippingRates.find(
				(r: (typeof currentShippingRates)[number]) =>
					r.methodId === currentOrderShipping?.shippingMethodId
			);
			if (rate) {
				selectedShippingRate = rate;
			}
		}
	});

	let addressFormData = $state({
		fullName: data.cart?.shippingFullName ?? '',
		streetLine1: data.cart?.shippingStreetLine1 ?? '',
		streetLine2: data.cart?.shippingStreetLine2 ?? '',
		city: data.cart?.shippingCity ?? '',
		postalCode: data.cart?.shippingPostalCode ?? '',
		country: data.cart?.shippingCountry ?? 'FI'
	});

	function formatPrice(cents: number): string {
		return (cents / 100).toFixed(2);
	}

	function selectShippingRate(rate: (typeof data.shippingRates)[0]) {
		selectedShippingRate = rate;
	}
</script>

<div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
	<h1 class="mb-8 text-3xl font-bold">Checkout</h1>

	{#if !currentCart || currentCart.lines.length === 0}
		<div class="rounded-lg bg-white p-8 text-center shadow">
			<p class="mb-4 text-gray-500">Your cart is empty</p>
			<a href="/products" class="text-blue-600 underline hover:text-blue-700">Browse products</a>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
			<!-- Main Content -->
			<div class="space-y-6 lg:col-span-2">
				<!-- Shipping Address -->
				<div class="rounded-lg bg-white p-6 shadow">
					<h2 class="mb-4 text-xl font-semibold">Shipping Address</h2>

					{#if form?.error}
						<div class="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
							{form.error}
						</div>
					{/if}

					<form method="POST" action="?/setShippingAddress" use:enhance>
						<div class="space-y-4">
							<div>
								<label for="fullName" class="mb-1 block text-sm font-medium text-gray-700">
									Full Name <span class="text-red-500">*</span>
								</label>
								<input
									type="text"
									id="fullName"
									name="fullName"
									bind:value={addressFormData.fullName}
									required
									class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
								/>
							</div>

							<div>
								<label for="streetLine1" class="mb-1 block text-sm font-medium text-gray-700">
									Street Address <span class="text-red-500">*</span>
								</label>
								<input
									type="text"
									id="streetLine1"
									name="streetLine1"
									bind:value={addressFormData.streetLine1}
									required
									class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
								/>
							</div>

							<div>
								<label for="streetLine2" class="mb-1 block text-sm font-medium text-gray-700">
									Apartment, suite, etc. (optional)
								</label>
								<input
									type="text"
									id="streetLine2"
									name="streetLine2"
									bind:value={addressFormData.streetLine2}
									class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
								/>
							</div>

							<div class="grid grid-cols-2 gap-4">
								<div>
									<label for="postalCode" class="mb-1 block text-sm font-medium text-gray-700">
										Postal Code <span class="text-red-500">*</span>
									</label>
									<input
										type="text"
										id="postalCode"
										name="postalCode"
										bind:value={addressFormData.postalCode}
										required
										class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
									/>
								</div>

								<div>
									<label for="city" class="mb-1 block text-sm font-medium text-gray-700">
										City <span class="text-red-500">*</span>
									</label>
									<input
										type="text"
										id="city"
										name="city"
										bind:value={addressFormData.city}
										required
										class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
									/>
								</div>
							</div>

							<div>
								<label for="country" class="mb-1 block text-sm font-medium text-gray-700">
									Country <span class="text-red-500">*</span>
								</label>
								<select
									id="country"
									name="country"
									bind:value={addressFormData.country}
									required
									class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
								>
									<option value="FI">Finland</option>
									<option value="SE">Sweden</option>
									<option value="NO">Norway</option>
									<option value="DK">Denmark</option>
								</select>
							</div>

							<button
								type="submit"
								class="w-full rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
							>
								Save Address
							</button>
						</div>
					</form>
				</div>

				<!-- Shipping Method Selection -->
				{#if currentCart?.shippingPostalCode && currentShippingRates.length > 0}
					<div class="rounded-lg bg-white p-6 shadow">
						<h2 class="mb-4 text-xl font-semibold">Shipping Method</h2>

						<div class="space-y-3">
							{#each currentShippingRates as rate}
								<label
									class="flex cursor-pointer items-start rounded-lg border p-4 transition-colors hover:bg-gray-50 {selectedShippingRate?.id ===
									rate.id
										? 'border-blue-500 bg-blue-50'
										: 'border-gray-300'}"
								>
									<input
										type="radio"
										name="shippingMethod"
										value={rate.id}
										checked={selectedShippingRate?.id === rate.id}
										onchange={() => selectShippingRate(rate)}
										class="mt-1 mr-3"
									/>
									<div class="flex-1">
										<div class="flex items-start justify-between">
											<div>
												<p class="font-medium">{rate.name}</p>
												{#if rate.description}
													<p class="mt-1 text-sm text-gray-500">{rate.description}</p>
												{/if}
												{#if rate.estimatedDeliveryDays}
													<p class="mt-1 text-sm text-gray-500">
														Estimated delivery: {rate.estimatedDeliveryDays} business day{rate.estimatedDeliveryDays !==
														1
															? 's'
															: ''}
													</p>
												{/if}
											</div>
											<p class="ml-4 font-semibold">{formatPrice(rate.price)} EUR</p>
										</div>
									</div>
								</label>
							{/each}
						</div>

						{#if selectedShippingRate && !currentOrderShipping}
							<form method="POST" action="?/setShippingMethod" use:enhance class="mt-4">
								<input type="hidden" name="methodId" value={selectedShippingRate.methodId} />
								<input type="hidden" name="rateId" value={selectedShippingRate.id} />
								<input type="hidden" name="price" value={selectedShippingRate.price} />
								<button
									type="submit"
									class="w-full rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
								>
									Select Shipping Method
								</button>
							</form>
						{:else if currentOrderShipping}
							<div class="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
								<p class="text-sm font-medium text-green-800">
									Shipping method selected: {currentShippingRates.find(
										(r: (typeof currentShippingRates)[number]) =>
											r.methodId === currentOrderShipping?.shippingMethodId
									)?.name || 'Selected'}
								</p>
							</div>
						{/if}
					</div>
				{:else if currentCart?.shippingPostalCode}
					<div class="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
						<p class="text-sm text-yellow-800">
							No shipping methods available for this address. Please check your address.
						</p>
					</div>
				{:else}
					<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
						<p class="text-sm text-gray-600">
							Please enter your shipping address to see available shipping methods.
						</p>
					</div>
				{/if}

				<!-- Payment Method Selection -->
				{#if currentCart?.shippingPostalCode && currentOrderShipping && currentPaymentMethods?.length > 0}
					<div class="rounded-lg bg-white p-6 shadow">
						<h2 class="mb-4 text-xl font-semibold">Payment Method</h2>

						<div class="space-y-3">
							{#each currentPaymentMethods as method}
								<label
									class="flex cursor-pointer items-start rounded-lg border p-4 transition-colors hover:bg-gray-50 {selectedPaymentMethod?.id ===
									method.id
										? 'border-blue-500 bg-blue-50'
										: 'border-gray-300'}"
								>
									<input
										type="radio"
										name="paymentMethod"
										value={method.id}
										checked={selectedPaymentMethod?.id === method.id}
										onchange={() => (selectedPaymentMethod = method)}
										class="mt-1 mr-3"
									/>
									<div class="flex-1">
										<p class="font-medium">{method.name}</p>
										{#if method.description}
											<p class="mt-1 text-sm text-gray-500">{method.description}</p>
										{/if}
									</div>
								</label>
							{/each}
						</div>

						{#if selectedPaymentMethod && !currentPaymentInfo}
							<form
								method="POST"
								action="?/createPayment"
								use:enhance={() => {
									isProcessingPayment = true;
									return async ({ update }) => {
										isProcessingPayment = false;
										await update();
									};
								}}
								class="mt-4"
							>
								<input type="hidden" name="paymentMethodId" value={selectedPaymentMethod.id} />
								<button
									type="submit"
									disabled={isProcessingPayment}
									class="w-full rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
								>
									{isProcessingPayment ? 'Processing...' : 'Create Payment'}
								</button>
							</form>
						{:else if currentPaymentInfo}
							<div class="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
								<p class="text-sm font-medium text-green-800">Payment created successfully</p>
							</div>
						{/if}
					</div>
				{:else if currentCart?.shippingPostalCode && !currentOrderShipping}
					<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
						<p class="text-sm text-gray-600">
							Please select a shipping method first to see payment options.
						</p>
					</div>
				{/if}
			</div>

			<!-- Order Summary -->
			<div class="lg:col-span-1">
				<div class="sticky top-4 rounded-lg bg-white p-6 shadow">
					<h2 class="mb-4 text-xl font-semibold">Order Summary</h2>

					<div class="mb-4 space-y-4">
						{#each currentCart.lines as line}
							<div class="flex justify-between text-sm">
								<div>
									<p class="font-medium">{line.productName}</p>
									{#if line.variantName}
										<p class="text-xs text-gray-500">{line.variantName}</p>
									{/if}
									<p class="text-xs text-gray-500">Qty: {line.quantity}</p>
								</div>
								<p class="font-medium">{formatPrice(line.lineTotal)} EUR</p>
							</div>
						{/each}
					</div>

					<div class="space-y-2 border-t pt-4">
						<div class="flex justify-between text-sm">
							<span class="text-gray-600">Subtotal</span>
							<span class="font-medium">{formatPrice(currentCart.subtotal)} EUR</span>
						</div>

						{#if currentCart.discount > 0}
							<div class="flex justify-between text-sm">
								<span class="text-gray-600">Discount</span>
								<span class="font-medium text-green-600">
									-{formatPrice(currentCart.discount)} EUR
								</span>
							</div>
						{/if}

						<div class="flex justify-between text-sm">
							<span class="text-gray-600">Shipping</span>
							<span class="font-medium">{formatPrice(currentCart.shipping)} EUR</span>
						</div>

						<div class="flex justify-between border-t pt-2 text-lg font-bold">
							<span>Total</span>
							<span>{formatPrice(currentCart.total)} EUR</span>
						</div>
					</div>

					{#if currentPaymentInfo}
						<div class="mt-6 border-t pt-6">
							<div class="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
								<p class="mb-2 font-medium text-green-800">Payment Ready</p>
								<p class="text-sm text-green-700">
									Transaction ID: {currentPaymentInfo.providerTransactionId}
								</p>
							</div>
							<form
								method="POST"
								action="?/completeOrder"
								use:enhance={() => {
									isCompletingOrder = true;
									return async ({ update }) => {
										isCompletingOrder = false;
										await update();
									};
								}}
							>
								<button
									type="submit"
									disabled={isCompletingOrder}
									class="w-full rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
								>
									{isCompletingOrder ? 'Completing Order...' : 'Complete Order'}
								</button>
							</form>
						</div>
					{:else}
						<div class="mt-6 border-t pt-6">
							<p class="mb-4 text-sm text-gray-500">
								{#if !currentCart?.shippingPostalCode}
									Enter shipping address to proceed.
								{:else if !currentOrderShipping}
									Select shipping method to proceed.
								{:else}
									Select payment method to proceed.
								{/if}
							</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
