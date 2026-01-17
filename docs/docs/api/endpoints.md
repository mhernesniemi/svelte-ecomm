---
sidebar_position: 1
---

# API Endpoints

Hoikka uses a mix of API routes for AJAX operations and form actions for mutations.

## Search

```http
GET /api/search?q={query}&lang={languageCode}
```

**Response:**
```json
{
  "products": [
    {
      "id": 1,
      "slug": "blue-shirt",
      "name": "Blue Shirt",
      "price": 2999,
      "image": "/uploads/shirt.jpg"
    }
  ]
}
```

## Cart

### Add Item

```http
POST /api/cart/add
Content-Type: application/json

{
  "variantId": 123,
  "quantity": 1
}
```

### Update Quantity

```http
POST /api/cart/update
Content-Type: application/json

{
  "lineId": 456,
  "quantity": 2
}
```

### Remove Item

```http
POST /api/cart/remove
Content-Type: application/json

{
  "lineId": 456
}
```

## Checkout

### Create Payment

```http
POST /api/checkout/create-payment
Content-Type: application/json

{
  "orderId": 789,
  "methodId": 1
}
```

**Response (Stripe):**
```json
{
  "clientSecret": "pi_xxx_secret_xxx"
}
```

### Confirm Payment

```http
POST /api/checkout/confirm-payment
Content-Type: application/json

{
  "paymentId": 101
}
```

## Webhooks

### Stripe

```http
POST /api/webhooks/stripe
```

Receives Stripe webhook events. Requires `stripe-signature` header.

### Custom ERP

```http
POST /api/webhooks/erp
```

Custom webhook endpoint for ERP integration.

## Authentication

API routes that require authentication check the Clerk session:

```typescript
export const GET = async ({ locals }) => {
  const { userId } = locals.auth;
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }
  // ...
};
```

## Error Responses

```json
{
  "error": "Error message"
}
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request / validation error |
| 401 | Unauthorized |
| 404 | Not found |
| 500 | Server error |
