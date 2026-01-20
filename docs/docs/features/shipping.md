---
sidebar_position: 6
---

# Shipping

Hoikka supports multiple shipping providers with a unified interface.

## Shipping Flow

```
1. Customer enters address
2. Fetch available shipping rates
3. Customer selects shipping method
4. Create shipment after payment
5. Track shipment status
```

## Getting Rates

```typescript
const rates = await shippingService.getShippingRates(order);

// Returns available options
[
	{
		id: "posti_express",
		name: "Posti Express",
		price: 1290,
		estimatedDays: 1
	},
	{
		id: "matkahuolto_pickup",
		name: "Pickup Point",
		price: 590,
		estimatedDays: 2
	}
];
```

## Setting Shipping Method

```typescript
await shippingService.setShippingMethod(orderId, methodId, rateId, price);
```

## Creating Shipment

After order is confirmed:

```typescript
const shipment = await shippingService.createShipment(orderId);
// Returns: { trackingNumber: 'JJFI1234567890', labelUrl: '...' }
```

## Tracking

```typescript
const status = await shippingService.trackShipment(orderId);
// Returns: 'in_transit' | 'delivered' | etc.
```

## Shipping States

| State        | Description                  |
| ------------ | ---------------------------- |
| `pending`    | Awaiting shipment creation   |
| `shipped`    | Shipment created, in transit |
| `in_transit` | Package is being delivered   |
| `delivered`  | Package delivered            |

## Built-in Providers

### Posti (Finnish Post)

```typescript
// Supports:
// - Home delivery
// - Parcel lockers (SmartPost)
// - Pickup points
```

### Matkahuolto

```typescript
// Supports:
// - Pickup points
// - Home delivery
// - Near parcel points
```

## Adding Shipping Methods

Configure in admin or database:

```typescript
// shipping_methods table
{
  code: 'posti_express',
  name: 'Express Delivery',
  description: 'Next day delivery',
  price: 1290,
  enabled: true
}
```
