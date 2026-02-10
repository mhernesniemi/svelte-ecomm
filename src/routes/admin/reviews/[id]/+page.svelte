<script lang="ts">
  import { enhance } from "$app/forms";
  import { toast } from "svelte-sonner";
  import { Badge, type BadgeVariant } from "$lib/components/admin/ui/badge";
  import { Button } from "$lib/components/admin/ui/button";
  import DeleteConfirmDialog from "$lib/components/admin/DeleteConfirmDialog.svelte";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import type { PageData, ActionData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let showDelete = $state(false);

  $effect(() => {
    if (form?.success) toast.success(form.message || "Success");
    if (form?.error) toast.error(form.error);
  });

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
  <div class="mb-6 flex items-center justify-between">
    <a
      href="/admin/reviews"
      class="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
      ><ChevronLeft class="h-4 w-4" /> Back to Reviews</a
    >
  </div>
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold">Review #{data.review.id}</h1>
      <p class="mt-1 text-sm text-foreground-tertiary">
        by {data.review.nickname} on {new Date(data.review.createdAt).toLocaleDateString()}
      </p>
    </div>
    <Badge variant={getStatusVariant(data.review.status)} class="capitalize">
      {data.review.status}
    </Badge>
  </div>

  <!-- Review Content -->
  <div class="overflow-hidden rounded-lg bg-surface shadow">
    <div class="p-6">
      <div class="mb-6">
        <h2 class="mb-1 text-sm font-medium text-muted-foreground">Rating</h2>
        <span class="text-2xl text-yellow-500">{formatRating(data.review.rating)}</span>
      </div>

      <div class="mb-6">
        <h2 class="mb-1 text-sm font-medium text-muted-foreground">Comment</h2>
        {#if data.review.comment}
          <p class="whitespace-pre-wrap text-foreground">{data.review.comment}</p>
        {:else}
          <p class="text-placeholder">No comment</p>
        {/if}
      </div>

      <div class="grid grid-cols-1 gap-6 border-t border-border pt-6 sm:grid-cols-3">
        <div>
          <h2 class="mb-1 text-sm font-medium text-muted-foreground">Product</h2>
          {#if data.product}
            <a
              href="/admin/products/{data.product.id}"
              class="text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              {data.product?.name ?? "Unknown product"}
            </a>
          {:else}
            <span class="text-placeholder">Deleted product</span>
          {/if}
        </div>

        <div>
          <h2 class="mb-1 text-sm font-medium text-muted-foreground">Customer</h2>
          {#if data.customer}
            <a
              href="/admin/customers/{data.customer.id}"
              class="text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              {data.customer.firstName}
              {data.customer.lastName}
            </a>
          {:else}
            <span class="text-placeholder">Deleted customer</span>
          {/if}
        </div>

        <div>
          <h2 class="mb-1 text-sm font-medium text-muted-foreground">Verified Purchase</h2>
          <span class={data.review.isVerifiedPurchase ? "text-green-600" : "text-muted-foreground"}>
            {data.review.isVerifiedPurchase ? "Yes" : "No"}
          </span>
        </div>
      </div>
    </div>
  </div>

  <!-- Actions -->
  <div class="overflow-hidden rounded-lg bg-surface shadow">
    <div class="p-6">
      <h2 class="mb-4 text-lg font-medium text-foreground">Actions</h2>
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

  <button
    type="button"
    class="text-sm text-red-600 hover:text-red-800 dark:text-red-700"
    onclick={() => (showDelete = true)}
  >
    Delete this review
  </button>
</div>

<DeleteConfirmDialog
  bind:open={showDelete}
  title="Delete Review?"
  description="Are you sure you want to delete this review? This action cannot be undone."
/>
