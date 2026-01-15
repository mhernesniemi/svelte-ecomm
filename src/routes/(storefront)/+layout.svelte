<script lang="ts">
  import { SignedIn, SignedOut, UserButton, SignInButton, useClerkContext } from "svelte-clerk";
  import { invalidateAll } from "$app/navigation";
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
</script>

<div class="min-h-screen bg-white">
  <!-- Header -->
  <header>
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 items-center justify-between">
        <a href="/" class="bg-[#f7d0dd] text-xl font-bold text-gray-900">"Hoikka"</a>

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
