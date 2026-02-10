<script lang="ts">
  import { enhance } from "$app/forms";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { toast } from "svelte-sonner";
  import { Button } from "$lib/components/admin/ui/button";
  import DeleteConfirmDialog from "$lib/components/admin/DeleteConfirmDialog.svelte";
  import TranslationEditor from "$lib/components/admin/TranslationEditor.svelte";
  import { translationsToMap, TRANSLATION_LANGUAGES } from "$lib/config/languages.js";
  import Pencil from "@lucide/svelte/icons/pencil";
  import Plus from "@lucide/svelte/icons/plus";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import type { PageData, ActionData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let isSubmitting = $state(false);
  let showDelete = $state(false);
  let editingValueId = $state<number | null>(null);
  let showAddValue = $state(false);

  onMount(() => {
    if ($page.url.searchParams.has("created")) {
      toast.success("Facet created successfully");
      history.replaceState({}, "", $page.url.pathname);
    }
  });

  $effect(() => {
    if (form?.error) toast.error(form.error);
  });

  let facetName = $state("");
  let facetCode = $state("");

  $effect(() => {
    facetName = data.facet.name ?? "";
    facetCode = data.facet.code;
  });
</script>

<svelte:head><title>{data.facet.name} | Facets | Admin</title></svelte:head>

<div class="space-y-6">
  <div class="mb-6 flex items-center justify-between">
    <a
      href="/admin/facets"
      class="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
      ><ChevronLeft class="h-4 w-4" /> Back to Facets</a
    >
  </div>
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold">{data.facet.name}</h1>
    <Button type="submit" form="facet-form" disabled={isSubmitting}>
      {isSubmitting ? "Saving..." : "Save Changes"}
    </Button>
  </div>

  <!-- Two Column Layout -->
  <div class="flex flex-col gap-6 lg:flex-row">
    <!-- Main Content (Left) -->
    <div class="flex-1 space-y-6">
  <!-- Edit Facet -->
  <form
    id="facet-form"
    method="POST"
    action="?/update"
    use:enhance={() => {
      isSubmitting = true;
      return async ({ result, update }) => {
        await update({ reset: false });
        isSubmitting = false;
        if (result.type === "success") {
          toast.success("Facet updated");
        }
      };
    }}
    class="overflow-hidden rounded-lg bg-surface shadow"
  >
    <div class="p-6">
      <h2 class="mb-4 text-lg font-medium text-foreground">Facet Details</h2>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label for="facet_name" class="mb-1 block text-sm font-medium text-foreground-secondary"
            >Name</label
          >
          <input
            type="text"
            id="facet_name"
            name="name_en"
            bind:value={facetName}
            class="w-full rounded-lg border border-input-border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label for="facet_code" class="mb-1 block text-sm font-medium text-foreground-secondary"
            >Code</label
          >
          <input
            type="text"
            id="facet_code"
            name="code"
            bind:value={facetCode}
            class="w-full rounded-lg border border-input-border px-3 py-2 text-sm"
          />
        </div>
      </div>
    </div>
  </form>

  <!-- Values -->
  <div class="overflow-hidden rounded-lg bg-surface shadow">
    <div class="flex items-center justify-between border-b border-border p-6">
      <div>
        <h2 class="text-lg font-medium text-foreground">Values</h2>
        <p class="mt-1 text-sm text-foreground-tertiary">
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
        <Plus class="h-4 w-4" />
        Add Value
      </Button>
    </div>

    <!-- Add Value Form -->
    {#if showAddValue}
      <div class="border-b border-border bg-background p-6">
        <form
          method="POST"
          action="?/createValue"
          use:enhance={() => {
            return async ({ result, update }) => {
              await update();
              if (result.type === "success") {
                toast.success("Value added");
              }
              showAddValue = false;
            };
          }}
        >
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                for="new_value_name"
                class="mb-1 block text-sm font-medium text-foreground-secondary"
              >
                Name
              </label>
              <input
                type="text"
                id="new_value_name"
                name="name_en"
                placeholder="e.g., Red"
                class="w-full rounded-lg border border-input-border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label
                for="new_value_code"
                class="mb-1 block text-sm font-medium text-foreground-secondary"
              >
                Code
              </label>
              <input
                type="text"
                id="new_value_code"
                name="code"
                placeholder="e.g., red"
                class="w-full rounded-lg border border-input-border px-3 py-2 text-sm"
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
        <p class="text-sm text-muted-foreground">
          No values yet. Add values to use this facet for filtering.
        </p>
      </div>
    {:else}
      <div>
        {#each data.facet.values as value, i}
          <div class={i > 0 ? "border-t border-border" : ""}>
            <!-- Value row -->
            <button
              type="button"
              class="group flex w-full cursor-pointer items-center justify-between px-6 py-3 text-left {editingValueId ===
              value.id
                ? 'bg-background'
                : 'hover:bg-hover'}"
              onclick={() => {
                editingValueId = editingValueId === value.id ? null : value.id;
                showAddValue = false;
              }}
            >
              <div class="flex items-center gap-3">
                <span class="font-medium text-foreground">{value.name}</span>
                <span class="text-sm text-placeholder">{value.code}</span>
              </div>
              <Pencil
                class="h-4 w-4 text-placeholder opacity-0 transition-opacity group-hover:opacity-100 {editingValueId ===
                value.id
                  ? '!text-blue-600 !opacity-100 dark:text-blue-400'
                  : ''}"
              />
            </button>

            <!-- Value edit panel -->
            {#if editingValueId === value.id}
              <div class="border-t border-border bg-background px-6 pt-3 pb-4">
                <form
                  method="POST"
                  action="?/updateValue"
                  use:enhance={() => {
                    return async ({ result, update }) => {
                      await update();
                      if (result.type === "success") {
                        toast.success("Value updated");
                      }
                      editingValueId = null;
                    };
                  }}
                >
                  <input type="hidden" name="id" value={value.id} />
                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        for="edit_value_name_{value.id}"
                        class="mb-1 block text-sm font-medium text-foreground-secondary"
                      >
                        Name
                      </label>
                      <input
                        type="text"
                        id="edit_value_name_{value.id}"
                        name="name_en"
                        value={value.name}
                        class="w-full rounded-lg border border-input-border px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label
                        for="edit_value_code_{value.id}"
                        class="mb-1 block text-sm font-medium text-foreground-secondary"
                      >
                        Code
                      </label>
                      <input
                        type="text"
                        id="edit_value_code_{value.id}"
                        name="code"
                        value={value.code}
                        class="w-full rounded-lg border border-input-border px-3 py-2 text-sm"
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
                {#each TRANSLATION_LANGUAGES as lang}
                  <form
                    method="POST"
                    action="?/saveValueTranslation"
                    class="mt-3 border-t border-border pt-3"
                    use:enhance={() => {
                      return async ({ result, update }) => {
                        if (result.type === "success") {
                          toast.success(`${lang.name} translation saved`);
                        }
                        await update({ reset: false });
                      };
                    }}
                  >
                    <input type="hidden" name="facetValueId" value={value.id} />
                    <input type="hidden" name="languageCode" value={lang.code} />
                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          for="edit_value_name_{lang.code}_{value.id}"
                          class="mb-1 block text-sm font-medium text-foreground-secondary"
                        >
                          {lang.name} name
                        </label>
                        <input
                          type="text"
                          id="edit_value_name_{lang.code}_{value.id}"
                          name="name"
                          value={data.valueTranslations[value.id]?.find((t) => t.languageCode === lang.code)?.name ?? ""}
                          placeholder="Leave empty to use default"
                          class="w-full rounded-lg border border-input-border px-3 py-2 text-sm"
                        />
                      </div>
                      <div class="flex items-end">
                        <Button type="submit" size="sm" variant="outline">
                          Save {lang.name}
                        </Button>
                      </div>
                    </div>
                  </form>
                {/each}
                <div class="mt-3 border-t border-border pt-3">
                  <form
                    method="POST"
                    action="?/deleteValue"
                    use:enhance={() => {
                      return async ({ result, update }) => {
                        await update();
                        if (result.type === "success") {
                          toast.success("Value deleted");
                        }
                        editingValueId = null;
                      };
                    }}
                  >
                    <input type="hidden" name="id" value={value.id} />
                    <button
                      type="submit"
                      class="text-sm text-red-600 hover:text-red-800 dark:text-red-700"
                    >
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
    class="text-sm text-red-600 hover:text-red-800 dark:text-red-700"
    onclick={() => (showDelete = true)}
  >
    Delete this facet
  </button>
    </div>

    <!-- Sidebar (Right) -->
    <div class="w-full space-y-6 lg:w-80 lg:shrink-0">
      <TranslationEditor
        fields={[{ name: "name", label: "Name", type: "text" }]}
        translations={translationsToMap(data.facetTranslations)}
        formId="facet-form"
      />
    </div>
  </div>
</div>

<DeleteConfirmDialog
  bind:open={showDelete}
  title="Delete Facet?"
  description="Are you sure you want to delete this facet and all its values? This action cannot be undone."
/>
