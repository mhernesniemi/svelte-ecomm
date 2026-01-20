---
sidebar_position: 2
---

# Form Actions

Most admin operations use SvelteKit form actions with progressive enhancement.

## Product Actions

```typescript
// src/routes/admin/products/[id]/+page.server.ts
export const actions = {
	update: async ({ request, params }) => {
		const formData = await request.formData();
		await productService.update(params.id, {
			slug: formData.get("slug")
			// ...
		});
	},

	delete: async ({ params }) => {
		await productService.delete(params.id);
		redirect(303, "/admin/products");
	},

	addVariant: async ({ request, params }) => {
		const formData = await request.formData();
		await variantService.create({
			productId: params.id,
			sku: formData.get("sku"),
			price: parseInt(formData.get("price")),
			stock: parseInt(formData.get("stock"))
		});
	},

	updateVariant: async ({ request }) => {
		const formData = await request.formData();
		await variantService.update(formData.get("variantId"), {
			price: parseInt(formData.get("price")),
			stock: parseInt(formData.get("stock"))
		});
	}
};
```

## Order Actions

```typescript
// src/routes/admin/orders/[id]/+page.server.ts
export const actions = {
	updateState: async ({ request, params }) => {
		const formData = await request.formData();
		const state = formData.get("state");

		switch (state) {
			case "confirmed":
				await orderService.confirm(params.id);
				break;
			case "shipped":
				await orderService.ship(params.id, formData.get("trackingNumber"));
				break;
			case "delivered":
				await orderService.deliver(params.id);
				break;
			case "cancelled":
				await orderService.cancel(params.id, formData.get("reason"));
				break;
		}
	},

	refundPayment: async ({ request }) => {
		const formData = await request.formData();
		await paymentService.refundPayment(formData.get("paymentId"));
	}
};
```

## Error Handling

Use `fail` for validation errors:

```typescript
import { fail } from '@sveltejs/kit';

export const actions = {
  create: async ({ request }) => {
    const formData = await request.formData();
    const sku = formData.get('sku');

    if (!sku) {
      return fail(400, { error: 'SKU is required', sku });
    }

    const existing = await variantService.getBySku(sku);
    if (existing) {
      return fail(400, { error: 'SKU already exists', sku });
    }

    await variantService.create({ ... });
  }
};
```

## Client-Side Handling

```svelte
<script>
	import { enhance } from "$app/forms";

	let { form } = $props();
</script>

{#if form?.error}
	<p class="text-red-600">{form.error}</p>
{/if}

<form method="POST" action="?/create" use:enhance>
	<input name="sku" value={form?.sku ?? ""} />
	<button type="submit">Create</button>
</form>
```

## Progressive Enhancement

With `use:enhance`, forms work without JavaScript but get enhanced UX when JS is available:

```svelte
<form
	method="POST"
	action="?/delete"
	use:enhance={() => {
		return async ({ result, update }) => {
			if (result.type === "redirect") {
				goto(result.location);
			} else {
				await update();
			}
		};
	}}
>
	<button type="submit">Delete</button>
</form>
```
