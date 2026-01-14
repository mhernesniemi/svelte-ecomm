<script lang="ts">
  import "./layout.css";
  import { ClerkProvider } from "svelte-clerk";
  import { PUBLIC_CLERK_PUBLISHABLE_KEY } from "$env/static/public";

  const { children } = $props();
</script>

<ClerkProvider publishableKey={PUBLIC_CLERK_PUBLISHABLE_KEY}>
  {@render children()}
</ClerkProvider>
