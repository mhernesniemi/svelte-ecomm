---
sidebar_position: 1
---

# Architecture

Hoikka follows a service-oriented architecture with clear separation of concerns.

## Service Pattern

Business logic lives in singleton services:

```typescript
// src/lib/server/services/products.ts
class ProductService {
  async getById(id: number) { ... }
  async create(data: NewProduct) { ... }
  async update(id: number, data: Partial<Product>) { ... }
}

export const productService = new ProductService();
```

Usage in routes:

```typescript
// src/routes/admin/products/[id]/+page.server.ts
import { productService } from '$lib/server/services/products';

export const load = async ({ params }) => {
  const product = await productService.getById(params.id);
  return { product };
};
```

## Provider Pattern

Payments and shipping use a provider pattern for easy swapping:

```typescript
interface PaymentProvider {
  code: string;
  createPayment(order: Order): Promise<PaymentInfo>;
  confirmPayment(transactionId: string): Promise<PaymentStatus>;
}

// Register multiple providers
const PROVIDERS = new Map<string, PaymentProvider>([
  ['stripe', new StripeProvider()],
  ['klarna', new KlarnaProvider()],
]);
```

## Data Flow

```
Route (load/action)
    ↓
Service (business logic)
    ↓
Database (Drizzle ORM)
```

## Form Actions

Most mutations use SvelteKit form actions with progressive enhancement:

```typescript
// +page.server.ts
export const actions = {
  update: async ({ request, params }) => {
    const formData = await request.formData();
    await productService.update(params.id, {
      name: formData.get('name'),
    });
  }
};
```

```svelte
<!-- +page.svelte -->
<form method="POST" action="?/update" use:enhance>
  <input name="name" value={product.name} />
  <button type="submit">Save</button>
</form>
```

## Remote Functions

For client-side interactions like cart operations, Hoikka uses SvelteKit's remote function pattern via API endpoints.

### Cart Remote Functions

```typescript
// src/routes/api/cart/+server.ts
import { cartService } from '$lib/server/services/cart';
import { json } from '@sveltejs/kit';

export const POST = async ({ request, cookies }) => {
  const token = cookies.get('cart_token');
  const { action, ...data } = await request.json();

  const cart = await cartService.getOrCreate(token);

  switch (action) {
    case 'add':
      await cartService.addItem(cart.id, data.variantId, data.quantity);
      break;
    case 'update':
      await cartService.updateQuantity(cart.id, data.lineId, data.quantity);
      break;
    case 'remove':
      await cartService.removeItem(cart.id, data.lineId);
      break;
  }

  const updatedCart = await cartService.getById(cart.id);
  return json({ cart: updatedCart });
};
```

### Client-Side Usage

```typescript
// src/lib/cart.ts
export async function addToCart(variantId: number, quantity = 1) {
  const response = await fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'add', variantId, quantity })
  });
  return response.json();
}

export async function updateCartItem(lineId: number, quantity: number) {
  const response = await fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update', lineId, quantity })
  });
  return response.json();
}

export async function removeFromCart(lineId: number) {
  const response = await fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'remove', lineId })
  });
  return response.json();
}
```

### Component Integration

```svelte
<script>
  import { addToCart } from '$lib/cart';

  let { variant } = $props();
  let loading = $state(false);

  async function handleAddToCart() {
    loading = true;
    await addToCart(variant.id, 1);
    loading = false;
  }
</script>

<button onclick={handleAddToCart} disabled={loading}>
  {loading ? 'Adding...' : 'Add to Cart'}
</button>
```

### Why Remote Functions?

- **Real-time updates** - Cart updates without page reload
- **Better UX** - Loading states and optimistic updates
- **Shared logic** - Same service layer as server-side code
- **Cookie-based auth** - Cart token automatically sent with requests
