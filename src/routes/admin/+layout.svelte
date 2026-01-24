<script lang="ts">
  import "./admin.css";
  import { page } from "$app/stores";
  import { enhance } from "$app/forms";
  import { Button } from "$lib/components/admin/ui/button";
  import type { LayoutData } from "./$types";
  import Home from "@lucide/svelte/icons/home";
  import Package from "@lucide/svelte/icons/package";
  import LayoutGrid from "@lucide/svelte/icons/layout-grid";
  import Filter from "@lucide/svelte/icons/filter";
  import FolderOpen from "@lucide/svelte/icons/folder-open";
  import ShoppingCart from "@lucide/svelte/icons/shopping-cart";
  import Users from "@lucide/svelte/icons/users";
  import UsersRound from "@lucide/svelte/icons/users-round";
  import Star from "@lucide/svelte/icons/star";
  import Tag from "@lucide/svelte/icons/tag";

  let { children, data }: { children: any; data: LayoutData } = $props();

  interface NavItem {
    href: string;
    label: string;
    icon: string;
  }

  const navItems: NavItem[] = [
    { href: "/admin", label: "Dashboard", icon: "home" },
    { href: "/admin/products", label: "Products", icon: "package" },
    { href: "/admin/categories", label: "Categories", icon: "category" },
    { href: "/admin/facets", label: "Facets", icon: "filter" },
    { href: "/admin/collections", label: "Collections", icon: "folder" },
    { href: "/admin/orders", label: "Orders", icon: "shopping-cart" },
    { href: "/admin/customers", label: "Customers", icon: "users" },
    { href: "/admin/customer-groups", label: "Customer Groups", icon: "user-group" },
    { href: "/admin/reviews", label: "Reviews", icon: "star" },
    { href: "/admin/promotions", label: "Promotions", icon: "tag" }
  ];

  function isActive(href: string): boolean {
    if (href === "/admin") {
      return $page.url.pathname === "/admin";
    }
    return $page.url.pathname.startsWith(href);
  }
</script>

<div class="min-h-screen bg-gray-50 font-sans">
  <!-- Sidebar -->
  <aside class="fixed inset-y-0 left-0 w-64 bg-gray-900 text-white">
    <div class="p-6">
      <h1 class="text-xl font-bold">Hoikka</h1>
      <p class="text-sm text-gray-400">Admin Dashboard</p>
    </div>

    <nav class="mt-6">
      {#each navItems as item}
        <a
          href={item.href}
          class="flex items-center gap-3 px-6 py-3 text-gray-300 transition-colors hover:bg-gray-800 hover:text-white {isActive(
            item.href
          )
            ? 'border-l-4 border-blue-500 bg-gray-800 text-white'
            : ''}"
        >
          <span class="h-5 w-5">
            {#if item.icon === "home"}
              <Home class="h-5 w-5" />
            {:else if item.icon === "package"}
              <Package class="h-5 w-5" />
            {:else if item.icon === "shopping-cart"}
              <ShoppingCart class="h-5 w-5" />
            {:else if item.icon === "users"}
              <Users class="h-5 w-5" />
            {:else if item.icon === "category"}
              <LayoutGrid class="h-5 w-5" />
            {:else if item.icon === "filter"}
              <Filter class="h-5 w-5" />
            {:else if item.icon === "tag"}
              <Tag class="h-5 w-5" />
            {:else if item.icon === "folder"}
              <FolderOpen class="h-5 w-5" />
            {:else if item.icon === "user-group"}
              <UsersRound class="h-5 w-5" />
            {:else if item.icon === "star"}
              <Star class="h-5 w-5" />
            {/if}
          </span>
          {item.label}
        </a>
      {/each}
    </nav>

    <div class="absolute right-0 bottom-0 left-0 border-t border-gray-800 bg-gray-900 p-4">
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
