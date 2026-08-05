"use client";

import { Fragment, useEffect, useRef, useState, useTransition } from "react";
import { ImagePlus, Star, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useToast } from "@/components/providers/toast-provider";
import { submitReview, uploadReviewImages } from "@/lib/checkout/review-actions";

const MAX_IMAGES = 5;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
// Backstop before we even try to decode/compress a file client-side —
// uploadReviewImages enforces the real (post-compression) size limit.
const MAX_RAW_IMAGE_BYTES = 20 * 1024 * 1024; // 20MB
const COMPRESS_MAX_DIMENSION = 1600;
const COMPRESS_QUALITY = 0.82;

/**
 * Resizes/compresses an image client-side before upload: downscales so its
 * longest edge is at most COMPRESS_MAX_DIMENSION and re-encodes as JPEG
 * (PNG stays PNG, to preserve transparency) at COMPRESS_QUALITY. Falls back
 * to the original file untouched if decoding fails or compression doesn't
 * actually save space — never blocks the upload on a compression error.
 */
async function compressImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, COMPRESS_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, outputType, COMPRESS_QUALITY)
    );
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], file.name, { type: outputType });
  } catch {
    return file;
  }
}

/**
 * The working version of the review form that used to be static markup in
 * app/orders/lookup/page.tsx. Kept as its own client component (one
 * instance per order item, mounted from the server-rendered page) since it
 * needs local state for the rating/comment/submitting/submitted state that
 * a server component can't hold.
 *
 * Visual design — including the peer-checked star radio group — is
 * unchanged from the original static markup; the photo picker below
 * replaces what used to be a non-functional placeholder.
 */
export function ReviewForm({
  orderNumber,
  productId,
  itemId,
  itemName,
}: {
  orderNumber: string;
  productId: string;
  itemId: string;
  itemName: string;
}) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const previewsRef = useRef<string[]>([]);
  previewsRef.current = previews;

  // Revoke any outstanding object URLs when the form unmounts.
  useEffect(() => {
    return () => {
      previewsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    const room = MAX_IMAGES - images.length;
    const incoming = Array.from(fileList);

    if (room <= 0) {
      setImageError(`Maksimal ${MAX_IMAGES} foto.`);
      return;
    }

    const accepted: File[] = [];
    let error: string | null = null;

    for (const file of incoming.slice(0, room)) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        error = "Format foto harus JPG, PNG, atau WebP.";
        continue;
      }
      if (file.size > MAX_RAW_IMAGE_BYTES) {
        error = "Ukuran foto terlalu besar.";
        continue;
      }
      accepted.push(file);
    }

    if (incoming.length > room) {
      error = `Maksimal ${MAX_IMAGES} foto.`;
    }

    setImageError(error);
    if (accepted.length === 0) return;

    setIsCompressing(true);
    try {
      const compressed = await Promise.all(accepted.map((file) => compressImage(file)));
      setImages((current) => [...current, ...compressed]);
      setPreviews((current) => [
        ...current,
        ...compressed.map((file) => URL.createObjectURL(file)),
      ]);
    } finally {
      setIsCompressing(false);
    }
  }

  function handleRemoveImage(index: number) {
    setPreviews((current) => {
      const url = current[index];
      if (url) URL.revokeObjectURL(url);
      return current.filter((_, i) => i !== index);
    });
    setImages((current) => current.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    if (rating < 1) {
      setRatingError("Silakan pilih rating bintang.");
      return;
    }
    setRatingError(null);

    startTransition(async () => {
      const result = await submitReview({
        orderNumber,
        productId,
        rating,
        comment: comment.trim() || undefined,
      });

      if (!result.success) {
        toast({
          title: "Gagal mengirim ulasan",
          description: result.error,
          variant: "info",
        });
        return;
      }

      if (images.length > 0) {
        const formData = new FormData();
        images.forEach((file) => formData.append("images", file));

        const uploadResult = await uploadReviewImages(result.reviewId, formData);
        if (!uploadResult.success) {
          toast({
            title: "Ulasan terkirim, tapi foto gagal diunggah",
            description: uploadResult.error,
            variant: "info",
          });
        }
      }

      setSubmitted(true);
      toast({ title: "Ulasan terkirim", variant: "success" });
    });
  }

  if (submitted) {
    return (
      <p className="text-sm text-slate">
        ✓ Terima kasih! Ulasan Anda untuk {itemName} telah terkirim dan sedang menunggu persetujuan.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-slate">Rating</span>
        <div className="flex flex-row-reverse items-center justify-end gap-1">
          {[5, 4, 3, 2, 1].map((n) => (
            <Fragment key={n}>
              <input
                type="radio"
                id={`rating-${itemId}-${n}`}
                name={`rating-${itemId}`}
                value={n}
                checked={rating === n}
                onChange={() => {
                  setRating(n);
                  setRatingError(null);
                }}
                className="peer sr-only"
              />
              <label
                htmlFor={`rating-${itemId}-${n}`}
                className="cursor-pointer text-line transition-colors duration-150 hover:text-signal peer-checked:text-signal"
              >
                <Star className="h-5 w-5" strokeWidth={1.75} fill="currentColor" />
              </label>
            </Fragment>
          ))}
        </div>
        {ratingError ? <p className="text-xs text-signal">{ratingError}</p> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`comment-${itemId}`} className="text-xs text-slate">
          Komentar (opsional)
        </label>
        <textarea
          id={`comment-${itemId}`}
          name={`comment-${itemId}`}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={3}
          placeholder="Ceritakan pengalaman Anda dengan produk ini..."
          className="w-full resize-none rounded-xl border border-line bg-cloud/60 px-3.5 py-2.5 text-sm text-ink outline-none transition-all duration-200 placeholder:text-slate focus:border-signal/50 focus:bg-paper focus:ring-4 focus:ring-signal/10"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-slate">Foto (opsional)</span>
        <div className="flex flex-wrap gap-2">
          {previews.map((src, index) => (
            <div
              key={src}
              className="group relative h-16 w-16 overflow-hidden rounded-xl border border-line"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Foto ${index + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                aria-label="Hapus foto"
                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink/70 text-paper transition-colors duration-150 hover:bg-ink"
              >
                <X className="h-3 w-3" strokeWidth={2} />
              </button>
            </div>
          ))}

          {images.length < MAX_IMAGES ? (
            <label
              htmlFor={`photos-${itemId}`}
              className={cn(
                "flex h-16 w-16 cursor-pointer items-center justify-center rounded-xl border border-dashed border-line text-slate/60 transition-colors duration-150 hover:border-signal/40 hover:text-signal",
                isCompressing && "pointer-events-none opacity-60"
              )}
            >
              <ImagePlus className="h-5 w-5" strokeWidth={1.75} />
              <input
                id={`photos-${itemId}`}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                disabled={isCompressing}
                onChange={(event) => {
                  handleFilesSelected(event.target.files);
                  event.target.value = "";
                }}
                className="sr-only"
              />
            </label>
          ) : null}
        </div>
        {imageError ? <p className="text-xs text-signal">{imageError}</p> : null}
        <p className="text-[11px] text-slate/70">
          Maksimal {MAX_IMAGES} foto — JPG, PNG, atau WebP.
        </p>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className={cn(
          "mt-1 inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-paper shadow-sm transition-all duration-200 hover:bg-ink/85 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:self-start"
        )}
      >
        {isPending ? "Mengirim..." : "Kirim Ulasan"}
      </button>
    </div>
  );
}
