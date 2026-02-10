<script lang="ts">
  import { enhance } from "$app/forms";
  import { page } from "$app/stores";
  import { onMount, tick } from "svelte";
  import { toast } from "svelte-sonner";
  import { Button } from "$lib/components/admin/ui/button";
  import DeleteConfirmDialog from "$lib/components/admin/DeleteConfirmDialog.svelte";
  import TranslationEditor from "$lib/components/admin/TranslationEditor.svelte";
  import { translationsToMap, TRANSLATION_LANGUAGES } from "$lib/config/languages.js";
  import Plus from "@lucide/svelte/icons/plus";
  import Trash from "@lucide/svelte/icons/trash-2";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import type { PageData, ActionData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let isSubmitting = $state(false);
  let showDelete = $state(false);

  type ValueEntry = {
    id: number | null;
    name: string;
    code: string;
    translations: Record<string, string>;
  };

  let facetName = $state("");
  let facetCode = $state("");
  let values = $state<ValueEntry[]>([]);
  let valuesJson = $derived(JSON.stringify(values));

  $effect(() => {
    facetName = data.facet.name ?? "";
    facetCode = data.facet.code;
    values = data.facet.values.map((v) => ({
      id: v.id,
      name: v.name ?? "",
      code: v.code,
      translations: Object.fromEntries(
        TRANSLATION_LANGUAGES.map((lang) => {
          const t = data.valueTranslations[v.id]?.find((t) => t.languageCode === lang.code);
          return [lang.code, t?.name ?? ""];
        })
      )
    }));
  });

  onMount(() => {
    if ($page.url.searchParams.has("created")) {
      toast.success("Facet created successfully");
      history.replaceState({}, "", $page.url.pathname);
    }
  });

  $effect(() => {
    if (form?.error) toast.error(form.error);
  });

  async function addValue() {
    values = [
      ...values,
      {
        id: null,
        name: "",
        code: "",
        translations: Object.fromEntries(TRANSLATION_LANGUAGES.map((l) => [l.code, ""]))
      }
    ];
    await tick();
    document.getElementById(`value_name_${values.length - 1}`)?.focus();
  }
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
        <input type="hidden" name="values_json" value={valuesJson} />
        <div class="p-6">
          <h2 class="mb-4 text-lg font-medium text-foreground">Facet Details</h2>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                for="facet_name"
                class="mb-1 block text-sm font-medium text-foreground-secondary">Name</label
              >
              <input
                type="text"
                id="facet_name"
                name="name_en"
                bind:value={facetName}
                class="w-full rounded-lg border border-input-border px-3 py-2"
              />
            </div>
            <div>
              <label
                for="facet_code"
                class="mb-1 block text-sm font-medium text-foreground-secondary">Code</label
              >
              <input
                type="text"
                id="facet_code"
                name="code"
                bind:value={facetCode}
                class="w-full rounded-lg border border-input-border px-3 py-2"
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
              {values.length} value{values.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onclick={addValue}>
            <Plus class="h-4 w-4" />
            Add Value
          </Button>
        </div>

        {#if values.length === 0}
          <div class="p-12 text-center">
            <p class="text-sm text-muted-foreground">
              No values yet. Add values to use this facet for filtering.
            </p>
          </div>
        {:else}
          <div>
            {#each values as _, i}
              <div class={i > 0 ? "border-t border-border" : ""}>
                <div class="space-y-3 p-6">
                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        for="value_name_{i}"
                        class="mb-1 block text-sm font-medium text-foreground-secondary"
                      >
                        Name
                      </label>
                      <input
                        type="text"
                        id="value_name_{i}"
                        bind:value={values[i].name}
                        placeholder="e.g., Red"
                        class="w-full rounded-lg border border-input-border px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label
                        for="value_code_{i}"
                        class="mb-1 block text-sm font-medium text-foreground-secondary"
                      >
                        Code
                      </label>
                      <input
                        type="text"
                        id="value_code_{i}"
                        bind:value={values[i].code}
                        placeholder="e.g., red"
                        class="w-full rounded-lg border border-input-border px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {#each TRANSLATION_LANGUAGES as lang}
                      <div>
                        <label
                          for="value_name_{lang.code}_{i}"
                          class="mb-1 block text-sm font-medium text-foreground-secondary"
                        >
                          Name ({lang.name})
                        </label>
                        <input
                          type="text"
                          id="value_name_{lang.code}_{i}"
                          bind:value={values[i].translations[lang.code]}
                          placeholder={values[i].name}
                          class="w-full rounded-lg border border-input-border px-3 py-2 text-sm"
                        />
                      </div>
                    {/each}
                    <div class="flex items-end justify-end">
                      <Button
                        type="button"
                        variant="destructive-ghost"
                        size="icon"
                        class="size-8"
                        onclick={() => (values = values.filter((_, j) => j !== i))}
                      >
                        <Trash class="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
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
