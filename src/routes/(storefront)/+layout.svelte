<script lang="ts">
	import { SignedIn, SignedOut, UserButton, SignInButton } from 'svelte-clerk';

	let { children } = $props();
</script>

<div class="min-h-screen bg-white">
	<!-- Header -->
	<header class="border-b">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-16">
				<a href="/" class="text-xl font-bold text-gray-900">Sveltecomm</a>

				<nav class="flex items-center gap-6">
					<a href="/products" class="text-gray-600 hover:text-gray-900">Products</a>
					<a href="/cart" class="text-gray-600 hover:text-gray-900" aria-label="Shopping cart">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
						<a href="/account" class="text-gray-600 hover:text-gray-900 text-sm">Account</a>
						<UserButton />
					</SignedIn>
					<SignedOut>
						<SignInButton mode="modal">
							<button class="text-gray-600 hover:text-gray-900 text-sm">Sign in</button>
						</SignInButton>
						<a
							href="/sign-up"
							class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
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
	<footer class="border-t mt-auto">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<div class="flex justify-between items-center">
				<p class="text-gray-500 text-sm">Sveltecomm - Opinionated Commerce with TypeScript</p>
				<a href="/admin" class="text-gray-500 text-sm hover:text-gray-900">Admin</a>
			</div>
		</div>
	</footer>
</div>
