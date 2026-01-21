<script lang="ts">
	import { Badge, type BadgeVariant } from "$lib/components/admin/ui/badge";
	import {
		Table,
		TableHeader,
		TableBody,
		TableRow,
		TableHead,
		TableCell
	} from "$lib/components/admin/ui/table";
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();

	const states = ["created", "payment_pending", "paid", "shipped", "delivered", "cancelled"];

	function getStateVariant(state: string): BadgeVariant {
		switch (state) {
			case "paid":
				return "success";
			case "shipped":
				return "default";
			case "delivered":
				return "success";
			case "cancelled":
				return "destructive";
			default:
				return "secondary";
		}
	}
</script>

<div>
	<h1 class="mb-8 text-2xl font-bold">Orders</h1>

	<!-- State Filter -->
	<div class="mb-6 flex flex-wrap gap-2">
		<a
			href="/admin/orders"
			class="rounded-full px-3 py-1 text-sm {!data.currentState
				? 'bg-blue-600 text-white'
				: 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
		>
			All
		</a>
		{#each states as state}
			<a
				href="/admin/orders?state={state}"
				class="rounded-full px-3 py-1 text-sm capitalize {data.currentState === state
					? 'bg-blue-600 text-white'
					: 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
			>
				{state.replace("_", " ")}
			</a>
		{/each}
	</div>

	<Table>
		<TableHeader>
			<TableRow class="hover:bg-transparent">
				<TableHead>Order</TableHead>
				<TableHead>Customer</TableHead>
				<TableHead>Status</TableHead>
				<TableHead>Total</TableHead>
				<TableHead>Date</TableHead>
				<TableHead class="text-right">Actions</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{#if data.orders.length === 0}
				<TableRow class="hover:bg-transparent">
					<TableCell colspan={6} class="py-12 text-center text-gray-500">No orders found</TableCell>
				</TableRow>
			{:else}
				{#each data.orders as order}
					<TableRow>
						<TableCell>
							<p class="font-medium">{order.code}</p>
							<p class="text-sm text-gray-500">{order.lines.length} items</p>
						</TableCell>
						<TableCell class="text-sm text-gray-500">
							{order.shippingFullName ?? "Guest"}
						</TableCell>
						<TableCell>
							<Badge variant={getStateVariant(order.state)} class="capitalize">
								{order.state.replace("_", " ")}
							</Badge>
						</TableCell>
						<TableCell class="text-sm font-medium">
							{(order.total / 100).toFixed(2)}
							{order.currencyCode}
						</TableCell>
						<TableCell class="text-sm text-gray-500">
							{new Date(order.createdAt).toLocaleDateString()}
						</TableCell>
						<TableCell class="text-right">
							<a href="/admin/orders/{order.id}" class="text-sm text-blue-600 hover:text-blue-900">
								View
							</a>
						</TableCell>
					</TableRow>
				{/each}
			{/if}
		</TableBody>
	</Table>
</div>
