---
sidebar_position: 3
---

# Cart

Hoikka uses cookie-based cart tokens for guest-friendly shopping.

## Cart Tokens

```typescript
// In +page.server.ts
export const load = async ({ cookies }) => {
  const token = cookies.get('cart_token') ?? crypto.randomUUID();

  // Set cookie if new
  cookies.set('cart_token', token, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30  // 30 days
  });

  const cart = await cartService.getOrCreate(token);
  return { cart };
};
```

## Cart Operations

### Add Item

```typescript
await cartService.addItem(cartId, variantId, quantity);

// If item exists, quantity is increased
```

### Update Quantity

```typescript
await cartService.updateQuantity(cartId, lineId, newQuantity);

// Quantity 0 removes the item
```

### Remove Item

```typescript
await cartService.removeItem(cartId, lineId);
```

### Clear Cart

```typescript
await cartService.clear(cartId);
```

## Cart Structure

```typescript
interface Cart {
  id: number;
  token: string;
  lines: CartLine[];
  subtotal: number;
  createdAt: Date;
}

interface CartLine {
  id: number;
  variantId: number;
  variant: ProductVariant;
  quantity: number;
  unitPrice: number;
  total: number;
}
```

## Converting to Order

```typescript
// At checkout
const order = await orderService.createFromCart(cart.id, {
  shippingAddress: formData.shippingAddress,
  billingAddress: formData.billingAddress
});

// Cart is cleared after successful order creation
```

## Stock Validation

Stock is validated when adding items:

```typescript
// Throws if insufficient stock
await cartService.addItem(cartId, variantId, 100);
// Error: Insufficient stock for variant SKU-001
```

Stock is reserved when the order is created and decremented when confirmed.
