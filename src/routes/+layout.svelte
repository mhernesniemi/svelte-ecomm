<script lang="ts">
  import "./layout.css";
  import { ClerkProvider } from "svelte-clerk";
  import { PUBLIC_CLERK_PUBLISHABLE_KEY } from "$env/static/public";
  import { ParaglideJS } from "@inlang/paraglide-sveltekit";
  import { i18n } from "$lib/i18n.js";

  const { children } = $props();
</script>

<ParaglideJS {i18n}>
  <ClerkProvider publishableKey={PUBLIC_CLERK_PUBLISHABLE_KEY}>
    {@render children()}
  </ClerkProvider>
</ParaglideJS>
