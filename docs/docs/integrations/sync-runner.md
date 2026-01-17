---
sidebar_position: 4
---

# Sync Runner

Reusable pattern for synchronizing data from external systems (ERP, PIM, etc.).

## Defining a Sync Job

```typescript
import { type SyncJob } from '$lib/server/integrations';

const inventorySync: SyncJob<ErpItem, LocalVariant> = {
  name: 'erp-inventory',

  // Fetch all items from external system
  fetchExternal: () => erpClient.getInventory(),

  // Get unique identifier
  getExternalId: (item) => item.sku,

  // Find matching local record
  findLocal: async (sku) => {
    const [variant] = await db
      .select()
      .from(variants)
      .where(eq(variants.sku, sku));
    return variant ?? null;
  },

  // Create new record
  create: async (item) => {
    await db.insert(variants).values({
      sku: item.sku,
      stock: item.quantity
    });
  },

  // Update existing record
  update: async (item, local) => {
    await db.update(variants)
      .set({ stock: item.quantity })
      .where(eq(variants.id, local.id));
  },

  // Optional hooks
  onStart: async () => console.log('Starting sync'),
  onComplete: async (results) => console.log('Done:', results)
};
```

## Running Syncs

### Immediately

```typescript
import { runSync } from '$lib/server/integrations';

const results = await runSync(inventorySync);
// {
//   name: 'erp-inventory',
//   created: 10,
//   updated: 45,
//   errors: [],
//   durationMs: 1234
// }
```

### Via Queue

```typescript
import { registerSyncJob, triggerSync } from '$lib/server/integrations';

// Register for queue execution
registerSyncJob(inventorySync);

// Trigger manually
await triggerSync('erp-inventory');
```

### Scheduled

```typescript
import { scheduleSyncJob, syncIntervals } from '$lib/server/integrations';

// Run every hour
await scheduleSyncJob('erp-inventory', syncIntervals.hours(1));

// Other intervals
syncIntervals.minutes(30);
syncIntervals.hours(6);
syncIntervals.days(1);
```

## Single Item Sync

For webhook-triggered updates:

```typescript
import { syncSingleItem } from '$lib/server/integrations';

// When webhook receives inventory update
const result = await syncSingleItem(inventorySync, webhookPayload);
// { action: 'updated', externalId: 'SKU-001' }
```

## Error Handling

Errors are collected per item without stopping the sync:

```typescript
const results = await runSync(mySync);

if (results.errors.length > 0) {
  for (const error of results.errors) {
    console.error(`Failed: ${error.externalId}`, error.message);
  }
}
```
