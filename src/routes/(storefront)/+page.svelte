<script lang="ts">
  import type { PageData, ActionData } from "./$types";
  import ImageIcon from "@lucide/svelte/icons/image";
  import { enhance } from "$app/forms";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  function getProductName(product: (typeof data.featuredProducts)[0]): string {
    return product.translations.find((t) => t.languageCode === "en")?.name ?? "Untitled";
  }

  function getProductSlug(product: (typeof data.featuredProducts)[0]): string {
    return product.translations.find((t) => t.languageCode === "en")?.slug ?? "";
  }

  function getLowestPrice(product: (typeof data.featuredProducts)[0]): number | null {
    if (product.variants.length === 0) return null;
    return Math.min(...product.variants.map((v) => v.price));
  }
</script>

<svelte:head>
  <title>Hoikka - Opinionated Commerce for SvelteKit</title>
  <meta
    name="description"
    content="Lightweight but powerful DX-first ecommerce platform built with SvelteKit. 100% customizable and owned by you."
  />
</svelte:head>

<div>
  <!-- Hero Section -->
  <section class="bg-gray-100 pt-10 pb-20">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex items-center gap-20">
        <div>
          <a href="/" class="mb-6 inline-block bg-[#f7d0dd] text-xl font-bold text-gray-900"
            >"Hoikka"</a
          >
          <h1 class="mb-4 text-4xl font-bold md:text-5xl">Opinionated Commerce</h1>
          <p class="mb-10 text-lg leading-[1.75] text-gray-600">
            Lightweight but powerful <span class="font-semibold text-gray-900">DX-first</span>
            ecommerce gear, built with SvelteKit.<br />
            It is truly <span class="font-semibold text-gray-900">100% customizable</span> and owned by
            you!
          </p>
          <div class="flex items-center gap-4">
            <img src="/kuvitus2.png" alt="Svelte" class="h-20 w-20" />
            <a
              href="/products"
              class="h inline-block rounded-lg border bg-white px-8 py-3 font-semibold text-gray-900 transition-colors hover:bg-[#f7d0dd]/50"
            >
              Get Started: Docs
            </a>
          </div>
        </div>
        <div class="max-w-[300px]">
          <img
            src="/kuvitus.png"
            alt="Opinionated Commerce"
            class="floating h-full w-full object-cover"
          />
        </div>
      </div>
    </div>
  </section>

  <!-- Demo Section: Products + Admin Login -->
  <section class="py-16">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <!-- Demo Store Products -->
        <div>
          <h2 class="mb-8 text-xl font-bold">Demo Store Products</h2>

          {#if data.featuredProducts.length === 0}
            <div class="py-12 text-center text-gray-500">
              <p>No products yet.</p>
              <a href="/admin/products/new" class="text-blue-600 hover:underline">
                Add your first product
              </a>
            </div>
          {:else}
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {#each data.featuredProducts as product}
                <a
                  href="/products/{getProductSlug(product)}"
                  class="group overflow-hidden rounded-lg border border-gray-300 bg-white transition-shadow hover:shadow-lg"
                >
                  <div
                    class="relative aspect-square bg-gray-100"
                    style="view-transition-name: product-image-{product.id}"
                  >
                    {#if product.featuredAsset}
                      <img
                        src={product.featuredAsset.preview ?? product.featuredAsset.source}
                        alt={getProductName(product)}
                        class="h-full w-full object-cover"
                      />
                    {:else}
                      <div class="flex h-full w-full items-center justify-center text-gray-400">
                        <ImageIcon class="h-12 w-12" />
                      </div>
                    {/if}
                  </div>
                  <div class="p-4">
                    <h3 class="font-medium transition-colors group-hover:text-blue-600">
                      {getProductName(product)}
                    </h3>
                    {#if getLowestPrice(product) !== null}
                      <p class="mt-1 text-gray-600">
                        From {(getLowestPrice(product)! / 100).toFixed(2)} EUR
                      </p>
                    {/if}
                  </div>
                </a>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Demo Admin UI Login -->
        <div class="ml-12 flex flex-col">
          <h2 class="mb-8 text-xl font-bold">Demo Admin UI</h2>

          <div class="flex flex-1 flex-col rounded-lg border border-gray-300 bg-white p-6">
            <p class="mb-6 text-sm text-gray-600">Log in to explore the admin dashboard.</p>

            {#if form?.error}
              <div class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {form.error}
              </div>
            {/if}

            <form method="POST" action="?/adminLogin" use:enhance class="space-y-4">
              <div>
                <label for="email" class="mb-1 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  placeholder="admin@example.com"
                />
              </div>

              <div>
                <label for="password" class="mb-1 block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  placeholder="Enter password"
                />
              </div>

              <button
                type="submit"
                class="mt-4 w-full rounded-lg border bg-white px-4 py-2 font-semibold text-gray-900 transition-colors hover:bg-[#f7d0dd]/50"
              >
                Log in to Admin
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </section>
</div>

<style>
  @keyframes float {
    0%,
    100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-20px);
    }
  }

  .floating {
    animation: float 9s ease-in-out infinite;
  }
</style>
