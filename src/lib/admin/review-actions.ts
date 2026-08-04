"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

export type ReviewActionResult =
  | { success: true }
  | { success: false; error: string };

function prismaErrorCode(error: unknown): unknown {
  return typeof error === "object" && error !== null && "code" in error
    ? (error as { code?: unknown }).code
    : undefined;
}

/**
 * Approve a pending review from /admin/reviews — sets `approved: true` so
 * it starts showing on the product's storefront page (see
 * getProductBySlug in src/lib/shop/product.ts, which only returns
 * `approved: true` reviews).
 */
export async function approveReview(id: string): Promise<ReviewActionResult> {
  try {
    await prisma.productReview.update({
      where: { id },
      data: { approved: true },
    });
    return { success: true };
  } catch (error) {
    console.error("[admin reviews] failed to approve review:", error);
    return {
      success: false,
      error:
        prismaErrorCode(error) === "P2025"
          ? "This review no longer exists. It may have already been deleted."
          : "Something went wrong approving this review. Please try again.",
    };
  } finally {
    revalidatePath("/admin/reviews");
  }
}

/**
 * Reject/delete a review from /admin/reviews — used both for pending
 * reviews that shouldn't be published and for already-approved reviews
 * that turn out to be invalid.
 */
export async function deleteReview(id: string): Promise<ReviewActionResult> {
  try {
    await prisma.productReview.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("[admin reviews] failed to delete review:", error);
    return {
      success: false,
      error:
        prismaErrorCode(error) === "P2025"
          ? "This review no longer exists. It may have already been deleted."
          : "Something went wrong deleting this review. Please try again.",
    };
  } finally {
    revalidatePath("/admin/reviews");
  }
}
