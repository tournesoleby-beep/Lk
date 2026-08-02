"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Loader2,
  Star,
  Trash2,
  X,
} from "lucide-react";

import { cn, slugify } from "@/lib/utils";
import { uploadProductImage } from "@/lib/admin/actions";
import type {
  AdminProductImage,
  MockProduct,
  MockProductStatus,
} from "@/lib/mock/products";

const STATUS_OPTIONS: MockProductStatus[] = ["DRAFT", "ACTIVE", "ARCHIVED"];

export type ProductFormValues = Omit<MockProduct, "id" | "updatedAt">;

const EMPTY_VALUES: ProductFormValues = {
  name: "",
  slug: "",
  sku: "",
  category: "Fashion",
  price: 0,
  compareAtPrice: null,
  currency: "IDR",
  status: "DRAFT",
  featured: false,
  stock: 0,
  images: [],
};

/**
 * Local-only id for an image that's mid-upload and hasn't been through the
 * server yet — lets it be reordered/removed from the list before the file
 * has finished uploading (or before the form has even been saved once).
 */
function makeLocalImageId() {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function ProductFormModal({
  product,
  onClose,
  onSave,
}: {
  product: MockProduct | null;
  onClose: () => void;
  onSave: (
    values: ProductFormValues
  ) => Promise<{ success: boolean; error?: string } | void> | void;
}) {
  const [values, setValues] = useState<ProductFormValues>(
    product ? { ...product } : EMPTY_VALUES
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Ids of images that are still mid-upload — used to show a spinner over
  // that thumbnail and to block submitting until every upload settles.
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set());
  const [imageError, setImageError] = useState<string | null>(null);
  const isUploadingImage = uploadingIds.size > 0;

  async function handleImagesChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    // Reset the input so selecting the same file again still fires onChange.
    event.target.value = "";
    if (files.length === 0) return;

    setImageError(null);

    const placeholders: AdminProductImage[] = files.map((file) => ({
      id: makeLocalImageId(),
      url: URL.createObjectURL(file),
      altText: null,
    }));

    setValues((v) => ({ ...v, images: [...v.images, ...placeholders] }));
    setUploadingIds((prev) => {
      const next = new Set(prev);
      placeholders.forEach((p) => next.add(p.id));
      return next;
    });

    await Promise.all(
      files.map(async (file, index) => {
        const placeholder = placeholders[index];
        const uploadForm = new FormData();
        uploadForm.append("file", file);
        const result = await uploadProductImage(uploadForm);

        if (!result.success) {
          setImageError(result.error);
          setValues((v) => ({
            ...v,
            images: v.images.filter((img) => img.id !== placeholder.id),
          }));
        } else {
          setValues((v) => ({
            ...v,
            images: v.images.map((img) =>
              img.id === placeholder.id ? { ...img, url: result.url } : img
            ),
          }));
        }

        setUploadingIds((prev) => {
          const next = new Set(prev);
          next.delete(placeholder.id);
          return next;
        });
      })
    );
  }

  function removeImage(id: string) {
    setValues((v) => ({
      ...v,
      images: v.images.filter((img) => img.id !== id),
    }));
    setUploadingIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function setCoverImage(id: string) {
    setValues((v) => {
      const index = v.images.findIndex((img) => img.id === id);
      if (index <= 0) return v;
      const images = [...v.images];
      const [image] = images.splice(index, 1);
      images.unshift(image);
      return { ...v, images };
    });
  }

  function moveImage(id: string, direction: -1 | 1) {
    setValues((v) => {
      const index = v.images.findIndex((img) => img.id === id);
      const targetIndex = index + direction;
      if (index === -1 || targetIndex < 0 || targetIndex >= v.images.length) {
        return v;
      }
      const images = [...v.images];
      [images[index], images[targetIndex]] = [images[targetIndex], images[index]];
      return { ...v, images };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await onSave({
      ...values,
      slug: values.slug || slugify(values.name),
    });

    setIsSubmitting(false);

    if (result && result.success === false) {
      setError(result.error ?? "Something went wrong. Please try again.");
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 z-50 animate-in bg-ink/40 backdrop-blur-[2px] fade-in duration-200"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={product ? "Edit product" : "Add product"}
        className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 animate-in flex-col overflow-hidden rounded-2xl border border-line bg-paper shadow-lg zoom-in-95 fade-in duration-200"
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="font-serif text-xl font-semibold text-ink">
            {product ? "Edit product" : "Add product"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink transition-all duration-200 hover:bg-cloud active:scale-90"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5"
        >
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-slate">
              Name
            </span>
            <input
              required
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
              placeholder="e.g. Linen Wrap Blouse"
              className="w-full rounded-xl border border-line bg-cloud/60 px-3.5 py-2.5 text-sm text-ink outline-none transition-all duration-200 placeholder:text-slate focus:border-signal/50 focus:bg-paper focus:ring-4 focus:ring-signal/10"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-slate">
                SKU
              </span>
              <input
                value={values.sku ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, sku: e.target.value }))}
                placeholder="LK-000"
                className="w-full rounded-xl border border-line bg-cloud/60 px-3.5 py-2.5 text-sm text-ink outline-none transition-all duration-200 placeholder:text-slate focus:border-signal/50 focus:bg-paper focus:ring-4 focus:ring-signal/10"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-slate">
                Category
              </span>
              <select
                value={values.category}
                onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))}
                className="w-full rounded-xl border border-line bg-cloud/60 px-3.5 py-2.5 text-sm text-ink outline-none transition-all duration-200 focus:border-signal/50 focus:bg-paper focus:ring-4 focus:ring-signal/10"
              >
                <option value="Fashion">Fashion</option>
                <option value="Food">Food</option>
                <option value="Production">Production</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-slate">
                Price (IDR)
              </span>
              <input
                required
                type="number"
                min={0}
                step="0.01"
                value={values.price}
                onChange={(e) =>
                  setValues((v) => ({ ...v, price: Number(e.target.value) }))
                }
                className="w-full rounded-xl border border-line bg-cloud/60 px-3.5 py-2.5 text-sm text-ink outline-none transition-all duration-200 focus:border-signal/50 focus:bg-paper focus:ring-4 focus:ring-signal/10"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-slate">
                Stock
              </span>
              <input
                required
                type="number"
                min={0}
                value={values.stock}
                onChange={(e) =>
                  setValues((v) => ({ ...v, stock: Number(e.target.value) }))
                }
                className="w-full rounded-xl border border-line bg-cloud/60 px-3.5 py-2.5 text-sm text-ink outline-none transition-all duration-200 focus:border-signal/50 focus:bg-paper focus:ring-4 focus:ring-signal/10"
              />
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-slate">
              Product images
            </span>

            {values.images.length > 0 ? (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {values.images.map((image, index) => {
                  const isUploading = uploadingIds.has(image.id);
                  const isCover = index === 0;
                  return (
                    <div
                      key={image.id}
                      className={cn(
                        "group relative aspect-square overflow-hidden rounded-xl border shadow-xs",
                        isCover ? "border-ink" : "border-line"
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.url}
                        alt={image.altText ?? "Product image"}
                        className="h-full w-full object-cover"
                      />

                      {isUploading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-ink/40">
                          <Loader2
                            className="h-5 w-5 animate-spin text-paper"
                            strokeWidth={2}
                          />
                        </div>
                      ) : (
                        <>
                          {isCover ? (
                            <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-paper">
                              <Star
                                className="h-2.5 w-2.5 fill-paper"
                                strokeWidth={0}
                              />
                              Cover
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setCoverImage(image.id)}
                              aria-label="Set as cover image"
                              title="Set as cover image"
                              className="absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-paper opacity-0 transition-opacity duration-150 hover:bg-ink group-hover:opacity-100"
                            >
                              <Star className="h-3.5 w-3.5" strokeWidth={1.75} />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => removeImage(image.id)}
                            aria-label="Remove image"
                            title="Remove image"
                            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-paper opacity-0 transition-opacity duration-150 hover:bg-signal group-hover:opacity-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                          </button>

                          <div className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-between opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => moveImage(image.id, -1)}
                              disabled={index === 0}
                              aria-label="Move image earlier"
                              title="Move earlier"
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-paper transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-0"
                            >
                              <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveImage(image.id, 1)}
                              disabled={index === values.images.length - 1}
                              aria-label="Move image later"
                              title="Move later"
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-paper transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-0"
                            >
                              <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-line bg-cloud shadow-xs">
                <ImageIcon className="h-6 w-6 text-slate" strokeWidth={1.5} />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImagesChange}
                className="w-full text-sm text-ink file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-ink file:px-3.5 file:py-2 file:text-xs file:font-medium file:uppercase file:tracking-[0.1em] file:text-paper file:transition-colors hover:file:bg-ink/85"
              />
              <span className="font-mono text-[11px] text-slate">
                The first image is the cover shown in listings. Hover a
                thumbnail to reorder, set the cover, or remove it.
              </span>
              {isUploadingImage ? (
                <span className="font-mono text-xs text-slate">
                  Uploading…
                </span>
              ) : null}
              {imageError ? (
                <span className="text-xs text-signal">{imageError}</span>
              ) : null}
            </div>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-slate">
              Status
            </span>
            <select
              value={values.status}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  status: e.target.value as MockProductStatus,
                }))
              }
              className="w-full rounded-xl border border-line bg-cloud/60 px-3.5 py-2.5 text-sm text-ink outline-none transition-all duration-200 focus:border-signal/50 focus:bg-paper focus:ring-4 focus:ring-signal/10"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0) + option.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              checked={values.featured}
              onChange={(e) =>
                setValues((v) => ({ ...v, featured: e.target.checked }))
              }
              className="h-4 w-4 rounded border-line accent-signal"
            />
            <span className="text-sm text-ink">Featured on homepage</span>
          </label>

          {error ? (
            <p className="rounded-xl bg-accent-soft px-3.5 py-2.5 text-sm text-signal">
              {error}
            </p>
          ) : null}

          <div className="mt-2 flex items-center justify-end gap-3 border-t border-line pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-ink/15 px-4 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-ink transition-all duration-200 hover:bg-cloud active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingImage}
              className="rounded-full bg-ink px-5 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-paper shadow-sm transition-all duration-200 hover:bg-ink/85 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
            >
              {isSubmitting
                ? "Saving…"
                : product
                  ? "Save changes"
                  : "Add product"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
