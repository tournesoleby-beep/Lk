"use server";

import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { uploadImageToCloudinary } from "@/lib/cloudinary";

export type UploadPaymentProofResult =
  | { success: true; url: string }
  | { success: false; error: string };

// Orders in these states are done, one way or another — no new proof should
// overwrite them. Every other state (including a prior rejection) can accept
// a new upload.
const CLOSED_STATUSES = new Set<OrderStatus>(["PAID", "CANCELLED", "REFUNDED"]);

/**
 * Upload a customer's manual bank-transfer payment proof from the
 * /checkout/payment page.
 *
 * Reuses the same signed Cloudinary upload used for product images (see
 * src/lib/cloudinary.ts), just in a separate folder. On success, stores the
 * hosted URL on the order and moves it to WAITING_VERIFICATION so it shows
 * up for admin review (see src/lib/admin/order-actions.ts).
 */
export async function uploadPaymentProof(
  orderId: string,
  formData: FormData
): Promise<UploadPaymentProofResult> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, error: "No image file was provided." };
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true },
    });

    if (!order) {
      return { success: false, error: "This order doesn't exist." };
    }
    if (CLOSED_STATUSES.has(order.status)) {
      return { success: false, error: "This order can no longer accept a payment proof." };
    }

    const uploaded = await uploadImageToCloudinary(file, "lapiita-karya/payment-proofs");
    if (!uploaded.success) return uploaded;

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentProofUrl: uploaded.url,
        paymentProofUploadedAt: new Date(),
        status: "WAITING_VERIFICATION",
      },
    });

    return { success: true, url: uploaded.url };
  } catch (error) {
    console.error("[checkout] failed to upload payment proof:", error);
    return {
      success: false,
      error: "Something went wrong uploading your payment proof. Please try again.",
    };
  } finally {
    revalidatePath("/checkout/payment");
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
  }
}
