---
sidebar_position: 8
---

# Tax (VAT)

Hoikka uses a **gross pricing strategy** where all prices include VAT. This follows Finnish e-commerce conventions.

## Key Concepts

- **Gross prices**: All stored prices include VAT
- **Back-calculation**: Net prices are calculated from gross at checkout
- **B2B exemption**: Approved B2B customers with VAT ID pay net prices

## Tax Rates

Finnish VAT rates are supported:

| Code       | Rate | Description           |
| ---------- | ---- | --------------------- |
| `standard` | 24%  | Default (most products) |
| `food`     | 14%  | Food items            |
| `books`    | 10%  | Books, newspapers     |
| `zero`     | 0%   | Exports, exempt       |

## Product Tax Code

Each product has a `taxCode` field:

```typescript
// Default is 'standard' (24%)
const product = {
  id: 123,
  taxCode: 'standard',  // or 'food', 'books', 'zero'
  // ...
};

// Update product tax code
await productService.update(productId, {
  taxCode: 'food'  // 14% VAT
});
```

## Tax Calculation

Tax is back-calculated from the gross price:

```typescript
import { taxService } from '$lib/server/services/tax.js';

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
  subtotal: 4960,      // Gross subtotal (VAT-inclusive)
  taxTotal: 960,       // Total VAT amount
  totalNet: 4000,      // Subtotal minus VAT
  isTaxExempt: false,  // B2B exemption flag
  total: 5960          // Final total
};
```

## Order Line Tax Fields

Each order line stores tax details:

```typescript
orderLine = {
  unitPrice: 2480,      // Gross unit price
  unitPriceNet: 2000,   // Net unit price
  lineTotal: 4960,      // Gross line total
  lineTotalNet: 4000,   // Net line total
  taxCode: 'standard',
  taxRate: '0.24',
  taxAmount: 960
};
```

## B2B Tax Exemption

Approved B2B customers with a VAT ID are tax-exempt:

```typescript
// Customer must have:
// - b2bStatus: 'approved'
// - vatId: 'FI12345678'

// Check exemption
const isExempt = await taxService.isCustomerTaxExempt(customerId);

// For exempt customers:
// - Prices shown without VAT
// - taxTotal = 0
// - isTaxExempt = true
// - Invoice shows reverse charge notice
```

## Admin: Setting Tax Code

In the admin panel, product tax code can be set:

1. Edit product → Common Fields section
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

For B2B customers:

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
import { taxService } from '$lib/server/services/tax.js';

// Get rate for a tax code
const rate = await taxService.getTaxRate('standard');  // 0.24

// Get all available rates
const rates = await taxService.getAllTaxRates();
// [{ code: 'standard', rate: 0.24, name: 'Standard VAT (24%)' }, ...]

// Calculate tax from gross price
const { gross, net, tax } = taxService.calculateTax(2480, 0.24);

// Calculate line item tax
const lineTax = taxService.calculateLineTax(
  grossUnitPrice,
  quantity,
  taxRate,
  isTaxExempt
);

// Check customer exemption
const exempt = await taxService.isCustomerTaxExempt(customerId);

// Seed default rates (run once)
await taxService.seedDefaultRates();
```

## Database Schema

```sql
-- Tax rates table
CREATE TABLE tax_rates (
  code VARCHAR(20) PRIMARY KEY,
  rate NUMERIC(5,4) NOT NULL,  -- 0.2400 for 24%
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Products: tax_code column
ALTER TABLE products ADD COLUMN tax_code VARCHAR(20) DEFAULT 'standard';

-- Customers: vat_id column
ALTER TABLE customers ADD COLUMN vat_id VARCHAR(50);

-- Orders: tax fields
ALTER TABLE orders ADD COLUMN tax_total INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN total_net INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN is_tax_exempt BOOLEAN DEFAULT FALSE;

-- Order lines: tax fields
ALTER TABLE order_lines ADD COLUMN tax_code VARCHAR(20) DEFAULT 'standard';
ALTER TABLE order_lines ADD COLUMN tax_rate NUMERIC(5,4) DEFAULT 0.24;
ALTER TABLE order_lines ADD COLUMN tax_amount INTEGER DEFAULT 0;
ALTER TABLE order_lines ADD COLUMN unit_price_net INTEGER DEFAULT 0;
ALTER TABLE order_lines ADD COLUMN line_total_net INTEGER DEFAULT 0;
```
