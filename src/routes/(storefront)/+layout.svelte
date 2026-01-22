<script lang="ts">
  import { SignedIn, SignedOut, UserButton, SignInButton, useClerkContext } from "svelte-clerk";
  import { invalidateAll, goto, onNavigate } from "$app/navigation";
  import { page } from "$app/stores";
  import { browser } from "$app/environment";
  import { throttle, formatPrice } from "$lib/utils";
  import { searchProducts, type SearchResult } from "$lib/remote/search.remote.js";
  import CartSheet from "$lib/components/storefront/CartSheet.svelte";
  import { cartStore } from "$lib/stores/cart.svelte";
  import { wishlistStore } from "$lib/stores/wishlist.svelte";
  import type { LayoutData } from "./$types";
  import Loader2 from "@lucide/svelte/icons/loader-2";
  import Heart from "@lucide/svelte/icons/heart";

  // Enable view transitions for navigation
  onNavigate((navigation) => {
    if (!document.startViewTransition) return;

    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });

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

  // Sync server data to stores for optimistic updates
  $effect(() => {
    cartStore.sync(data.cart);
  });

  $effect(() => {
    wishlistStore.sync(data.wishlistCount);
  });

  const wishlistCount = $derived.by(() => wishlistStore.count);

  // Search state
  let searchQuery = $state("");
  let searchResults = $state<SearchResult[]>([]);
  let isSearching = $state(false);
  let showResults = $state(false);

  async function performSearch(query: string) {
    if (query.length < 2) {
      searchResults = [];
      isSearching = false;
      return;
    }

    isSearching = true;

    try {
      searchResults = await searchProducts(query);
    } catch (e) {
      console.error("Search error:", e);
    } finally {
      isSearching = false;
    }
  }

  const throttledSearch = throttle(performSearch, 50);

  $effect(() => {
    if (browser) {
      throttledSearch(searchQuery);
    }
  });

  function handleResultClick(slug: string) {
    searchQuery = "";
    searchResults = [];
    showResults = false;
    goto(`/products/${slug}`);
  }

</script>

<div class="min-h-screen bg-white">
  <!-- Header (hidden on front page) -->
  {#if $page.url.pathname !== "/"}
  <header>
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 items-center justify-between">
        <a href="/" class="bg-[#f7d0dd] text-xl font-bold text-gray-900">"Hoikka"</a>

        <!-- Search Bar -->
        <div class="relative mx-4 max-w-md flex-1">
          <input
            type="text"
            bind:value={searchQuery}
            onfocus={() => (showResults = true)}
            onblur={() => setTimeout(() => (showResults = false), 200)}
            placeholder="Search products..."
            class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm"
          />
          {#if isSearching}
            <div class="absolute top-1/2 right-3 -translate-y-1/2">
              <Loader2 class="h-4 w-4 animate-spin text-gray-400" />
            </div>
          {/if}

          <!-- Search Results Dropdown -->
          {#if showResults && searchQuery.length >= 2}
            <div
              class="absolute top-full right-0 left-0 z-50 mt-1 max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
            >
              {#if searchResults.length > 0}
                {#each searchResults as result}
                  <button
                    type="button"
                    onclick={() => handleResultClick(result.slug)}
                    class="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left last:border-b-0 hover:bg-gray-50"
                  >
                    {#if result.image}
                      <img src={result.image} alt="" class="h-10 w-10 rounded object-cover" />
                    {:else}
                      <div class="h-10 w-10 rounded bg-gray-100"></div>
                    {/if}
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-sm font-medium text-gray-900">{result.name}</p>
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
              <Heart class="h-6 w-6" />
              <span
                class="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
              >
                {wishlistCount}
              </span>
            </a>
          {/if}

          <CartSheet />

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
  {/if}

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
