<script lang="ts">
  import { page } from "$app/stores";

  interface NavItem {
    href: string;
    label: string;
    icon: string;
  }

  const navItems: NavItem[] = [
    { href: "/admin", label: "Dashboard", icon: "home" },
    { href: "/admin/products", label: "Products", icon: "package" },
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

  let { children } = $props();
</script>

<div class="min-h-screen bg-gray-100 font-sans">
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
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            {:else if item.icon === "package"}
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            {:else if item.icon === "shopping-cart"}
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            {:else if item.icon === "users"}
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            {:else if item.icon === "filter"}
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
            {:else if item.icon === "tag"}
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
            {:else if item.icon === "folder"}
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            {:else if item.icon === "user-group"}
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            {:else if item.icon === "star"}
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            {/if}
          </span>
          {item.label}
        </a>
      {/each}
    </nav>

    <div class="absolute right-0 bottom-0 left-0 border-t border-gray-800 p-4">
      <a href="/" class="text-sm text-gray-400 hover:text-white"> View Storefront </a>
    </div>
  </aside>

  <!-- Main content -->
  <main class="ml-64 p-8">
    {@render children()}
  </main>
</div>
