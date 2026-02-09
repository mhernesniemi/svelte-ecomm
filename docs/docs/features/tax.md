---
sidebar_position: 8
---

# Tax (VAT)

Hoikka uses a **gross pricing strategy** where all prices include VAT. This follows Finnish e-commerce conventions.

## Key Concepts

- **Gross prices**: All stored prices include VAT
- **Back-calculation**: Net prices are calculated from gross at checkout
- **Group-based exemption**: Customers in a tax-exempt group pay net prices

## Tax Rates

Finnish VAT rates are supported:

| Code       | Rate | Description             |
| ---------- | ---- | ----------------------- |
| `standard` | 24%  | Default (most products) |
| `food`     | 14%  | Food items              |
| `books`    | 10%  | Books, newspapers       |
| `zero`     | 0%   | Exports, exempt         |

## Product Tax Code

Each product has a `taxCode` field:

```typescript
// Default is 'standard' (24%)
await productService.update(productId, {
	taxCode: "food" // 14% VAT
});
```

## Tax Calculation

Tax is back-calculated from the gross price:

```typescript
import { taxService } from "$lib/server/services/tax.js";

// Calculate tax breakdown
const result = taxService.calculateTax(2480, 0.24);
// { gross: 2480, net: 2000, tax: 480 }

// Formula:
// net = gross / (1 + taxRate)
// tax = gross - net
```

## Order Tax Fields

Orders track tax information:

```typescript
order = {
	subtotal: 4960, // Gross subtotal (VAT-inclusive)
	taxTotal: 960, // Total VAT amount
	totalNet: 4000, // Subtotal minus VAT
	isTaxExempt: false, // Group-based exemption flag
	total: 5960 // Final total
};
```

## Order Line Tax Fields

Each order line stores tax details:

```typescript
orderLine = {
	unitPrice: 2480, // Gross unit price
	unitPriceNet: 2000, // Net unit price
	lineTotal: 4960, // Gross line total
	lineTotalNet: 4000, // Net line total
	taxCode: "standard",
	taxRate: "0.24",
	taxAmount: 960
};
```

## B2B Tax Exemption

Tax exemption is group-based. A customer group with `isTaxExempt = true` makes all its members tax-exempt:

```typescript
// Check exemption — looks up customer's groups for isTaxExempt flag
const isExempt = await taxService.isCustomerTaxExempt(customerId);

// For exempt customers:
// - Prices shown without VAT
// - taxTotal = 0
// - order.isTaxExempt = true
// - Invoice shows reverse charge notice
```

To make customers tax-exempt: create a customer group with `isTaxExempt` enabled in Admin > Customers > Groups, then add the customer to that group.

## Admin: Setting Tax Code

In the admin panel, product tax code can be set:

1. Edit product > Common Fields section
2. Select "Tax Rate" dropdown
3. Choose: Standard (24%), Food (14%), Books (10%), or Zero (0%)

## Checkout Display

The checkout shows tax breakdown:

```
Subtotal:       49.60 EUR
VAT (included):  9.60 EUR
Shipping:        5.00 EUR
─────────────────────────
Total:          54.60 EUR
```

For tax-exempt customers:

```
Subtotal:       40.00 EUR
VAT:            Tax exempt (B2B)
Shipping:        5.00 EUR
─────────────────────────
Total:          45.00 EUR
Net amount: 45.00 EUR (VAT 0%)
```

## Tax Service API

```typescript
import { taxService } from "$lib/server/services/tax.js";

// Get rate for a tax code
const rate = await taxService.getTaxRate("standard"); // 0.24

// Get all available rates
const rates = await taxService.getAllTaxRates();

// Calculate tax from gross price
const { gross, net, tax } = taxService.calculateTax(2480, 0.24);

// Calculate line item tax
const lineTax = taxService.calculateLineTax(grossUnitPrice, quantity, taxRate, isTaxExempt);

// Check customer exemption (group-based)
const exempt = await taxService.isCustomerTaxExempt(customerId);

// Seed default rates (run once)
await taxService.seedDefaultRates();
```
