<script lang="ts">
  import { enhance } from "$app/forms";
  import { toast } from "svelte-sonner";
  import { Button } from "$lib/components/admin/ui/button";
  import DeleteConfirmDialog from "$lib/components/admin/DeleteConfirmDialog.svelte";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import Pencil from "@lucide/svelte/icons/pencil";
  import Plus from "@lucide/svelte/icons/plus";
  import type { PageData, ActionData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let isSubmitting = $state(false);
  let showDelete = $state(false);
  let editingValueId = $state<number | null>(null);
  let showAddValue = $state(false);

  $effect(() => {
    if (form?.success) toast.success(form.message || "Success");
    if (form?.error) toast.error(form.error);
  });

  function getName(translations: { languageCode: string; name: string }[]): string {
    return translations.find((t) => t.languageCode === "en")?.name ?? "";
  }

  let facetName = $state("");
  let facetCode = $state("");

  $effect(() => {
    facetName = getName(data.facet.translations);
    facetCode = data.facet.code;
  });
</script>

<svelte:head><title>{getName(data.facet.translations)} | Facets | Admin</title></svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center gap-4">
    <a href="/admin/facets" class="text-gray-500 hover:text-gray-700" aria-label="Back to facets">
      <ChevronLeft class="h-5 w-5" />
    </a>
    <h1 class="text-2xl font-bold text-gray-900">{getName(data.facet.translations)}</h1>
  </div>

  <!-- Edit Facet -->
  <form
    method="POST"
    action="?/update"
    use:enhance={() => {
      isSubmitting = true;
      return async ({ update }) => {
        isSubmitting = false;
        await update({ reset: false });
      };
    }}
    class="overflow-hidden rounded-lg bg-white shadow"
  >
    <div class="p-6">
      <h2 class="mb-4 text-lg font-medium text-gray-900">Facet Details</h2>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label for="facet_name" class="mb-1 block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            id="facet_name"
            name="name_en"
            bind:value={facetName}
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label for="facet_code" class="mb-1 block text-sm font-medium text-gray-700">Code</label>
          <input
            type="text"
            id="facet_code"
            name="code"
            bind:value={facetCode}
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div class="mt-4 flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  </form>

  <!-- Values -->
  <div class="overflow-hidden rounded-lg bg-white shadow">
    <div class="flex items-center justify-between border-b border-gray-200 p-6">
      <div>
        <h2 class="text-lg font-medium text-gray-900">Values</h2>
        <p class="mt-1 text-sm text-gray-600">
          {data.facet.values.length} value{data.facet.values.length !== 1 ? "s" : ""}
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onclick={() => {
          showAddValue = !showAddValue;
          editingValueId = null;
        }}
      >
        <Plus class="mr-1 h-4 w-4" />
        Add Value
      </Button>
    </div>

    <!-- Add Value Form -->
    {#if showAddValue}
      <div class="border-b border-gray-200 bg-gray-50 p-6">
        <form
          method="POST"
          action="?/createValue"
          use:enhance={() => {
            return async ({ update }) => {
              await update();
              showAddValue = false;
            };
          }}
        >
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label for="new_value_name" class="mb-1 block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                id="new_value_name"
                name="name_en"
                placeholder="e.g., Red"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label for="new_value_code" class="mb-1 block text-sm font-medium text-gray-700">
                Code
              </label>
              <input
                type="text"
                id="new_value_code"
                name="code"
                placeholder="e.g., red"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onclick={() => (showAddValue = false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">Add Value</Button>
          </div>
        </form>
      </div>
    {/if}

    <!-- Values List -->
    {#if data.facet.values.length === 0 && !showAddValue}
      <div class="p-12 text-center">
        <p class="text-sm text-gray-500">
          No values yet. Add values to use this facet for filtering.
        </p>
      </div>
    {:else}
      <div>
        {#each data.facet.values as value, i}
          <div class={i > 0 ? "border-t border-gray-200" : ""}>
            <!-- Value row -->
            <button
              type="button"
              class="group flex w-full cursor-pointer items-center justify-between px-6 py-3 text-left {editingValueId ===
              value.id
                ? 'bg-gray-50'
                : 'hover:bg-gray-50'}"
              onclick={() => {
                editingValueId = editingValueId === value.id ? null : value.id;
                showAddValue = false;
              }}
            >
              <div class="flex items-center gap-3">
                <span class="font-medium text-gray-900">{getName(value.translations)}</span>
                <span class="text-sm text-gray-400">{value.code}</span>
              </div>
              <Pencil
                class="h-4 w-4 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 {editingValueId ===
                value.id
                  ? '!text-blue-600 !opacity-100'
                  : ''}"
              />
            </button>

            <!-- Value edit panel -->
            {#if editingValueId === value.id}
              <div class="border-t border-gray-100 bg-gray-50 px-6 pt-3 pb-4">
                <form
                  method="POST"
                  action="?/updateValue"
                  use:enhance={() => {
                    return async ({ update }) => {
                      await update();
                      editingValueId = null;
                    };
                  }}
                >
                  <input type="hidden" name="id" value={value.id} />
                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        for="edit_value_name_{value.id}"
                        class="mb-1 block text-sm font-medium text-gray-700"
                      >
                        Name
                      </label>
                      <input
                        type="text"
                        id="edit_value_name_{value.id}"
                        name="name_en"
                        value={getName(value.translations)}
                        class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label
                        for="edit_value_code_{value.id}"
                        class="mb-1 block text-sm font-medium text-gray-700"
                      >
                        Code
                      </label>
                      <input
                        type="text"
                        id="edit_value_code_{value.id}"
                        name="code"
                        value={value.code}
                        class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div class="mt-4 flex items-center justify-between">
                    <div class="flex gap-2">
                      <Button type="submit" size="sm">Save</Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onclick={() => (editingValueId = null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </form>
                <div class="mt-3 border-t border-gray-200 pt-3">
                  <form
                    method="POST"
                    action="?/deleteValue"
                    use:enhance={() => {
                      return async ({ update }) => {
                        await update();
                        editingValueId = null;
                      };
                    }}
                  >
                    <input type="hidden" name="id" value={value.id} />
                    <button type="submit" class="text-sm text-red-600 hover:text-red-800">
                      Delete this value
                    </button>
                  </form>
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <button
    type="button"
    class="text-sm text-red-600 hover:text-red-800"
    onclick={() => (showDelete = true)}
  >
    Delete this facet
  </button>
</div>

<DeleteConfirmDialog
  bind:open={showDelete}
  title="Delete Facet?"
  description="Are you sure you want to delete this facet and all its values? This action cannot be undone."
/>
