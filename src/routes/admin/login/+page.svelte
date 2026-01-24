<script lang="ts">
  import { enhance } from "$app/forms";
  import { Button } from "$lib/components/admin/ui/button";
  import type { ActionData } from "./$types";

  let { form }: { form: ActionData } = $props();
  let isLoading = $state(false);
</script>

<svelte:head><title>Login | Admin</title></svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gray-900 font-sans">
  <div class="w-full max-w-sm">
    <div class="rounded-lg bg-white p-8 shadow-lg">
      <h1 class="mb-2 text-2xl font-bold text-gray-900">Hoikka Admin</h1>
      <p class="mb-6 text-sm text-gray-600">Sign in to your account</p>

      {#if form?.error}
        <div class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {form.error}
        </div>
      {/if}

      <form
        method="POST"
        use:enhance={() => {
          isLoading = true;
          return async ({ update }) => {
            await update();
            isLoading = false;
          };
        }}
      >
        <div class="mb-4">
          <label for="email" class="mb-1 block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            required
            autocomplete="email"
            class="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        <div class="mb-6">
          <label for="password" class="mb-1 block text-sm font-medium text-gray-700">Password</label
          >
          <input
            type="password"
            id="password"
            name="password"
            required
            autocomplete="current-password"
            class="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          class="w-full bg-gray-900 hover:bg-gray-800"
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </div>
  </div>
</div>
