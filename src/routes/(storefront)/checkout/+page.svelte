<script lang="ts">
  import { enhance } from "$app/forms";
  import { Button } from "$lib/components/storefront/ui/button";
  import { Input } from "$lib/components/storefront/ui/input";
  import { Label } from "$lib/components/storefront/ui/label";
  import { Alert } from "$lib/components/storefront/ui/alert";
  import type { PageData } from "./$types.js";

  let { data, form }: { data: PageData; form: any } = $props();

  let selectedShippingRate = $state<(typeof data.shippingRates)[0] | null>(null);
  let selectedPaymentMethod = $state<NonNullable<typeof data.paymentMethods>[number] | null>(null);
  let isProcessingPayment = $state(false);
  let isCompletingOrder = $state(false);

  // Combine form and data for reactive state
  const currentOrderShipping = $derived(form?.orderShipping ?? data.orderShipping);
  const currentPaymentMethods = $derived(form?.paymentMethods ?? data.paymentMethods);
  const currentPaymentInfo = $derived(form?.paymentInfo ?? data.paymentInfo);
  const currentCart = $derived(form?.cart ?? data.cart);
  const currentShippingRates = $derived(form?.shippingRates ?? data.shippingRates);
  const isDigitalOnly = $derived(data.isDigitalOnly);
  const contactInfoSet = $derived(
    form?.contactInfoSet || (isDigitalOnly && currentCart?.customerEmail)
  );

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

  // Form data for physical products (shipping address)
  let addressFormData = $state({
    fullName: data.customerFullName ?? data.cart?.shippingFullName ?? "",
    streetLine1: data.cart?.shippingStreetLine1 ?? "",
    city: data.cart?.shippingCity ?? "",
    postalCode: data.cart?.shippingPostalCode ?? "",
    country: data.cart?.shippingCountry ?? "FI"
  });

  // Saved addresses
  const savedAddresses = $derived(form?.savedAddresses ?? data.savedAddresses ?? []);
  const cartHasAddress = $derived(!!currentCart?.shippingPostalCode);

  // Show address picker only if: has saved addresses AND no address set on cart AND user hasn't chosen manual entry
  let preferManualEntry = $state(false);
  let isEditingAddress = $state(false);
  let saveAddressForFuture = $state(false);
  let isEditingShipping = $state(false);
  const showAddressPicker = $derived(savedAddresses.length > 0 && !cartHasAddress && !preferManualEntry);

  // Auto-select default saved address on mount
  let autoSelectForm = $state<HTMLFormElement | null>(null);
  let hasAutoSelected = $state(false);

  $effect(() => {
    if (autoSelectForm && !hasAutoSelected && showAddressPicker && savedAddresses.length > 0) {
      hasAutoSelected = true;
      autoSelectForm.requestSubmit();
    }
  });

  // Form data for digital products (contact info)
  let contactFormData = $state({
    fullName: data.customerFullName ?? data.cart?.shippingFullName ?? "",
    email: data.customerEmail ?? data.cart?.customerEmail ?? ""
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
      <p class="mb-4 text-gray-500">Your cart is empty</p>
      <a href="/products" class="text-blue-600 underline hover:text-blue-700">Browse products</a>
  {:else}
    <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <!-- Main Content -->
      <div class="space-y-10 lg:col-span-2">
        {#if form?.error}
          <Alert variant="destructive">
            <p>{form.error}</p>
            {#if form?.stockErrors?.length}
              <ul class="mt-2 list-inside list-disc text-sm">
                {#each form.stockErrors as stockError}
                  <li>{stockError}</li>
                {/each}
              </ul>
            {/if}
          </Alert>
        {/if}

        {#if isDigitalOnly}
          <!-- Contact Info for Digital Products -->
          <div class="rounded-lg bg-white p-6 shadow">
            <h2 class="mb-4 text-xl font-semibold">Contact Information</h2>
            <p class="mb-4 text-sm text-gray-600">
              Your digital product will be delivered to this email address after payment.
            </p>

            {#if contactInfoSet}
              <Alert variant="success">
                <p class="font-medium">Contact information saved</p>
                <p class="text-sm">{currentCart?.shippingFullName}</p>
                <p class="text-sm">{currentCart?.customerEmail}</p>
              </Alert>
            {:else}
              <form method="POST" action="?/setContactInfo" use:enhance>
                <div class="space-y-4">
                  <div>
                    <Label for="fullName">
                      Full Name <span class="text-red-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="fullName"
                      name="fullName"
                      bind:value={contactFormData.fullName}
                      required
                      class="mt-1"
                    />
                  </div>

                  <div>
                    <Label for="email">
                      Email Address <span class="text-red-500">*</span>
                    </Label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      bind:value={contactFormData.email}
                      required
                      class="mt-1"
                    />
                  </div>

                  <Button type="submit" class="w-full">Continue to Payment</Button>
                </div>
              </form>
            {/if}
          </div>
        {:else}
          <!-- Shipping Address for Physical Products -->
          <div>
            <h2 class="mb-4 text-xl font-semibold">Shipping Address</h2>

            {#if showAddressPicker}
              <!-- Hidden form for auto-selecting default address -->
              {@const defaultAddress = savedAddresses.find((a: typeof savedAddresses[0]) => a.isDefault) || savedAddresses[0]}
              <form
                method="POST"
                action="?/useSavedAddress"
                use:enhance
                bind:this={autoSelectForm}
                class="hidden"
              >
                <input type="hidden" name="addressId" value={defaultAddress?.id} />
              </form>

              <!-- Saved Addresses Picker -->
              <div class="mb-4 space-y-3">
                {#each savedAddresses as address}
                  <form method="POST" action="?/useSavedAddress" use:enhance>
                    <input type="hidden" name="addressId" value={address.id} />
                    <button
                      type="submit"
                      class="w-full rounded-lg border border-gray-300 p-4 text-left transition-colors hover:border-blue-500 hover:bg-blue-50"
                    >
                      <div class="flex items-start justify-between">
                        <div>
                          {#if address.fullName}
                            <p class="font-medium">{address.fullName}</p>
                          {/if}
                          <p class="text-sm text-gray-600">{address.streetLine1}</p>
                          {#if address.streetLine2}
                            <p class="text-sm text-gray-600">{address.streetLine2}</p>
                          {/if}
                          <p class="text-sm text-gray-600">{address.postalCode} {address.city}</p>
                          <p class="text-sm text-gray-600">{address.country}</p>
                        </div>
                        {#if address.isDefault}
                          <span class="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                            Default
                          </span>
                        {/if}
                      </div>
                    </button>
                  </form>
                {/each}
              </div>

              <button
                type="button"
                onclick={() => (preferManualEntry = true)}
                class="text-sm text-blue-600 hover:text-blue-800"
              >
                + Use a different address
              </button>
            {:else if cartHasAddress && !isEditingAddress}
              <!-- Address Summary (read-only) -->
              <div class="rounded-lg border border-gray-200 p-4">
                <div class="flex items-start justify-between">
                  <div>
                    {#if currentCart?.shippingFullName}
                      <p class="font-medium">{currentCart.shippingFullName}</p>
                    {/if}
                    <p class="text-sm text-gray-600">{currentCart?.shippingStreetLine1}</p>
                    <p class="text-sm text-gray-600">{currentCart?.shippingPostalCode} {currentCart?.shippingCity}</p>
                    <p class="text-sm text-gray-600">{currentCart?.shippingCountry}</p>
                  </div>
                  <button
                    type="button"
                    onclick={() => {
                      // Pre-fill form with current values
                      addressFormData = {
                        fullName: currentCart?.shippingFullName ?? "",
                        streetLine1: currentCart?.shippingStreetLine1 ?? "",
                        city: currentCart?.shippingCity ?? "",
                        postalCode: currentCart?.shippingPostalCode ?? "",
                        country: currentCart?.shippingCountry ?? "FI"
                      };
                      isEditingAddress = true;
                    }}
                    class="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                </div>
              </div>
            {:else}
              <!-- Address Form -->
              <form method="POST" action="?/setShippingAddress" use:enhance={() => {
                return async ({ update }) => {
                  await update({ reset: false });
                  isEditingAddress = false;
                };
              }}>
                <div class="space-y-4">
                  <div>
                    <Label for="fullName">
                      Full Name <span class="text-red-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="fullName"
                      name="fullName"
                      bind:value={addressFormData.fullName}
                      required
                      class="mt-1"
                    />
                  </div>

                  <div>
                    <Label for="streetLine1">
                      Street Address <span class="text-red-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="streetLine1"
                      name="streetLine1"
                      bind:value={addressFormData.streetLine1}
                      required
                      class="mt-1"
                    />
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <Label for="postalCode">
                        Postal Code <span class="text-red-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        id="postalCode"
                        name="postalCode"
                        bind:value={addressFormData.postalCode}
                        required
                        class="mt-1"
                      />
                    </div>

                    <div>
                      <Label for="city">
                        City <span class="text-red-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        id="city"
                        name="city"
                        bind:value={addressFormData.city}
                        required
                        class="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label for="country">
                      Country <span class="text-red-500">*</span>
                    </Label>
                    <select
                      id="country"
                      name="country"
                      bind:value={addressFormData.country}
                      required
                      class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                    >
                      <option value="FI">Finland</option>
                      <option value="SE">Sweden</option>
                      <option value="NO">Norway</option>
                      <option value="DK">Denmark</option>
                    </select>
                  </div>

                  {#if data.isLoggedIn}
                    <label class="flex items-center gap-2">
                      <input
                        type="checkbox"
                        bind:checked={saveAddressForFuture}
                        class="h-4 w-4 rounded border-gray-300 text-blue-600"
                      />
                      <span class="text-sm text-gray-700">Save this address for future orders</span>
                    </label>
                  {/if}

                  <div class="flex gap-3">
                    {#if isEditingAddress}
                      <Button
                        type="button"
                        variant="outline"
                        class="flex-1"
                        onclick={() => (isEditingAddress = false)}
                      >
                        Cancel
                      </Button>
                    {/if}
                    <Button type="submit" class="flex-1">
                      {isEditingAddress ? "Update Address" : "Continue"}
                    </Button>
                  </div>
                </div>
              </form>

              {#if savedAddresses.length > 0 && !cartHasAddress && !isEditingAddress}
                <button
                  type="button"
                  onclick={() => (preferManualEntry = false)}
                  class="mt-4 text-sm text-gray-600 hover:text-gray-800"
                >
                  &larr; Use a saved address
                </button>
              {/if}
            {/if}
          </div>

          <!-- Shipping Method Selection (only for physical products) -->
          {#if currentCart?.shippingPostalCode && currentShippingRates.length > 0}
            <div>
              <h2 class="mb-4 text-xl font-semibold">Shipping Method</h2>

              {#if currentOrderShipping && !isEditingShipping}
                <!-- Shipping Method Summary (read-only) -->
                {@const selectedRate = currentShippingRates.find(
                  (r: (typeof currentShippingRates)[number]) =>
                    r.methodId === currentOrderShipping?.shippingMethodId
                )}
                <div class="rounded-lg border border-gray-200 p-4">
                  <div class="flex items-start justify-between">
                    <div>
                      <p class="font-medium">{selectedRate?.name || "Selected"}</p>
                      {#if selectedRate?.description}
                        <p class="mt-1 text-sm text-gray-500">{selectedRate.description}</p>
                      {/if}
                      {#if selectedRate?.estimatedDeliveryDays}
                        <p class="mt-1 text-sm text-gray-500">
                          Estimated delivery: {selectedRate.estimatedDeliveryDays} business day{selectedRate.estimatedDeliveryDays !== 1 ? "s" : ""}
                        </p>
                      {/if}
                      <p class="mt-1 font-semibold">{formatPrice(selectedRate?.price ?? 0)} EUR</p>
                    </div>
                    <button
                      type="button"
                      onclick={() => {
                        selectedShippingRate = selectedRate ?? null;
                        isEditingShipping = true;
                      }}
                      class="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              {:else}
                <!-- Shipping Method Selection Form -->
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
                                Estimated delivery: {rate.estimatedDeliveryDays} business day{rate.estimatedDeliveryDays !== 1 ? "s" : ""}
                              </p>
                            {/if}
                          </div>
                          <p class="ml-4 font-semibold">{formatPrice(rate.price)} EUR</p>
                        </div>
                      </div>
                    </label>
                  {/each}
                </div>

                {#if selectedShippingRate}
                  <form
                    method="POST"
                    action="?/setShippingMethod"
                    use:enhance={() => {
                      return async ({ update }) => {
                        await update({ reset: false });
                        isEditingShipping = false;
                      };
                    }}
                    class="mt-4"
                  >
                    <input type="hidden" name="methodId" value={selectedShippingRate.methodId} />
                    <input type="hidden" name="rateId" value={selectedShippingRate.id} />
                    <input type="hidden" name="price" value={selectedShippingRate.price} />
                    <div class="flex gap-3">
                      {#if isEditingShipping}
                        <Button
                          type="button"
                          variant="outline"
                          class="flex-1"
                          onclick={() => {
                            // Reset to the currently saved rate
                            const savedRate = currentShippingRates.find(
                              (r: (typeof currentShippingRates)[number]) =>
                                r.methodId === currentOrderShipping?.shippingMethodId
                            );
                            selectedShippingRate = savedRate ?? null;
                            isEditingShipping = false;
                          }}
                        >
                          Cancel
                        </Button>
                      {/if}
                      <Button type="submit" class="flex-1">
                        {isEditingShipping ? "Update Shipping Method" : "Select Shipping Method"}
                      </Button>
                    </div>
                  </form>
                {/if}
              {/if}
            </div>
          {:else if currentCart?.shippingPostalCode}
            <Alert variant="warning">
              <p class="text-sm">
                No shipping methods available for this address. Please check your address.
              </p>
            </Alert>
          {:else}
            <Alert variant="default">
              <p class="text-sm">
                Please enter your shipping address to see available shipping methods.
              </p>
            </Alert>
          {/if}
        {/if}

        <!-- Payment Method Selection -->
        {#if (isDigitalOnly && contactInfoSet && currentPaymentMethods?.length > 0) || (!isDigitalOnly && currentCart?.shippingPostalCode && currentOrderShipping && currentPaymentMethods?.length > 0)}
          <div>
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
                <Button type="submit" disabled={isProcessingPayment} class="w-full">
                  {isProcessingPayment ? "Processing..." : "Create Payment"}
                </Button>
              </form>
            {:else if currentPaymentInfo}
              <Alert variant="success" class="mt-4">
                <p class="text-sm font-medium">Payment created successfully</p>
              </Alert>
            {/if}
          </div>
        {:else if !isDigitalOnly && currentCart?.shippingPostalCode && !currentOrderShipping}
          <Alert variant="default">
            <p class="text-sm">Please select a shipping method first to see payment options.</p>
          </Alert>
        {:else if isDigitalOnly && !contactInfoSet}
          <Alert variant="default">
            <p class="text-sm">Please enter your contact information to see payment options.</p>
          </Alert>
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

            {#if !isDigitalOnly}
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Shipping</span>
                <span class="font-medium">{formatPrice(currentCart.shipping)} EUR</span>
              </div>
            {/if}

            <div class="flex justify-between border-t pt-2 text-lg font-bold">
              <span>Total</span>
              <span>{formatPrice(currentCart.total)} EUR</span>
            </div>
          </div>

          {#if currentPaymentInfo}
            <div class="mt-6 border-t pt-6">
              {#if form?.stockErrors?.length}
                <Alert variant="destructive" class="mb-4">
                  <p class="mb-2 font-medium">Stock Issue</p>
                  <ul class="list-inside list-disc text-sm">
                    {#each form.stockErrors as stockError}
                      <li>{stockError}</li>
                    {/each}
                  </ul>
                  <p class="mt-2 text-sm">
                    Please adjust quantities in your cart.
                  </p>
                </Alert>
              {:else}
                <Alert variant="success" class="mb-4">
                  <p class="mb-2 font-medium">Payment Ready</p>
                  <p class="text-sm">
                    Transaction ID: {currentPaymentInfo.providerTransactionId}
                  </p>
                </Alert>
              {/if}
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
                {#if saveAddressForFuture}
                  <input type="hidden" name="saveToAddressBook" value="on" />
                {/if}
                <Button
                  type="submit"
                  disabled={isCompletingOrder}
                  class="w-full bg-green-600 hover:bg-green-700"
                >
                  {isCompletingOrder ? "Completing Order..." : "Complete Order"}
                </Button>
              </form>
            </div>
          {:else}
            <div class="mt-6 border-t pt-6">
              <p class="mb-4 text-sm text-gray-500">
                {#if isDigitalOnly}
                  {#if !contactInfoSet}
                    Enter your contact information to proceed.
                  {:else}
                    Select payment method to proceed.
                  {/if}
                {:else if !currentCart?.shippingPostalCode}
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
