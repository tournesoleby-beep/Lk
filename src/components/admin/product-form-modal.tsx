"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Image as ImageIcon, X } from "lucide-react";

import { slugify } from "@/lib/utils";
import { uploadProductImage } from "@/lib/admin/actions";
import type { MockProduct, MockProductStatus } from "@/lib/mock/products";

const STATUS_OPTIONS: MockProductStatus[] = ["DRAFT", "ACTIVE", "ARCHIVED"];

export type ProductFormValues = Omit<MockProduct, "id" | "updatedAt">;

const EMPTY_VALUES: ProductFormValues = {
  name: "",
  slug: "",
  sku: "",
  category: "Fashion",
  price: 0,
  compareAtPrice: null,
  currency: "USD",
  status: "DRAFT",
  featured: false,
  stock: 0,
  imageUrl: null,
};

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
  const [imagePreview, setImagePreview] = useState<string | null>(
    product?.imageUrl ?? null
  );
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageError(null);
    setImagePreview(URL.createObjectURL(file));
    setIsUploadingImage(true);

    const uploadForm = new FormData();
    uploadForm.append("file", file);
    const result = await uploadProductImage(uploadForm);

    setIsUploadingImage(false);

    if (!result.success) {
      setImageError(result.error);
      return;
    }

    setValues((v) => ({ ...v, imageUrl: result.url }));
    setImagePreview(result.url);
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
        className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={product ? "Edit product" : "Add product"}
        className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-line bg-paper shadow-[0_30px_70px_-30px_rgba(0,0,0,0.45)]"
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="font-serif text-xl font-semibold text-ink">
            {product ? "Edit product" : "Add product"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-cloud"
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
              className="w-full rounded-xl border border-line bg-cloud/60 px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-slate focus:border-signal/50 focus:bg-paper"
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
                className="w-full rounded-xl border border-line bg-cloud/60 px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-slate focus:border-signal/50 focus:bg-paper"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-slate">
                Category
              </span>
              <select
                value={values.category}
                onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))}
                className="w-full rounded-xl border border-line bg-cloud/60 px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-signal/50 focus:bg-paper"
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
                Price (USD)
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
                className="w-full rounded-xl border border-line bg-cloud/60 px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-signal/50 focus:bg-paper"
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
                className="w-full rounded-xl border border-line bg-cloud/60 px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-signal/50 focus:bg-paper"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-slate">
              Product image
            </span>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-cloud">
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-6 w-6 text-slate" strokeWidth={1.5} />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full text-sm text-ink file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-3.5 file:py-2 file:text-xs file:font-medium file:uppercase file:tracking-[0.1em] file:text-paper file:transition-colors hover:file:bg-ink/85"
                />
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
          </label>

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
              className="w-full rounded-xl border border-line bg-cloud/60 px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-signal/50 focus:bg-paper"
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
              className="rounded-full border border-ink/15 px-4 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-ink transition-colors hover:bg-cloud"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingImage}
              className="rounded-full bg-ink px-5 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-paper transition-colors hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-60"
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
