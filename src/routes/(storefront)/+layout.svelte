<script lang="ts">
  import { SignedIn, SignedOut, UserButton, SignInButton, useClerkContext } from "svelte-clerk";
  import { invalidateAll, goto } from "$app/navigation";
  import { throttle } from "$lib/utils";
  import type { LayoutData } from "./$types";

  let { children, data }: { children: any; data: LayoutData } = $props();

  const clerkContext = useClerkContext();
  let previousUserId: string | null | undefined = undefined;

  // Invalidate data when auth state changes (sign in/out)
  $effect(() => {
    const currentUserId = clerkContext.auth.userId ?? null;
    if (previousUserId !== undefined && previousUserId !== currentUserId) {
      invalidateAll();
    }
    previousUserId = currentUserId;
  });

  const wishlistCount = $derived(data.wishlistCount);

  // Search state
  type SearchResult = {
    id: number;
    name: string;
    slug: string;
    price: number;
    image: string | null;
  };

  let searchQuery = $state("");
  let searchResults = $state<SearchResult[]>([]);
  let isSearching = $state(false);
  let showResults = $state(false);
  let abortController: AbortController | null = null;

  async function performSearch(query: string) {
    // Cancel previous request
    abortController?.abort();
    abortController = new AbortController();

    if (query.length < 2) {
      searchResults = [];
      isSearching = false;
      return;
    }

    isSearching = true;

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
        signal: abortController.signal
      });
      searchResults = await res.json();
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        console.error("Search error:", e);
      }
    } finally {
      isSearching = false;
    }
  }

  const throttledSearch = throttle(performSearch, 50);

  $effect(() => {
    throttledSearch(searchQuery);
  });

  function handleResultClick(slug: string) {
    searchQuery = "";
    searchResults = [];
    showResults = false;
    goto(`/products/${slug}`);
  }

  function formatPrice(cents: number): string {
    return (cents / 100).toFixed(2) + " €";
  }
</script>

<div class="min-h-screen bg-white">
  <!-- Header -->
  <header>
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 items-center justify-between">
        <a href="/" class="bg-[#f7d0dd] text-xl font-bold text-gray-900">"Hoikka"</a>

        <!-- Search Bar -->
        <div class="relative mx-4 flex-1 max-w-md">
          <input
            type="text"
            bind:value={searchQuery}
            onfocus={() => (showResults = true)}
            onblur={() => setTimeout(() => (showResults = false), 200)}
            placeholder="Search products..."
            class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          {#if isSearching}
            <div class="absolute right-3 top-1/2 -translate-y-1/2">
              <svg class="h-4 w-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          {/if}

          <!-- Search Results Dropdown -->
          {#if showResults && searchQuery.length >= 2}
            <div class="absolute top-full left-0 right-0 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg z-50 max-h-96 overflow-y-auto">
              {#if searchResults.length > 0}
                {#each searchResults as result}
                  <button
                    type="button"
                    onclick={() => handleResultClick(result.slug)}
                    class="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    {#if result.image}
                      <img src={result.image} alt="" class="h-10 w-10 rounded object-cover" />
                    {:else}
                      <div class="h-10 w-10 rounded bg-gray-100"></div>
                    {/if}
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 truncate">{result.name}</p>
                      <p class="text-sm text-gray-500">{formatPrice(result.price)}</p>
                    </div>
                  </button>
                {/each}
              {:else if !isSearching}
                <div class="px-4 py-3 text-sm text-gray-500">No products found</div>
              {/if}
            </div>
          {/if}
        </div>

        <nav class="flex items-center gap-6">
          <a href="/products" class="text-gray-600 hover:text-gray-900">Products</a>

          {#if wishlistCount > 0}
            <a
              href="/wishlist"
              class="relative text-gray-600 hover:text-gray-900"
              aria-label="Wishlist"
            >
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span
                class="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
              >
                {wishlistCount}
              </span>
            </a>
          {/if}

          <a href="/cart" class="text-gray-600 hover:text-gray-900" aria-label="Shopping cart">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </a>

          <!-- Auth UI -->
          <SignedIn>
            <a href="/account" class="text-sm text-gray-600 hover:text-gray-900">Account</a>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button class="text-sm text-gray-600 hover:text-gray-900">Sign in</button>
            </SignInButton>
            <a
              href="/sign-up"
              class="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              Sign up
            </a>
          </SignedOut>
        </nav>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main>
    {@render children()}
  </main>

  <!-- Footer -->
  <footer class="mt-auto border-t">
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-500">Hoikka - Opinionated Commerce for SvelteKit</p>
        <a href="/admin" class="text-sm text-gray-500 hover:text-gray-900">Admin</a>
      </div>
    </div>
  </footer>
</div>
