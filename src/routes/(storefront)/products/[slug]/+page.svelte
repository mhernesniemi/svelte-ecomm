<script lang="ts">
  import { enhance } from "$app/forms";
  import { addToCart } from "$lib/remote/cart.remote";
  import { toggleWishlist } from "$lib/remote/wishlist.remote";
  import { invalidateAll } from "$app/navigation";
  import { Button } from "$lib/components/storefront/ui/button";
  import { Alert } from "$lib/components/storefront/ui/alert";
  import { Badge } from "$lib/components/storefront/ui/badge";
  import type { PageData, ActionData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const product = $derived(data.product);
  const enTrans = $derived(product.translations.find((t) => t.languageCode === "en"));

  let selectedVariantId = $state<number | null>(null);
  let quantity = $state(1);
  let isAddingToCart = $state(false);
  let isTogglingWishlist = $state(false);
  let wishlistOverride = $state<boolean | null>(null);
  let message = $state<{ type: "success" | "error"; text: string } | null>(null);
  let selectedImageIndex = $state(0);

  // Use override if set (after toggle), otherwise use server data
  const isWishlisted = $derived(wishlistOverride ?? data.isWishlisted);

  const images = $derived(
    product.assets.length > 0
      ? product.assets
      : product.featuredAsset
        ? [product.featuredAsset]
        : []
  );

  // Initialize selected variant when product loads
  $effect(() => {
    if (product.variants[0] && selectedVariantId === null) {
      selectedVariantId = product.variants[0].id;
    }
  });

  const selectedVariant = $derived(product.variants.find((v) => v.id === selectedVariantId));

  function getVariantName(variant: (typeof product.variants)[0]): string {
    const trans = variant.translations.find((t) => t.languageCode === "en");
    return trans?.name ?? variant.sku;
  }

  // Review form state
  let reviewNickname = $state("");
  let reviewRating = $state(0);
  let reviewComment = $state("");
  let isSubmittingReview = $state(false);
  let hoverRating = $state(0);

  function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  async function handleAddToCart() {
    if (!selectedVariantId) return;
    isAddingToCart = true;
    message = null;
    try {
      await addToCart({ variantId: selectedVariantId, quantity });
      await invalidateAll();
    } catch {
      message = { type: "error", text: "Failed to add item to cart" };
    } finally {
      isAddingToCart = false;
    }
  }

  async function handleToggleWishlist() {
    isTogglingWishlist = true;
    try {
      const result = await toggleWishlist({
        productId: product.id,
        variantId: selectedVariantId ?? undefined
      });
      wishlistOverride = result.added;
      // Invalidate to update header wishlist count
      await invalidateAll();
    } catch {
      message = { type: "error", text: "Failed to update wishlist" };
      setTimeout(() => (message = null), 3000);
    } finally {
      isTogglingWishlist = false;
    }
  }
</script>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
  <nav class="mb-6">
    <a href="/products" class="text-sm text-blue-600 hover:underline">&larr; Back to Products</a>
  </nav>

  <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
    <!-- Product Images -->
    <div>
      <!-- Main Image -->
      <div
        class="aspect-square overflow-hidden rounded-lg bg-gray-100"
        style="view-transition-name: product-image-{product.id}"
      >
        {#if images.length > 0}
          <img
            src="{images[selectedImageIndex].source}?tr=w-600,h-600,fo-auto"
            alt={enTrans?.name}
            class="h-full w-full object-cover"
          />
        {:else}
          <div class="flex h-full w-full items-center justify-center text-gray-400">
            <svg class="h-24 w-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        {/if}
      </div>

      <!-- Thumbnails -->
      {#if images.length > 1}
        <div class="mt-4 flex gap-2 overflow-x-auto">
          {#each images as image, index}
            <button
              type="button"
              onclick={() => (selectedImageIndex = index)}
              class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors {selectedImageIndex ===
              index
                ? 'border-blue-500'
                : 'border-transparent hover:border-gray-300'}"
            >
              <img
                src="{image.source}?tr=w-100,h-100,fo-auto"
                alt=""
                class="h-full w-full object-cover"
              />
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Product Info -->
    <div>
      <div class="mb-4 flex items-start justify-between">
        <h1 class="text-3xl font-bold">{enTrans?.name ?? "Product"}</h1>
        <button
          type="button"
          onclick={handleToggleWishlist}
          disabled={isTogglingWishlist}
          class="rounded-full p-2 transition-colors {isWishlisted
            ? 'text-red-500 hover:text-red-600'
            : 'text-gray-400 hover:text-red-500'} disabled:opacity-50"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <svg
            class="h-7 w-7"
            fill={isWishlisted ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>
      </div>

      {#if enTrans?.description}
        <p class="mb-6 text-gray-600">{enTrans.description}</p>
      {/if}

      {#if selectedVariant}
        <p class="mb-6 text-2xl font-bold">
          {(selectedVariant.price / 100).toFixed(2)} EUR
        </p>
      {/if}

      <!-- Variant Selection -->
      {#if product.variants.length > 1}
        <div class="mb-6">
          <p class="mb-2 block text-sm font-medium text-gray-700">Select Variant</p>
          <div class="flex flex-wrap gap-2" role="group" aria-label="Product variants">
            {#each product.variants as variant}
              <button
                type="button"
                onclick={() => (selectedVariantId = variant.id)}
                class="rounded-lg border px-4 py-2 transition-colors {selectedVariantId ===
                variant.id
                  ? 'border-blue-600 bg-blue-50 text-blue-600'
                  : 'border-gray-300 hover:border-gray-400'}"
              >
                {getVariantName(variant)}
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Stock Status -->
      {#if selectedVariant}
        <div class="mb-6">
          {#if selectedVariant.stock > 0}
            <span class="text-sm text-green-600">In stock ({selectedVariant.stock} available)</span>
          {:else}
            <span class="text-sm text-red-600">Out of stock</span>
          {/if}
        </div>
      {/if}

      <!-- Success/Error Messages -->
      {#if message}
        <Alert variant={message.type === "error" ? "destructive" : "success"} class="mb-4">
          {message.text}
        </Alert>
      {/if}

      <!-- Quantity & Add to Cart -->
      {#if selectedVariant && selectedVariant.stock > 0}
        <div class="mb-6 flex items-center gap-4">
          <div class="flex items-center rounded-lg border">
            <button
              type="button"
              onclick={() => quantity > 1 && (quantity -= 1)}
              class="px-3 py-2 hover:bg-gray-50"
              aria-label="Decrease quantity"
            >
              -
            </button>
            <input
              type="number"
              bind:value={quantity}
              min="1"
              max={selectedVariant.stock}
              class="w-12 border-x py-2 text-center"
              aria-label="Quantity"
            />
            <button
              type="button"
              onclick={() => quantity < selectedVariant.stock && (quantity += 1)}
              class="px-3 py-2 hover:bg-gray-50"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <Button
            type="button"
            onclick={handleAddToCart}
            disabled={isAddingToCart}
            class="flex-1 py-3"
          >
            {isAddingToCart ? "Adding..." : "Add to Cart"}
          </Button>
        </div>
      {/if}
    </div>
  </div>

  <!-- Reviews Section -->
  <div class="mt-12 border-t pt-8">
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-2xl font-bold">Customer Reviews</h2>
      {#if data.rating.count > 0}
        <div class="flex items-center gap-2">
          <span class="text-2xl font-bold">{data.rating.average.toFixed(1)}</span>
          <div class="flex text-yellow-400">
            {#each [1, 2, 3, 4, 5] as star}
              <span class="text-xl">{star <= Math.round(data.rating.average) ? "★" : "☆"}</span>
            {/each}
          </div>
          <span class="text-gray-500"
            >({data.rating.count} {data.rating.count === 1 ? "review" : "reviews"})</span
          >
        </div>
      {/if}
    </div>

    <!-- Review Form -->
    {#if data.customerId}
      {#if data.customerReview}
        <div class="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p class="text-sm text-blue-800">
            You have already reviewed this product.
            {#if data.customerReview.status === "pending"}
              Your review is pending approval.
            {/if}
          </p>
        </div>
      {:else}
        <div class="mb-8 rounded-lg border bg-gray-50 p-6">
          <h3 class="mb-4 text-lg font-medium">Write a Review</h3>

          {#if form?.reviewError}
            <Alert variant="destructive" class="mb-4">{form.reviewError}</Alert>
          {/if}

          {#if form?.reviewSuccess}
            <Alert variant="success" class="mb-4">
              Thank you for your review! It will be visible after approval.
            </Alert>
          {:else}
            <form
              method="POST"
              action="?/submitReview"
              use:enhance={() => {
                isSubmittingReview = true;
                return async ({ update }) => {
                  await update();
                  isSubmittingReview = false;
                  if (!form?.reviewError) {
                    reviewNickname = "";
                    reviewRating = 0;
                    reviewComment = "";
                  }
                };
              }}
            >
              <!-- Nickname -->
              <div class="mb-4">
                <label for="review-nickname" class="mb-2 block text-sm font-medium text-gray-700">
                  Your Nickname <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="review-nickname"
                  name="nickname"
                  bind:value={reviewNickname}
                  required
                  maxlength="100"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter a display name for your review"
                />
              </div>

              <!-- Star Rating -->
              <div class="mb-4">
                <label class="mb-2 block text-sm font-medium text-gray-700"
                  >Your Rating <span class="text-red-500">*</span></label
                >
                <div class="flex gap-1">
                  {#each [1, 2, 3, 4, 5] as star}
                    <button
                      type="button"
                      onclick={() => (reviewRating = star)}
                      onmouseenter={() => (hoverRating = star)}
                      onmouseleave={() => (hoverRating = 0)}
                      class="text-3xl transition-colors {star <= (hoverRating || reviewRating)
                        ? 'text-yellow-400'
                        : 'text-gray-300'}"
                    >
                      ★
                    </button>
                  {/each}
                </div>
                <input type="hidden" name="rating" value={reviewRating} />
              </div>

              <!-- Comment -->
              <div class="mb-4">
                <label for="review-comment" class="mb-2 block text-sm font-medium text-gray-700">
                  Your Review (optional)
                </label>
                <textarea
                  id="review-comment"
                  name="comment"
                  bind:value={reviewComment}
                  rows="4"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Share your experience with this product..."
                ></textarea>
              </div>

              <Button
                type="submit"
                disabled={isSubmittingReview || reviewRating === 0 || !reviewNickname.trim()}
              >
                {isSubmittingReview ? "Submitting..." : "Submit Review"}
              </Button>
            </form>
          {/if}
        </div>
      {/if}
    {:else}
      <div class="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p class="text-gray-600">
          <a href="/sign-in" class="text-blue-600 hover:underline">Sign in</a> to leave a review.
        </p>
      </div>
    {/if}

    <!-- Reviews List -->
    {#if data.reviews.length === 0}
      <p class="text-gray-500">No reviews yet. Be the first to review this product!</p>
    {:else}
      <div class="space-y-6">
        {#each data.reviews as review}
          <div class="border-b pb-6 last:border-b-0">
            <div class="mb-2 flex items-start justify-between">
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-medium">{review.nickname}</span>
                  {#if review.isVerifiedPurchase}
                    <Badge variant="success">Verified Purchase</Badge>
                  {/if}
                </div>
                <div class="mt-1 flex text-yellow-400">
                  {#each [1, 2, 3, 4, 5] as star}
                    <span>{star <= review.rating ? "★" : "☆"}</span>
                  {/each}
                </div>
              </div>
              <span class="text-sm text-gray-500">{formatDate(review.createdAt)}</span>
            </div>
            {#if review.comment}
              <p class="text-gray-700">{review.comment}</p>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
