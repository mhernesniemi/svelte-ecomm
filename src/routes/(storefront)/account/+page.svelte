<script lang="ts">
	import { UserProfile } from 'svelte-clerk';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<div class="mb-8">
		<h1 class="text-2xl font-bold">My Account</h1>
		<p class="text-gray-600 mt-1">Manage your account settings and view your orders</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-4 gap-8">
		<!-- Sidebar -->
		<aside class="md:col-span-1">
			<nav class="space-y-2">
				<a
					href="/account"
					class="block px-4 py-2 rounded-lg bg-blue-50 text-blue-600 font-medium"
				>
					Profile
				</a>
				<a
					href="/account/orders"
					class="block px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50"
				>
					Order History
				</a>
			</nav>
		</aside>

		<!-- Main Content -->
		<main class="md:col-span-3">
			<div class="bg-white rounded-lg shadow p-6">
				<h2 class="text-lg font-semibold mb-4">Profile Settings</h2>
				<UserProfile routing="path" path="/account" />
			</div>
		</main>
	</div>
</div>
