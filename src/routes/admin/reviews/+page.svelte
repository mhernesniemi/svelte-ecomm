<script lang="ts">
  import { enhance } from "$app/forms";
  import { page } from "$app/stores";
  import { Badge } from "$lib/components/admin/ui/badge";
  import { Button } from "$lib/components/admin/ui/button";
  import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell
  } from "$lib/components/admin/ui/table";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  function getProductName(review: (typeof data.reviews)[0]): string {
    return review.product.translations.find((t) => t.languageCode === "en")?.name ?? "Unknown";
  }

  function getStatusVariant(status: string): "default" | "success" | "destructive" | "secondary" {
    switch (status) {
      case "approved":
        return "success";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  }

  function getFilterUrl(status: string | null): string {
    const params = new URLSearchParams($page.url.searchParams);
    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    params.delete("page");
    const str = params.toString();
    return str ? `?${str}` : "/admin/reviews";
  }

  function formatRating(rating: number): string {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  }
</script>

<div>
  <div class="mb-8 flex items-center justify-between">
    <h1 class="text-2xl font-bold">Reviews</h1>
  </div>

  <!-- Status Filter -->
  <div class="mb-6 flex gap-2">
    <a
      href={getFilterUrl(null)}
      class="rounded-lg px-3 py-1.5 text-sm {!data.currentStatus
        ? 'bg-blue-600 text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
    >
      All
    </a>
    <a
      href={getFilterUrl("pending")}
      class="rounded-lg px-3 py-1.5 text-sm {data.currentStatus === 'pending'
        ? 'bg-blue-600 text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
    >
      Pending
    </a>
    <a
      href={getFilterUrl("approved")}
      class="rounded-lg px-3 py-1.5 text-sm {data.currentStatus === 'approved'
        ? 'bg-blue-600 text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
    >
      Approved
    </a>
    <a
      href={getFilterUrl("rejected")}
      class="rounded-lg px-3 py-1.5 text-sm {data.currentStatus === 'rejected'
        ? 'bg-blue-600 text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
    >
      Rejected
    </a>
  </div>

  <Table>
    <TableHeader>
      <TableRow class="hover:bg-transparent">
        <TableHead>Product</TableHead>
        <TableHead>Nickname</TableHead>
        <TableHead>Rating</TableHead>
        <TableHead>Comment</TableHead>
        <TableHead>Verified</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Date</TableHead>
        <TableHead class="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {#if data.reviews.length === 0}
        <TableRow class="hover:bg-transparent">
          <TableCell colspan={8} class="py-12 text-center text-gray-500">No reviews found</TableCell
          >
        </TableRow>
      {:else}
        {#each data.reviews as review}
          <TableRow>
            <TableCell class="text-sm">
              <a href="/admin/products/{review.product.id}" class="text-blue-600 hover:underline">
                {getProductName(review)}
              </a>
            </TableCell>
            <TableCell class="text-sm">
              {review.nickname}
            </TableCell>
            <TableCell class="text-sm text-yellow-500">
              {formatRating(review.rating)}
            </TableCell>
            <TableCell class="max-w-xs truncate text-sm text-gray-500">
              {review.comment ?? "-"}
            </TableCell>
            <TableCell class="text-sm">
              {review.isVerifiedPurchase ? "Yes" : "No"}
            </TableCell>
            <TableCell class="text-sm">
              <Badge variant={getStatusVariant(review.status)}>
                {review.status}
              </Badge>
            </TableCell>
            <TableCell class="text-sm text-gray-500">
              {new Date(review.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell class="text-right text-sm">
              <div class="flex justify-end gap-2">
                {#if review.status === "pending"}
                  <form method="POST" action="?/approve" use:enhance class="inline">
                    <input type="hidden" name="id" value={review.id} />
                    <Button type="submit" size="sm" variant="outline">Approve</Button>
                  </form>
                  <form method="POST" action="?/reject" use:enhance class="inline">
                    <input type="hidden" name="id" value={review.id} />
                    <Button type="submit" size="sm" variant="outline">Reject</Button>
                  </form>
                {/if}
                <form method="POST" action="?/delete" use:enhance class="inline">
                  <input type="hidden" name="id" value={review.id} />
                  <Button type="submit" size="sm" variant="destructive">Delete</Button>
                </form>
              </div>
            </TableCell>
          </TableRow>
        {/each}
      {/if}
    </TableBody>
  </Table>

  {#if data.pagination.total > data.pagination.limit}
    <div class="mt-4 flex items-center justify-between rounded-lg bg-white px-6 py-3 shadow">
      <div class="text-sm text-gray-500">
        Showing {data.pagination.offset + 1} to {Math.min(
          data.pagination.offset + data.pagination.limit,
          data.pagination.total
        )} of {data.pagination.total} reviews
      </div>
      <div class="flex gap-2">
        {#if data.currentPage > 1}
          <a
            href="?page={data.currentPage - 1}{data.currentStatus
              ? `&status=${data.currentStatus}`
              : ''}"
            class="rounded border border-gray-200 px-3 py-1 text-sm hover:bg-gray-100"
          >
            Previous
          </a>
        {/if}
        {#if data.pagination.hasMore}
          <a
            href="?page={data.currentPage + 1}{data.currentStatus
              ? `&status=${data.currentStatus}`
              : ''}"
            class="rounded border border-gray-200 px-3 py-1 text-sm hover:bg-gray-100"
          >
            Next
          </a>
        {/if}
      </div>
    </div>
  {/if}
</div>
