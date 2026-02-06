<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { Editor } from "@tiptap/core";
  import StarterKit from "@tiptap/starter-kit";
  import Link from "@tiptap/extension-link";
  import Placeholder from "@tiptap/extension-placeholder";
  import { cn } from "$lib/utils.js";

  interface Props {
    content?: string;
    placeholder?: string;
    name?: string;
    class?: string;
    onchange?: (html: string) => void;
  }

  let {
    content = "",
    placeholder = "Write something...",
    name,
    class: className,
    onchange
  }: Props = $props();

  let element: HTMLDivElement;
  let editor: Editor | undefined = $state();
  let html = $state(content);

  onMount(() => {
    editor = new Editor({
      element,
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [2, 3]
          }
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: "text-blue-600 underline"
          }
        }),
        Placeholder.configure({
          placeholder
        })
      ],
      content,
      editorProps: {
        attributes: {
          class: "prose prose-base max-w-none focus:outline-none min-h-[100px] px-3 py-2"
        }
      },
      onUpdate: ({ editor }) => {
        html = editor.getHTML();
        onchange?.(html);
      }
    });
  });

  onDestroy(() => {
    editor?.destroy();
  });

  function toggleBold() {
    editor?.chain().focus().toggleBold().run();
  }

  function toggleItalic() {
    editor?.chain().focus().toggleItalic().run();
  }

  function toggleHeading(level: 2 | 3) {
    editor?.chain().focus().toggleHeading({ level }).run();
  }

  function toggleBulletList() {
    editor?.chain().focus().toggleBulletList().run();
  }

  function toggleOrderedList() {
    editor?.chain().focus().toggleOrderedList().run();
  }

  function setLink() {
    const previousUrl = editor?.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  function unsetLink() {
    editor?.chain().focus().unsetLink().run();
  }
</script>

<div
  class={cn(
    "overflow-hidden rounded-lg border border-gray-300 bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500",
    className
  )}
>
  <!-- Toolbar -->
  <div class="flex flex-wrap gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
    <button
      type="button"
      onclick={toggleBold}
      class={cn(
        "rounded px-2 py-1 text-sm font-medium transition-colors hover:bg-gray-200",
        editor?.isActive("bold") && "bg-gray-200"
      )}
      title="Bold"
    >
      B
    </button>

    <button
      type="button"
      onclick={toggleItalic}
      class={cn(
        "rounded px-2 py-1 text-sm italic transition-colors hover:bg-gray-200",
        editor?.isActive("italic") && "bg-gray-200"
      )}
      title="Italic"
    >
      I
    </button>

    <span class="mx-1 w-px bg-gray-300"></span>

    <button
      type="button"
      onclick={() => toggleHeading(2)}
      class={cn(
        "rounded px-2 py-1 text-sm font-medium transition-colors hover:bg-gray-200",
        editor?.isActive("heading", { level: 2 }) && "bg-gray-200"
      )}
      title="Heading 2"
    >
      H2
    </button>

    <button
      type="button"
      onclick={() => toggleHeading(3)}
      class={cn(
        "rounded px-2 py-1 text-sm font-medium transition-colors hover:bg-gray-200",
        editor?.isActive("heading", { level: 3 }) && "bg-gray-200"
      )}
      title="Heading 3"
    >
      H3
    </button>

    <span class="mx-1 w-px bg-gray-300"></span>

    <button
      type="button"
      onclick={toggleBulletList}
      class={cn(
        "rounded px-2 py-1 text-sm transition-colors hover:bg-gray-200",
        editor?.isActive("bulletList") && "bg-gray-200"
      )}
      title="Bullet List"
    >
      •
    </button>

    <button
      type="button"
      onclick={toggleOrderedList}
      class={cn(
        "rounded px-2 py-1 text-sm transition-colors hover:bg-gray-200",
        editor?.isActive("orderedList") && "bg-gray-200"
      )}
      title="Numbered List"
    >
      1.
    </button>

    <span class="mx-1 w-px bg-gray-300"></span>

    {#if editor?.isActive("link")}
      <button
        type="button"
        onclick={unsetLink}
        class="rounded px-2 py-1 text-sm text-red-600 transition-colors hover:bg-red-50"
        title="Remove Link"
      >
        Unlink
      </button>
    {:else}
      <button
        type="button"
        onclick={setLink}
        class="rounded px-2 py-1 text-sm transition-colors hover:bg-gray-200"
        title="Add Link"
      >
        Link
      </button>
    {/if}
  </div>

  <!-- Editor content -->
  <div bind:this={element}></div>

  <!-- Hidden input to submit HTML content with form -->
  {#if name}
    <input type="hidden" {name} value={html} />
  {/if}
</div>

<style>
  :global(.tiptap p.is-editor-empty:first-child::before) {
    color: #9ca3af;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }
</style>
