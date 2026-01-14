<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types.js';

	let { data, form }: { data: PageData; form: any } = $props();

	let selectedShippingRate: (typeof data.shippingRates)[0] | null = null;
	let selectedPaymentMethod: (typeof data.paymentMethods)[0] | null = null;
	let addressFormData = {
		fullName: data.cart?.shippingFullName || '',
		streetLine1: data.cart?.shippingStreetLine1 || '',
		streetLine2: data.cart?.shippingStreetLine2 || '',
		city: data.cart?.shippingCity || '',
		postalCode: data.cart?.shippingPostalCode || '',
		country: data.cart?.shippingCountry || 'FI'
	};

	function formatPrice(cents: number): string {
		return (cents / 100).toFixed(2);
	}

	function selectShippingRate(rate: (typeof data.shippingRates)[0]) {
		selectedShippingRate = rate;
	}
</script>

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<h1 class="text-3xl font-bold mb-8">Checkout</h1>

	{#if !data.cart || data.cart.lines.length === 0}
		<div class="bg-white rounded-lg shadow p-8 text-center">
			<p class="text-gray-500 mb-4">Your cart is empty</p>
			<a href="/products" class="text-blue-600 hover:text-blue-700 underline">Browse products</a>
		</div>
	{:else}
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Main Content -->
			<div class="lg:col-span-2 space-y-6">
				<!-- Shipping Address -->
				<div class="bg-white rounded-lg shadow p-6">
					<h2 class="text-xl font-semibold mb-4">Shipping Address</h2>

					{#if form?.error}
						<div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
							{form.error}
						</div>
					{/if}

					<form method="POST" action="?/setShippingAddress" use:enhance>
						<div class="space-y-4">
							<div>
								<label for="fullName" class="block text-sm font-medium text-gray-700 mb-1">
									Full Name <span class="text-red-500">*</span>
								</label>
								<input
									type="text"
									id="fullName"
									name="fullName"
									bind:value={addressFormData.fullName}
									required
									class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
								/>
							</div>

							<div>
								<label for="streetLine1" class="block text-sm font-medium text-gray-700 mb-1">
									Street Address <span class="text-red-500">*</span>
								</label>
								<input
									type="text"
									id="streetLine1"
									name="streetLine1"
									bind:value={addressFormData.streetLine1}
									required
									class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
								/>
							</div>

							<div>
								<label for="streetLine2" class="block text-sm font-medium text-gray-700 mb-1">
									Apartment, suite, etc. (optional)
								</label>
								<input
									type="text"
									id="streetLine2"
									name="streetLine2"
									bind:value={addressFormData.streetLine2}
									class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
								/>
							</div>

							<div class="grid grid-cols-2 gap-4">
								<div>
									<label for="postalCode" class="block text-sm font-medium text-gray-700 mb-1">
										Postal Code <span class="text-red-500">*</span>
									</label>
									<input
										type="text"
										id="postalCode"
										name="postalCode"
										bind:value={addressFormData.postalCode}
										required
										class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
									/>
								</div>

								<div>
									<label for="city" class="block text-sm font-medium text-gray-700 mb-1">
										City <span class="text-red-500">*</span>
									</label>
									<input
										type="text"
										id="city"
										name="city"
										bind:value={addressFormData.city}
										required
										class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
									/>
								</div>
							</div>

							<div>
								<label for="country" class="block text-sm font-medium text-gray-700 mb-1">
									Country <span class="text-red-500">*</span>
								</label>
								<select
									id="country"
									name="country"
									bind:value={addressFormData.country}
									required
									class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
								>
									<option value="FI">Finland</option>
									<option value="SE">Sweden</option>
									<option value="NO">Norway</option>
									<option value="DK">Denmark</option>
								</select>
							</div>

							<button
								type="submit"
								class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
							>
								Save Address
							</button>
						</div>
					</form>
				</div>

				<!-- Shipping Method Selection -->
				{#if data.cart.shippingPostalCode && data.shippingRates.length > 0}
					<div class="bg-white rounded-lg shadow p-6">
						<h2 class="text-xl font-semibold mb-4">Shipping Method</h2>

						<div class="space-y-3">
							{#each data.shippingRates as rate}
								<label
									class="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors {selectedShippingRate?.id ===
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
										<div class="flex justify-between items-start">
											<div>
												<p class="font-medium">{rate.name}</p>
												{#if rate.description}
													<p class="text-sm text-gray-500 mt-1">{rate.description}</p>
												{/if}
												{#if rate.estimatedDeliveryDays}
													<p class="text-sm text-gray-500 mt-1">
														Estimated delivery: {rate.estimatedDeliveryDays} business day{rate
															.estimatedDeliveryDays !== 1
															? 's'
															: ''}
													</p>
												{/if}
											</div>
											<p class="font-semibold ml-4">{formatPrice(rate.price)} EUR</p>
										</div>
									</div>
								</label>
							{/each}
						</div>

						{#if selectedShippingRate}
							<form method="POST" action="?/setShippingMethod" use:enhance class="mt-4">
								<input type="hidden" name="methodId" value={selectedShippingRate.methodId} />
								<input type="hidden" name="rateId" value={selectedShippingRate.id} />
								<input type="hidden" name="price" value={selectedShippingRate.price} />
								<button
									type="submit"
									class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
								>
									Select Shipping Method
								</button>
							</form>
						{/if}
					</div>
				{:else if data.cart.shippingPostalCode}
					<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
						<p class="text-yellow-800 text-sm">
							No shipping methods available for this address. Please check your address.
						</p>
					</div>
				{:else}
					<div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
						<p class="text-gray-600 text-sm">
							Please enter your shipping address to see available shipping methods.
						</p>
					</div>
				{/if}

				<!-- Payment Method Selection -->
				{#if data.cart.shippingPostalCode && selectedShippingRate && data.paymentMethods?.length > 0}
					<div class="bg-white rounded-lg shadow p-6">
						<h2 class="text-xl font-semibold mb-4">Payment Method</h2>

						<div class="space-y-3">
							{#each data.paymentMethods as method}
								<label
									class="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors {selectedPaymentMethod?.id ===
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
											<p class="text-sm text-gray-500 mt-1">{method.description}</p>
										{/if}
									</div>
								</label>
							{/each}
						</div>

						{#if selectedPaymentMethod}
							<form method="POST" action="?/createPayment" use:enhance class="mt-4">
								<input type="hidden" name="paymentMethodId" value={selectedPaymentMethod.id} />
								<button
									type="submit"
									class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
								>
									Proceed to Payment
								</button>
							</form>
						{/if}
					</div>
				{:else if data.cart.shippingPostalCode && selectedShippingRate}
					<div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
						<p class="text-gray-600 text-sm">
							Please select a shipping method first to see payment options.
						</p>
					</div>
				{/if}
			</div>

			<!-- Order Summary -->
			<div class="lg:col-span-1">
				<div class="bg-white rounded-lg shadow p-6 sticky top-4">
					<h2 class="text-xl font-semibold mb-4">Order Summary</h2>

					<div class="space-y-4 mb-4">
						{#each data.cart.lines as line}
							<div class="flex justify-between text-sm">
								<div>
									<p class="font-medium">{line.productName}</p>
									{#if line.variantName}
										<p class="text-gray-500 text-xs">{line.variantName}</p>
									{/if}
									<p class="text-gray-500 text-xs">Qty: {line.quantity}</p>
								</div>
								<p class="font-medium">{formatPrice(line.lineTotal)} EUR</p>
							</div>
						{/each}
					</div>

					<div class="border-t pt-4 space-y-2">
						<div class="flex justify-between text-sm">
							<span class="text-gray-600">Subtotal</span>
							<span class="font-medium">{formatPrice(data.cart.subtotal)} EUR</span>
						</div>

						{#if data.cart.discount > 0}
							<div class="flex justify-between text-sm">
								<span class="text-gray-600">Discount</span>
								<span class="font-medium text-green-600">
									-{formatPrice(data.cart.discount)} EUR
								</span>
							</div>
						{/if}

						<div class="flex justify-between text-sm">
							<span class="text-gray-600">Shipping</span>
							<span class="font-medium">{formatPrice(data.cart.shipping)} EUR</span>
						</div>

						<div class="flex justify-between text-lg font-bold pt-2 border-t">
							<span>Total</span>
							<span>{formatPrice(data.cart.total)} EUR</span>
						</div>
					</div>

					{#if form?.paymentInfo}
						<div class="mt-6 pt-6 border-t">
							<div class="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
								<p class="text-green-800 font-medium mb-2">Payment Created</p>
								<p class="text-green-700 text-sm">
									Transaction ID: {form.paymentInfo.providerTransactionId}
								</p>
								{#if form.paymentInfo.clientSecret}
									<p class="text-green-700 text-sm mt-2">
										Client Secret: {form.paymentInfo.clientSecret.substring(0, 20)}...
									</p>
								{/if}
							</div>
							<p class="text-sm text-gray-500 mb-4">
								Payment integration with Stripe Elements will be implemented next.
							</p>
						</div>
					{:else}
						<div class="mt-6 pt-6 border-t">
							<p class="text-sm text-gray-500 mb-4">
								Select payment method to proceed.
							</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
