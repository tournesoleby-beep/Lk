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

const CLOUDINARY_UPLOAD_MARKER = "/image/upload/";

/**
 * Split a Cloudinary secure_url into the part before the transformation
 * segment and the part after it (version + public_id + extension), so
 * fresh transformation params can be inserted between them. Returns null
 * for anything that isn't a Cloudinary delivery URL — callers should fall
 * back to using the original URL unchanged in that case.
 */
function splitCloudinaryUrl(url: string): { prefix: string; rest: string } | null {
  const index = url.indexOf(CLOUDINARY_UPLOAD_MARKER);
  if (index === -1) return null;
  const prefix = url.slice(0, index + CLOUDINARY_UPLOAD_MARKER.length);
  const rest = url.slice(index + CLOUDINARY_UPLOAD_MARKER.length);
  return { prefix, rest };
}

/**
 * Build an on-the-fly optimized Cloudinary delivery URL by inserting
 * transformation params right after `/upload/`.
 *
 * This is what makes existing product images fast without any re-upload
 * or migration: Cloudinary renders the transformed derivative the first
 * time a given transformation is requested and caches it at the CDN edge
 * from then on, so a 3MB original is never sent to a browser again once
 * this is in place — new uploads get the same benefit automatically.
 *
 * - f_auto  serves AVIF/WebP to browsers that support it, otherwise falls
 *           back to the original format.
 * - q_auto  applies Cloudinary's perceptual auto-compression.
 * - c_limit resizes down to fit within width/height, never upscales, and
 *           preserves the original aspect ratio (so it's safe to use with
 *           a fixed-aspect-ratio container without introducing letterboxing
 *           or layout shift).
 *
 * URLs that aren't Cloudinary delivery URLs (e.g. a stray external image)
 * are returned unchanged.
 */
export function getCloudinaryDeliveryUrl(
  url: string,
  {
    width,
    height,
    quality = "auto",
  }: { width?: number; height?: number; quality?: string | number } = {}
): string {
  const split = splitCloudinaryUrl(url);
  if (!split) return url;

  const transforms = ["f_auto", `q_${quality}`];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (width || height) transforms.push("c_limit");

  return `${split.prefix}${transforms.join(",")}/${split.rest}`;
}

/**
 * Custom `loader` for Next.js's `<Image>` component (see product-card.tsx
 * and shop-browser.tsx), scoped to Cloudinary-hosted product photos.
 *
 * Passing a per-instance `loader` makes `<Image>` render the URL this
 * function returns directly instead of proxying the request through
 * Next's built-in `/_next/image` optimizer — so no change to
 * `images.remotePatterns` in next.config.ts is required, while product
 * cards still get `<Image>`'s responsive `srcSet` generation (driven by
 * the `sizes` prop), lazy-loading, and `priority` preloading.
 */
export function cloudinaryImageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  return getCloudinaryDeliveryUrl(src, { width, quality: quality ?? "auto" });
}
