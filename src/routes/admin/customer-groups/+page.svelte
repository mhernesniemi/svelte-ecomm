<script lang="ts">
  import { enhance } from "$app/forms";
  import type { PageData } from "./$types";
  import UsersRound from "@lucide/svelte/icons/users-round";

  let { data }: { data: PageData } = $props();

  let showCreateForm = $state(false);
  let expandedGroupId = $state<number | null>(null);

  function getCustomersNotInGroup(groupId: number) {
    const group = data.groups.find((g) => g.id === groupId);
    const customerIdsInGroup = new Set(group?.customers.map((c) => c.id) ?? []);
    return data.allCustomers.filter((c) => !customerIdsInGroup.has(c.id));
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Customer Groups</h1>
      <p class="mt-1 text-sm text-gray-600">Manage B2B customer groups for pricing</p>
    </div>
    <button
      type="button"
      onclick={() => (showCreateForm = !showCreateForm)}
      class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
    >
      Add Group
    </button>
  </div>

  <!-- Create Form -->
  {#if showCreateForm}
    <div class="mb-6 rounded-lg bg-white p-6 shadow">
      <h2 class="mb-4 font-semibold">Create New Group</h2>
      <form
        method="POST"
        action="?/create"
        use:enhance={() => {
          return async ({ update }) => {
            await update();
            showCreateForm = false;
          };
        }}
      >
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label for="group_name" class="mb-1 block text-sm font-medium text-gray-700">Name</label
            >
            <input
              type="text"
              id="group_name"
              name="name"
              placeholder="e.g., Wholesale"
              class="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label for="group_description" class="mb-1 block text-sm font-medium text-gray-700"
              >Description</label
            >
            <input
              type="text"
              id="group_description"
              name="description"
              placeholder="Optional"
              class="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onclick={() => (showCreateForm = false)}
            class="rounded-lg border border-gray-200 px-4 py-2"
          >
            Cancel
          </button>
          <button type="submit" class="rounded-lg bg-blue-600 px-4 py-2 text-white">
            Create Group
          </button>
        </div>
      </form>
    </div>
  {/if}

  <!-- Groups List -->
  {#if data.groups.length === 0}
    <div class="rounded-lg border border-dashed border-gray-300 p-12 text-center">
      <UsersRound class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900">No customer groups</h3>
      <p class="mt-1 text-sm text-gray-500">Get started by creating a new customer group.</p>
      <div class="mt-6">
        <button
          type="button"
          onclick={() => (showCreateForm = true)}
          class="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add Group
        </button>
      </div>
    </div>
  {:else}
    <div class="space-y-6">
      {#each data.groups as group}
        <div class="rounded-lg bg-white shadow">
          <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h2 class="font-semibold">{group.name}</h2>
              <p class="text-sm text-gray-500">
                {group.customerCount} customer{group.customerCount !== 1 ? "s" : ""}
                {#if group.description}
                  <span class="mx-1">·</span> {group.description}
                {/if}
              </p>
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                onclick={() => (expandedGroupId = expandedGroupId === group.id ? null : group.id)}
                class="rounded border border-gray-200 px-3 py-1 text-sm hover:bg-gray-50"
              >
                {expandedGroupId === group.id ? "Hide" : "Manage"} Customers
              </button>
              <form method="POST" action="?/delete" use:enhance>
                <input type="hidden" name="id" value={group.id} />
                <button type="submit" class="px-3 py-1 text-sm text-red-600 hover:text-red-800">
                  Delete
                </button>
              </form>
            </div>
          </div>

          <!-- Expanded Customer Management -->
          {#if expandedGroupId === group.id}
            <div class="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h3 class="mb-3 text-sm font-medium text-gray-700">Add Customer to Group</h3>
              {#if getCustomersNotInGroup(group.id).length === 0}
                <p class="text-sm text-gray-500">All customers are already in this group</p>
              {:else}
                <form method="POST" action="?/addCustomer" use:enhance class="flex items-end gap-4">
                  <input type="hidden" name="groupId" value={group.id} />
                  <div class="flex-1">
                    <select
                      name="customerId"
                      class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="">Select a customer...</option>
                      {#each getCustomersNotInGroup(group.id) as customer}
                        <option value={customer.id}>
                          {customer.firstName}
                          {customer.lastName} ({customer.email})
                        </option>
                      {/each}
                    </select>
                  </div>
                  <button type="submit" class="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">
                    Add
                  </button>
                </form>
              {/if}
            </div>

            <!-- Customers in Group -->
            <div class="px-6 py-4">
              <h3 class="mb-3 text-sm font-medium text-gray-700">Customers in Group</h3>
              {#if group.customers.length === 0}
                <p class="text-sm text-gray-500">No customers in this group yet</p>
              {:else}
                <div class="space-y-2">
                  {#each group.customers as customer}
                    <div class="flex items-center justify-between rounded-lg bg-gray-100 px-3 py-2">
                      <div>
                        <span class="font-medium">{customer.firstName} {customer.lastName}</span>
                        <span class="ml-2 text-sm text-gray-500">{customer.email}</span>
                      </div>
                      <form method="POST" action="?/removeCustomer" use:enhance>
                        <input type="hidden" name="groupId" value={group.id} />
                        <input type="hidden" name="customerId" value={customer.id} />
                        <button type="submit" class="text-sm text-red-600 hover:text-red-800">
                          Remove
                        </button>
                      </form>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
