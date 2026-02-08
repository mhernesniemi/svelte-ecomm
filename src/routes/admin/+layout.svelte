<script lang="ts">
  import "./admin.css";
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { enhance } from "$app/forms";
  import { Toaster } from "$lib/components/admin/ui/sonner";
  import ThemeToggle from "$lib/components/admin/ThemeToggle.svelte";
  import { initTheme, isDark } from "$lib/stores/admin-theme.svelte";
  import type { LayoutData } from "./$types";
  import Package from "@lucide/svelte/icons/package";
  import LayoutGrid from "@lucide/svelte/icons/layout-grid";
  import Filter from "@lucide/svelte/icons/filter";
  import FolderOpen from "@lucide/svelte/icons/folder-open";
  import ShoppingCart from "@lucide/svelte/icons/shopping-cart";
  import Users from "@lucide/svelte/icons/users";
  import Star from "@lucide/svelte/icons/star";
  import Tag from "@lucide/svelte/icons/tag";
  import FileText from "@lucide/svelte/icons/file-text";

  let { children, data }: { children: any; data: LayoutData } = $props();

  onMount(() => {
    const cleanup = initTheme();
    // Reset html background when leaving admin (e.g. navigating to storefront)
    return () => {
      cleanup();
      document.documentElement.style.backgroundColor = "";
    };
  });

  // Set <html> background so macOS overscroll bounce matches the admin theme.
  // Without this the body's default bg-gray-50 shows through as a white flash.
  $effect(() => {
    document.documentElement.style.backgroundColor = isDark() ? "oklch(0.175 0.014 265)" : "";
  });

  interface NavItem {
    href: string;
    label: string;
    icon: string;
  }

  const navItems: NavItem[] = [
    { href: "/admin/orders", label: "Orders", icon: "shopping-cart" },
    { href: "/admin/products", label: "Products", icon: "package" },
    { href: "/admin/collections", label: "Collections", icon: "folder" },
    { href: "/admin/facets", label: "Facets", icon: "filter" },
    { href: "/admin/categories", label: "Categories", icon: "category" },
    { href: "/admin/customers", label: "Customers", icon: "users" },
    { href: "/admin/reviews", label: "Reviews", icon: "star" },
    { href: "/admin/promotions", label: "Promotions", icon: "tag" },
    { href: "/admin/content-pages", label: "Pages", icon: "file-text" }
  ];

  function isActive(href: string): boolean {
    return $page.url.pathname.startsWith(href);
  }
</script>

<div
  class="min-h-screen bg-background font-sans text-foreground antialiased"
  data-admin
  class:dark={isDark()}
>
  <!-- Sidebar -->
  <aside class="fixed inset-y-0 left-0 w-64 bg-gray-900 text-white dark:bg-gray-900/70">
    <div class="p-6">
      <h1 class="text-xl font-bold">Hoikka</h1>
      <p class="text-sm text-gray-400">Admin Dashboard</p>
    </div>

    <nav class="mt-6">
      {#each navItems as item}
        <a
          href={item.href}
          class="flex items-center gap-3 px-6 py-3 text-gray-300 hover:bg-gray-800/60 hover:text-white {isActive(
            item.href
          )
            ? 'border-l-4 border-blue-500 bg-gray-800/60 text-white'
            : ''}"
        >
          <span class="h-5 w-5 opacity-60">
            {#if item.icon === "package"}
              <Package class="h-5 w-5" strokeWidth={1.5} />
            {:else if item.icon === "shopping-cart"}
              <ShoppingCart class="h-5 w-5" strokeWidth={1.5} />
            {:else if item.icon === "users"}
              <Users class="h-5 w-5" strokeWidth={1.5} />
            {:else if item.icon === "category"}
              <LayoutGrid class="h-5 w-5" strokeWidth={1.5} />
            {:else if item.icon === "filter"}
              <Filter class="h-5 w-5" strokeWidth={1.5} />
            {:else if item.icon === "tag"}
              <Tag class="h-5 w-5" strokeWidth={1.5} />
            {:else if item.icon === "folder"}
              <FolderOpen class="h-5 w-5" strokeWidth={1.5} />
            {:else if item.icon === "star"}
              <Star class="h-5 w-5" strokeWidth={1.5} />
            {:else if item.icon === "file-text"}
              <FileText class="h-5 w-5" strokeWidth={1.5} />
            {/if}
          </span>
          {item.label}
        </a>
      {/each}
    </nav>

    <div class="absolute right-0 bottom-0 left-0 border-t border-gray-800 bg-gray-900 p-4">
      <div class="mb-3 flex justify-center">
        <ThemeToggle />
      </div>
      <div class="flex items-center justify-between">
        <form method="POST" action="/admin/logout" use:enhance>
          <button type="submit" class="text-sm text-gray-400 hover:text-white">Logout</button>
        </form>
        <a href="/" class="text-sm text-gray-400 hover:text-white">Storefront</a>
      </div>
    </div>
  </aside>

  <!-- Main content -->
  <main class="ml-64 p-8">
    {@render children()}
  </main>
</div>

<Toaster />
