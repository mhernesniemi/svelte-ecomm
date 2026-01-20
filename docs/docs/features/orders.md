---
sidebar_position: 2
---

# Orders

Orders track customer purchases through their lifecycle.

## Order States

```
pending → confirmed → shipped → delivered
                   ↘ cancelled
```

| State       | Description               |
| ----------- | ------------------------- |
| `pending`   | Created, awaiting payment |
| `confirmed` | Payment received          |
| `shipped`   | Shipped to customer       |
| `delivered` | Received by customer      |
| `cancelled` | Order cancelled           |

## Creating Orders

Orders are created from carts:

```typescript
const order = await orderService.createFromCart(cartId, {
  customerId: 123,  // optional for guest checkout
  shippingAddress: {
    firstName: 'John',
    lastName: 'Doe',
    street: '123 Main St',
    city: 'Helsinki',
    postalCode: '00100',
    country: 'FI'
  },
  billingAddress: { ... }
});
```

## State Transitions

```typescript
// After successful payment
await orderService.confirm(orderId);

// When shipped
await orderService.ship(orderId, "TRACK123456");

// When delivered
await orderService.deliver(orderId);

// Cancel with reason
await orderService.cancel(orderId, "Customer requested cancellation");
```

## Order Lines

Each order contains line items:

```typescript
order.lines = [
	{
		variantId: 456,
		variant: { sku: "SHIRT-M", name: "Blue Shirt - Medium" },
		quantity: 2,
		unitPrice: 2999,
		total: 5998
	}
];
```

## Order Code

Orders have a human-readable code:

```typescript
// Format: ORD-YYYY-XXXXX
order.code = "ORD-2024-00001";

// Lookup by code
const order = await orderService.getByCode("ORD-2024-00001");
```

## Guest Orders

Orders can be placed without an account:

```typescript
const order = await orderService.createFromCart(cartId, {
  customerId: null,  // guest
  email: 'guest@example.com',
  shippingAddress: { ... }
});
```
