---
sidebar_position: 5
---

# Payments

Hoikka uses a provider pattern for payments, with Stripe as the default.

## Payment Flow

```
1. Customer reaches checkout
2. Create payment via provider
3. Customer completes payment (redirect or inline)
4. Webhook confirms payment
5. Order is confirmed
```

## Stripe Integration

### Creating Payment

```typescript
const payment = await paymentService.createPayment(orderId, stripeMethodId);
// Returns: { clientSecret: 'pi_xxx_secret_xxx' }
```

### Frontend (Stripe Elements)

```svelte
<script>
  import { loadStripe } from '@stripe/stripe-js';

  const stripe = await loadStripe(PUBLIC_STRIPE_KEY);
  const elements = stripe.elements({ clientSecret });
</script>

<form on:submit={handleSubmit}>
  <div bind:this={paymentElement}></div>
  <button>Pay {formatPrice(order.total)}</button>
</form>
```

### Webhook Handler

```typescript
// src/routes/api/webhooks/stripe/+server.ts
export const POST = async ({ request }) => {
  const sig = request.headers.get('stripe-signature');
  const body = await request.text();

  const event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    await paymentService.confirmPayment(paymentIntent.id);
  }

  return new Response('OK');
};
```

## Payment States

| State | Description |
|-------|-------------|
| `pending` | Payment created, awaiting completion |
| `authorized` | Payment authorized, not captured |
| `settled` | Payment captured successfully |
| `declined` | Payment failed |
| `refunded` | Payment refunded |

## Refunds

```typescript
// Full refund
await paymentService.refundPayment(paymentId);

// Partial refund
await paymentService.refundPayment(paymentId, 1500);  // 15.00
```

## Adding Payment Methods

Configure in admin or database:

```typescript
// payment_methods table
{
  code: 'stripe',
  name: 'Credit Card',
  enabled: true
}
```
