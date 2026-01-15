<script lang="ts">
	import { enhance } from "$app/forms";
	import type { PageData, ActionData } from "./$types";

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const items = $derived(data.wishlistProducts);

	let removingId = $state<number | null>(null);
	let addingId = $state<number | null>(null);
	let message = $state<{ type: "success" | "error"; text: string } | null>(null);

	function getName(item: (typeof items)[0]): string {
		return item.product.translations.find((t) => t.languageCode === "en")?.name ?? "Product";
	}

	function getSlug(item: (typeof items)[0]): string {
		return item.product.translations.find((t) => t.languageCode === "en")?.slug ?? "";
	}

	function getPrice(item: (typeof items)[0]): number {
		return item.product.variants[0]?.price ?? 0;
	}

	function getStock(item: (typeof items)[0]): number {
		return item.product.variants[0]?.stock ?? 0;
	}

	function getVariantId(item: (typeof items)[0]): number | null {
		return item.item.variantId ?? item.product.variants[0]?.id ?? null;
	}

	function getImage(item: (typeof items)[0]): string | null {
		return item.product.featuredAsset?.source ?? item.product.assets[0]?.source ?? null;
	}

	$effect(() => {
		if (form?.addedToCart) {
			message = { type: "success", text: "Added to cart!" };
			setTimeout(() => (message = null), 3000);
		}
	});
</script>

<div class="mx-auto max-w-4xl px-4 py-8">
	<div class="mb-8 flex items-center justify-between">
		<h1 class="text-3xl font-bold">Wishlist</h1>
		{#if items.length > 0}
			<form method="POST" action="?/clear" use:enhance>
				<button type="submit" class="text-sm text-red-600 hover:underline">Clear all</button>
			</form>
		{/if}
	</div>

	{#if message}
		<div class="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
			{message.text}
			<a href="/cart" class="ml-2 underline">View cart</a>
		</div>
	{/if}

	{#if items.length === 0}
		<div class="rounded-lg border border-dashed border-gray-300 p-12 text-center">
			<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
			</svg>
			<h3 class="mt-4 text-lg font-medium">Your wishlist is empty</h3>
			<p class="mt-2 text-gray-500">Start adding products you love!</p>
			<a href="/products" class="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700">
				Browse Products
			</a>
		</div>
	{:else}
		<div class="space-y-4">
			{#each items as item}
				{@const name = getName(item)}
				{@const slug = getSlug(item)}
				{@const price = getPrice(item)}
				{@const stock = getStock(item)}
				{@const variantId = getVariantId(item)}
				{@const image = getImage(item)}

				<div class="flex gap-4 rounded-lg border p-4">
					<a href="/products/{slug}" class="flex-shrink-0">
						{#if image}
							<img src="{image}?tr=w-120,h-120,fo-auto" alt={name} class="h-24 w-24 rounded-lg object-cover" />
						{:else}
							<div class="flex h-24 w-24 items-center justify-center rounded-lg bg-gray-100">
								<svg class="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
								</svg>
							</div>
						{/if}
					</a>

					<div class="flex flex-1 flex-col">
						<div class="flex items-start justify-between">
							<a href="/products/{slug}" class="font-medium hover:text-blue-600">{name}</a>
							<span class="text-lg font-semibold">{(price / 100).toFixed(2)} EUR</span>
						</div>

						<div class="mt-auto flex items-center justify-between pt-4">
							<span class="text-sm {stock > 0 ? 'text-green-600' : 'text-red-600'}">
								{stock > 0 ? "In stock" : "Out of stock"}
							</span>

							<div class="flex items-center gap-3">
								<form
									method="POST"
									action="?/remove"
									use:enhance={() => {
										removingId = item.item.productId;
										return async ({ update }) => {
											await update();
											removingId = null;
										};
									}}
								>
									<input type="hidden" name="productId" value={item.item.productId} />
									<button type="submit" disabled={removingId === item.item.productId} class="text-sm text-gray-500 hover:text-red-600 disabled:opacity-50">
										{removingId === item.item.productId ? "Removing..." : "Remove"}
									</button>
								</form>

								{#if variantId && stock > 0}
									<form
										method="POST"
										action="?/addToCart"
										use:enhance={() => {
											addingId = variantId;
											return async ({ update }) => {
												await update();
												addingId = null;
											};
										}}
									>
										<input type="hidden" name="variantId" value={variantId} />
										<button type="submit" disabled={addingId === variantId} class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
											{addingId === variantId ? "Adding..." : "Add to Cart"}
										</button>
									</form>
								{/if}
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<div class="mt-8 text-center">
			<a href="/products" class="text-blue-600 hover:underline">Continue Shopping</a>
		</div>
	{/if}
</div>
