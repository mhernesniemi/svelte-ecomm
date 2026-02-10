<script lang="ts">
  import { enhance } from "$app/forms";
  import { toast } from "svelte-sonner";
  import { Button } from "$lib/components/admin/ui/button";
  import { RichTextEditor } from "$lib/components/admin/ui/rich-text-editor";
  import { TRANSLATION_LANGUAGES, DEFAULT_LANGUAGE, LANGUAGES } from "$lib/config/languages.js";
  import Globe from "@lucide/svelte/icons/globe";

  interface Field {
    name: string;
    label: string;
    type: "text" | "textarea" | "richtext";
  }

  interface Props {
    fields: Field[];
    translations: Record<string, Record<string, string | null>>;
    entityId: number;
    action?: string;
  }

  let { fields, translations, entityId, action = "?/saveTranslation" }: Props = $props();

  let activeTab = $state(TRANSLATION_LANGUAGES[0]?.code ?? "fi");
  let isSaving = $state(false);
</script>

<div class="overflow-hidden rounded-lg bg-surface shadow">
  <div class="flex items-center gap-2 border-b border-border px-6 py-4">
    <Globe class="h-5 w-5 text-muted-foreground" />
    <h2 class="text-lg font-semibold">Translations</h2>
  </div>

  <!-- Language Tabs -->
  {#if TRANSLATION_LANGUAGES.length > 1}
    <div class="flex border-b border-border">
      {#each TRANSLATION_LANGUAGES as lang}
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium {activeTab === lang.code
            ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
            : 'text-muted-foreground hover:text-foreground'}"
          onclick={() => (activeTab = lang.code)}
        >
          {lang.name}
        </button>
      {/each}
    </div>
  {/if}

  <div class="p-6">
    {#each TRANSLATION_LANGUAGES as lang}
      {#if activeTab === lang.code}
        <form
          method="POST"
          action={action}
          use:enhance={() => {
            isSaving = true;
            return async ({ result, update }) => {
              isSaving = false;
              if (result.type === "success") {
                toast.success(`${lang.name} translation saved`);
              }
              await update({ reset: false });
            };
          }}
        >
          <input type="hidden" name="entityId" value={entityId} />
          <input type="hidden" name="languageCode" value={lang.code} />

          <div class="space-y-4">
            {#each fields as field}
              <div>
                <label
                  for="translation_{lang.code}_{field.name}"
                  class="mb-1 block text-sm font-medium text-foreground-secondary"
                >
                  {field.label}
                </label>

                {#if field.type === "text"}
                  <input
                    type="text"
                    id="translation_{lang.code}_{field.name}"
                    name={field.name}
                    value={translations[lang.code]?.[field.name] ?? ""}
                    class="w-full rounded-lg border border-input-border px-3 py-2 text-sm shadow-sm"
                  />
                {:else if field.type === "textarea"}
                  <textarea
                    id="translation_{lang.code}_{field.name}"
                    name={field.name}
                    rows="4"
                    class="w-full rounded-lg border border-input-border px-3 py-2 text-sm shadow-sm"
                    >{translations[lang.code]?.[field.name] ?? ""}</textarea
                  >
                {:else if field.type === "richtext"}
                  <RichTextEditor
                    name={field.name}
                    content={translations[lang.code]?.[field.name] ?? ""}
                    placeholder="Write {field.label.toLowerCase()}..."
                  />
                {/if}
              </div>
            {/each}
          </div>

          <p class="mt-3 text-xs text-muted-foreground">
            Leave empty to use the default ({LANGUAGES.find((l) => l.code === DEFAULT_LANGUAGE)?.name}) value.
          </p>

          <div class="mt-4">
            <Button type="submit" size="sm" disabled={isSaving}>
              {isSaving ? "Saving..." : `Save ${lang.name}`}
            </Button>
          </div>
        </form>
      {/if}
    {/each}
  </div>
</div>
