<script lang="ts">
  import { enhance } from "$app/forms";
  import { toast } from "svelte-sonner";
  import type { ColumnDef } from "@tanstack/table-core";
  import { DataTable, renderSnippet, renderComponent } from "$lib/components/admin/data-table";
  import { Button } from "$lib/components/admin/ui/button";
  import { Checkbox } from "$lib/components/admin/ui/checkbox";
  import UsersRound from "@lucide/svelte/icons/users-round";
  import type { PageData, ActionData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  type CustomerRow = (typeof data.customers)[0];

  let activeTab = $state<"customers" | "groups">("customers");
  let showCreateForm = $state(false);
  let expandedGroupId = $state<number | null>(null);

  // Show toast notifications
  $effect(() => {
    if (form?.success) toast.success(form.message || "Success");
    if (form?.error) toast.error(form.error);
  });

  function getCustomersNotInGroup(groupId: number) {
    const group = data.groups.find((g) => g.id === groupId);
    const customerIdsInGroup = new Set(group?.customers.map((c) => c.id) ?? []);
    return data.allCustomers.filter((c) => !customerIdsInGroup.has(c.id));
  }

  const columns: ColumnDef<CustomerRow>[] = [
    {
      id: "select",
      header: ({ table }) =>
        renderComponent(Checkbox, {
          checked: table.getIsAllPageRowsSelected(),
          indeterminate: table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected(),
          onCheckedChange: (value: boolean) => table.toggleAllPageRowsSelected(!!value),
          "aria-label": "Select all"
        }),
      cell: ({ row }) =>
        renderComponent(Checkbox, {
          checked: row.getIsSelected(),
          onCheckedChange: (value: boolean) => row.toggleSelected(!!value),
          "aria-label": "Select row"
        }),
      enableSorting: false
    },
    {
      accessorFn: (row) => `${row.firstName} ${row.lastName}`,
      id: "name",
      header: "Customer",
      cell: ({ row }) =>
        renderSnippet(customerCell, {
          id: row.original.id,
          firstName: row.original.firstName,
          lastName: row.original.lastName
        })
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => row.original.email
    },
    {
      accessorFn: (row) => row.phone ?? "-",
      id: "phone",
      header: "Phone"
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString()
    }
  ];
</script>

{#snippet customerCell({ id, firstName, lastName }: { id: number; firstName: string; lastName: string })}
  <a href="/admin/customers/{id}" class="font-medium text-blue-600 hover:text-blue-800">
    {firstName} {lastName}
  </a>
{/snippet}

<svelte:head><title>Customers | Admin</title></svelte:head>

<div>
  <h1 class="mb-6 text-2xl font-bold">Customers</h1>

  <!-- Tabs -->
  <div class="mb-6 border-b border-gray-200">
    <div class="flex gap-8">
      <button
        type="button"
        onclick={() => (activeTab = "customers")}
        class="border-b-2 pb-3 text-sm font-medium transition-colors {activeTab === 'customers'
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
      >
        All Customers
      </button>
      <button
        type="button"
        onclick={() => (activeTab = "groups")}
        class="border-b-2 pb-3 text-sm font-medium transition-colors {activeTab === 'groups'
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
      >
        Customer Groups
      </button>
    </div>
  </div>

  <!-- Customers Tab -->
  {#if activeTab === "customers"}
    <DataTable
      data={data.customers}
      {columns}
      searchPlaceholder="Search customers..."
      enableRowSelection={true}
    >
      {#snippet bulkActions({ selectedRows, table })}
        <form
          method="POST"
          action="?/deleteSelected"
          use:enhance={() => {
            return async ({ update }) => {
              table.resetRowSelection();
              await update();
            };
          }}
        >
          {#each selectedRows as row}
            <input type="hidden" name="ids" value={row.id} />
          {/each}
          <Button type="submit" variant="destructive" size="sm">
            Delete ({selectedRows.length})
          </Button>
        </form>
      {/snippet}
    </DataTable>
  {/if}

  <!-- Customer Groups Tab -->
  {#if activeTab === "groups"}
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-600">Manage B2B customer groups for pricing</p>
        <Button type="button" onclick={() => (showCreateForm = !showCreateForm)}>Add Group</Button>
      </div>

      <!-- Create Form -->
      {#if showCreateForm}
        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="mb-4 font-semibold">Create New Group</h2>
          <form
            method="POST"
            action="?/createGroup"
            use:enhance={() => {
              return async ({ result, update }) => {
                await update({ reset: false });
                if (result.type === "success") {
                  showCreateForm = false;
                }
              };
            }}
          >
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label for="group_name" class="mb-1 block text-sm font-medium text-gray-700"
                  >Name</label
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
              <Button type="button" variant="outline" onclick={() => (showCreateForm = false)}>
                Cancel
              </Button>
              <Button type="submit">Create Group</Button>
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
            <Button type="button" onclick={() => (showCreateForm = true)}>Add Group</Button>
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onclick={() => (expandedGroupId = expandedGroupId === group.id ? null : group.id)}
                  >
                    {expandedGroupId === group.id ? "Hide" : "Manage"} Customers
                  </Button>
                  <form method="POST" action="?/deleteGroup" use:enhance>
                    <input type="hidden" name="id" value={group.id} />
                    <button type="submit" class="text-sm text-red-600 hover:text-red-800">
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
                    <form
                      method="POST"
                      action="?/addCustomer"
                      use:enhance
                      class="flex items-end gap-4"
                    >
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
                      <Button type="submit" size="sm">Add</Button>
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
                        <div
                          class="flex items-center justify-between rounded-lg bg-gray-100 px-3 py-2"
                        >
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
  {/if}
</div>
