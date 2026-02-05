<script lang="ts">
  import { enhance } from "$app/forms";
  import { toast } from "svelte-sonner";
  import { Badge, type BadgeVariant } from "$lib/components/admin/ui/badge";
  import { Button } from "$lib/components/admin/ui/button";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import type { PageData, ActionData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  $effect(() => {
    if (form?.success) toast.success(form.message || "Success");
    if (form?.error) toast.error(form.error);
  });

  function getProductName(): string {
    return (
      data.product?.translations.find((t) => t.languageCode === "en")?.name ?? "Unknown product"
    );
  }

  function getStatusVariant(status: string): BadgeVariant {
    switch (status) {
      case "approved":
        return "success";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  }

  function formatRating(rating: number): string {
    return "\u2605".repeat(rating) + "\u2606".repeat(5 - rating);
  }
</script>

<svelte:head><title>Review #{data.review.id} | Admin</title></svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a
        href="/admin/reviews"
        class="text-gray-500 hover:text-gray-700"
        aria-label="Back to reviews"
      >
        <ChevronLeft class="h-5 w-5" />
      </a>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Review #{data.review.id}</h1>
        <p class="mt-1 text-sm text-gray-600">
          by {data.review.nickname} on {new Date(data.review.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
    <Badge variant={getStatusVariant(data.review.status)} class="capitalize">
      {data.review.status}
    </Badge>
  </div>

  <!-- Review Content -->
  <div class="overflow-hidden rounded-lg bg-white shadow">
    <div class="p-6">
      <div class="mb-6">
        <h2 class="mb-1 text-sm font-medium text-gray-500">Rating</h2>
        <span class="text-2xl text-yellow-500">{formatRating(data.review.rating)}</span>
      </div>

      <div class="mb-6">
        <h2 class="mb-1 text-sm font-medium text-gray-500">Comment</h2>
        {#if data.review.comment}
          <p class="whitespace-pre-wrap text-gray-900">{data.review.comment}</p>
        {:else}
          <p class="text-gray-400">No comment</p>
        {/if}
      </div>

      <div class="grid grid-cols-1 gap-6 border-t border-gray-200 pt-6 sm:grid-cols-3">
        <div>
          <h2 class="mb-1 text-sm font-medium text-gray-500">Product</h2>
          {#if data.product}
            <a
              href="/admin/products/{data.product.id}"
              class="text-blue-600 hover:text-blue-800"
            >
              {getProductName()}
            </a>
          {:else}
            <span class="text-gray-400">Deleted product</span>
          {/if}
        </div>

        <div>
          <h2 class="mb-1 text-sm font-medium text-gray-500">Customer</h2>
          {#if data.customer}
            <a
              href="/admin/customers/{data.customer.id}"
              class="text-blue-600 hover:text-blue-800"
            >
              {data.customer.firstName} {data.customer.lastName}
            </a>
          {:else}
            <span class="text-gray-400">Deleted customer</span>
          {/if}
        </div>

        <div>
          <h2 class="mb-1 text-sm font-medium text-gray-500">Verified Purchase</h2>
          <span class={data.review.isVerifiedPurchase ? "text-green-600" : "text-gray-500"}>
            {data.review.isVerifiedPurchase ? "Yes" : "No"}
          </span>
        </div>
      </div>
    </div>
  </div>

  <!-- Actions -->
  <div class="overflow-hidden rounded-lg bg-white shadow">
    <div class="p-6">
      <h2 class="mb-4 text-lg font-medium text-gray-900">Actions</h2>
      <div class="flex gap-3">
        {#if data.review.status !== "approved"}
          <form method="POST" action="?/approve" use:enhance>
            <Button type="submit">Approve</Button>
          </form>
        {/if}
        {#if data.review.status !== "rejected"}
          <form method="POST" action="?/reject" use:enhance>
            <Button type="submit" variant="outline">Reject</Button>
          </form>
        {/if}
      </div>
    </div>
  </div>

  <!-- Danger Zone -->
  <div class="overflow-hidden rounded-lg border border-red-200 bg-red-50">
    <div class="p-6">
      <h2 class="mb-2 text-lg font-medium text-red-900">Danger Zone</h2>
      <p class="mb-4 text-sm text-red-700">
        Deleting this review cannot be undone.
      </p>
      <form
        method="POST"
        action="?/delete"
        use:enhance={() => {
          return async ({ result, update }) => {
            await update();
          };
        }}
      >
        <Button
          type="submit"
          variant="destructive-outline"
          onclick={(e) => {
            if (!confirm("Are you sure you want to delete this review?")) {
              e.preventDefault();
            }
          }}
        >
          Delete Review
        </Button>
      </form>
    </div>
  </div>
</div>
