import { createHash } from "crypto";

export type UploadImageResult =
  | { success: true; url: string }
  | { success: false; error: string };

/**
 * Upload a single image to Cloudinary and return its hosted URL.
 *
 * Uses a signed upload (a direct call to Cloudinary's REST API, no SDK
 * dependency needed) so the API secret never reaches the browser. Requires
 * `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`
 * to be set — see `.env.example`.
 *
 * Shared by admin product image uploads (src/lib/admin/actions.ts) and
 * customer payment-proof uploads (src/lib/checkout/payment-actions.ts) —
 * `folder` keeps the two kinds of upload separated in Cloudinary.
 */
export async function uploadImageToCloudinary(
  file: File,
  folder: string
): Promise<UploadImageResult> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.error(
      "[cloudinary] env vars are not configured (CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET)."
    );
    return { success: false, error: "Image upload isn't configured yet." };
  }

  try {
    const timestamp = Math.round(Date.now() / 1000);

    // Cloudinary signed uploads require a SHA-1 hash of every non-file
    // param (alphabetically sorted) plus the API secret appended at the end.
    const signature = createHash("sha1")
      .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
      .digest("hex");

    const uploadForm = new FormData();
    uploadForm.append("file", file);
    uploadForm.append("api_key", apiKey);
    uploadForm.append("timestamp", String(timestamp));
    uploadForm.append("signature", signature);
    uploadForm.append("folder", folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: uploadForm }
    );

    if (!response.ok) {
      const body = await response.text();
      console.error("[cloudinary] upload failed:", body);
      return { success: false, error: "Image upload failed. Please try again." };
    }

    const data = (await response.json()) as { secure_url?: string };
    if (!data.secure_url) {
      return { success: false, error: "Image upload failed. Please try again." };
    }

    return { success: true, url: data.secure_url };
  } catch (error) {
    console.error("[cloudinary] failed to upload image:", error);
    return { success: false, error: "Image upload failed. Please try again." };
  }
}
