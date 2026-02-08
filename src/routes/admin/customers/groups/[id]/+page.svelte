<script lang="ts">
  import { enhance } from "$app/forms";
  import { toast } from "svelte-sonner";
  import { Button } from "$lib/components/admin/ui/button";
  import * as Popover from "$lib/components/admin/ui/popover";
  import * as Command from "$lib/components/admin/ui/command";
  import DeleteConfirmDialog from "$lib/components/admin/DeleteConfirmDialog.svelte";
  import ChevronsUpDown from "@lucide/svelte/icons/chevrons-up-down";
  import Check from "@lucide/svelte/icons/check";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import type { PageData, ActionData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let isSubmitting = $state(false);
  let showDelete = $state(false);
  let comboboxOpen = $state(false);
  let selectedCustomerId = $state<number | null>(null);

  $effect(() => {
    if (form?.success) {
      toast.success(form.message || "Success");
      selectedCustomerId = null;
    }
    if (form?.error) toast.error(form.error);
  });

  let groupName = $state("");
  let groupDescription = $state("");

  $effect(() => {
    groupName = data.group.name;
    groupDescription = data.group.description ?? "";
  });

  const customerIdsInGroup = $derived(new Set(data.groupCustomers.map((c) => c.id)));
  const availableCustomers = $derived(
    data.allCustomers.filter((c) => !customerIdsInGroup.has(c.id))
  );

  const selectedCustomerLabel = $derived(() => {
    if (!selectedCustomerId) return "Select a customer...";
    const c = availableCustomers.find((c) => c.id === selectedCustomerId);
    return c ? `${c.firstName} ${c.lastName} (${c.email})` : "Select a customer...";
  });
</script>

<svelte:head><title>{data.group.name} | Customer Groups | Admin</title></svelte:head>

<div class="space-y-6">
  <div class="mb-6 flex items-center justify-between">
    <a href="/admin/customers?tab=groups" class="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
      ><ChevronLeft class="h-4 w-4" /> Back to Customer Groups</a
    >
  </div>
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold">{data.group.name}</h1>
    <Button type="submit" form="group-form" disabled={isSubmitting}>
      {isSubmitting ? "Saving..." : "Save Changes"}
    </Button>
  </div>

  <!-- Edit Group -->
  <form
    id="group-form"
    method="POST"
    action="?/update"
    use:enhance={() => {
      isSubmitting = true;
      return async ({ update }) => {
        isSubmitting = false;
        await update({ reset: false });
      };
    }}
    class="overflow-hidden rounded-lg bg-surface shadow"
  >
    <div class="p-6">
      <h2 class="mb-4 text-lg font-medium text-foreground">Group Details</h2>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label for="group_name" class="mb-1 block text-sm font-medium text-foreground-secondary"
            >Name</label
          >
          <input
            type="text"
            id="group_name"
            name="name"
            bind:value={groupName}
            required
            class="w-full rounded-lg border border-input-border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label
            for="group_description"
            class="mb-1 block text-sm font-medium text-foreground-secondary"
          >
            Description
          </label>
          <input
            type="text"
            id="group_description"
            name="description"
            bind:value={groupDescription}
            placeholder="Optional"
            class="w-full rounded-lg border border-input-border px-3 py-2 text-sm"
          />
        </div>
      </div>
    </div>
  </form>

  <!-- Customers Section -->
  <div class="overflow-hidden rounded-lg bg-surface shadow">
    <div class="border-b border-border p-6">
      <h2 class="text-lg font-medium text-foreground">Customers</h2>
      <p class="mt-1 text-sm text-foreground-tertiary">
        {data.groupCustomers.length} customer{data.groupCustomers.length !== 1 ? "s" : ""} in this group
      </p>
    </div>

    <!-- Add Customer -->
    <div class="border-b border-border bg-background px-6 py-4">
      <h3 class="mb-3 text-sm font-medium text-foreground-secondary">Add Customer to Group</h3>
      {#if availableCustomers.length === 0}
        <p class="text-sm text-muted-foreground">All customers are already in this group</p>
      {:else}
        <form method="POST" action="?/addCustomer" use:enhance class="flex items-end gap-4">
          <input type="hidden" name="customerId" value={selectedCustomerId ?? ""} />
          <div>
            <Popover.Root bind:open={comboboxOpen}>
              <Popover.Trigger
                class="flex h-9 w-full items-center justify-between rounded-lg border border-input-border bg-surface px-3 py-2 text-sm hover:bg-hover"
              >
                <span class={selectedCustomerId ? "text-foreground" : "text-muted-foreground"}>
                  {selectedCustomerLabel()}
                </span>
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 text-placeholder" />
              </Popover.Trigger>
              <Popover.Content class="w-[var(--bits-popover-trigger-width)] p-0" align="start">
                <Command.Root>
                  <Command.Input placeholder="Search customers..." />
                  <Command.List class="max-h-60">
                    <Command.Empty>No customers found.</Command.Empty>
                    {#each availableCustomers as customer}
                      <Command.Item
                        value="{customer.firstName} {customer.lastName} {customer.email}"
                        onSelect={() => {
                          selectedCustomerId = customer.id;
                          comboboxOpen = false;
                        }}
                      >
                        <Check
                          class="mr-2 h-4 w-4 {selectedCustomerId === customer.id
                            ? 'opacity-100'
                            : 'opacity-0'}"
                        />
                        <span>
                          {customer.firstName}
                          {customer.lastName}
                          <span class="text-muted-foreground">({customer.email})</span>
                        </span>
                      </Command.Item>
                    {/each}
                  </Command.List>
                </Command.Root>
              </Popover.Content>
            </Popover.Root>
          </div>
          <Button type="submit" size="sm" disabled={!selectedCustomerId}>Add</Button>
        </form>
      {/if}
    </div>

    <!-- Customers List -->
    <div class="px-6 py-4">
      {#if data.groupCustomers.length === 0}
        <p class="text-sm text-muted-foreground">No customers in this group yet</p>
      {:else}
        <div class="space-y-2">
          {#each data.groupCustomers as customer}
            <div class="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
              <div>
                <a
                  href="/admin/customers/{customer.id}"
                  class="font-medium hover:text-blue-600 dark:text-blue-400"
                >
                  {customer.firstName}
                  {customer.lastName}
                </a>
                <span class="ml-2 text-sm text-muted-foreground">{customer.email}</span>
              </div>
              <form method="POST" action="?/removeCustomer" use:enhance>
                <input type="hidden" name="customerId" value={customer.id} />
                <button
                  type="submit"
                  class="text-sm text-red-600 hover:text-red-800 dark:text-red-700"
                >
                  Remove
                </button>
              </form>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <button
    type="button"
    class="text-sm text-red-600 hover:text-red-800 dark:text-red-700"
    onclick={() => (showDelete = true)}
  >
    Delete this group
  </button>
</div>

<DeleteConfirmDialog
  bind:open={showDelete}
  title="Delete Group?"
  description="Are you sure you want to delete this customer group? This action cannot be undone."
/>
