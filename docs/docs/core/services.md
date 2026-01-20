---
sidebar_position: 3
---

# Services

All business logic lives in `src/lib/server/services/`. Each service is a singleton class.

## Product Service

```typescript
import { productService } from '$lib/server/services/products';

// Get by ID or slug
const product = await productService.getById(123);
const product = await productService.getBySlug('blue-shirt');

// List with pagination
const { items, total } = await productService.list({
  page: 1,
  limit: 20,
  languageCode: 'en'
});

// Search
const results = await productService.search('shirt', 'en');

// CRUD
await productService.create({ slug: 'new-product', ... });
await productService.update(123, { ... });
await productService.delete(123);
```

## Order Service

```typescript
import { orderService } from '$lib/server/services/orders';

// Create from cart
const order = await orderService.createFromCart(cartId, {
  customerId: 123,
  shippingAddress: { ... },
  billingAddress: { ... }
});

// State transitions
await orderService.confirm(orderId);
await orderService.ship(orderId, trackingNumber);
await orderService.deliver(orderId);
await orderService.cancel(orderId, reason);

// Query
const order = await orderService.getByCode('ORD-2024-001');
```

## Cart Service

```typescript
import { cartService } from "$lib/server/services/cart";

// Get or create by token
const cart = await cartService.getOrCreate(token);

// Modify cart
await cartService.addItem(cartId, variantId, quantity);
await cartService.updateQuantity(cartId, lineId, quantity);
await cartService.removeItem(cartId, lineId);
```

## Variant Service

```typescript
import { variantService } from "$lib/server/services/variants";

// Stock management
await variantService.updateStock(variantId, newStock);
await variantService.decrementStock(variantId, quantity);

// Get by SKU
const variant = await variantService.getBySku("SKU-001");
```

## Customer Service

```typescript
import { customerService } from "$lib/server/services/customers";

// Create from Clerk auth
const customer = await customerService.getOrCreateFromClerk(clerkUser);

// Query
const customer = await customerService.getByEmail("user@example.com");
```
