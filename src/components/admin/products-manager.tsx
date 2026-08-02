"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Search, Star, Trash2 } from "lucide-react";

import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { MockProduct } from "@/lib/mock/products";
import { createProduct } from "@/lib/admin/actions";
import { EmptyState } from "@/components/home/empty-state";
import { PlaceholderTile } from "@/components/home/placeholder-tile";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  ProductFormModal,
  type ProductFormValues,
} from "@/components/admin/product-form-modal";

export function ProductsManager({
  initialProducts,
}: {
  initialProducts: MockProduct[];
}) {
  const router = useRouter();
  const [products, setProducts] = useState<MockProduct[]>(initialProducts);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<MockProduct | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<MockProduct | null>(null);

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(trimmed) ||
        product.sku?.toLowerCase().includes(trimmed) ||
        product.category.toLowerCase().includes(trimmed)
    );
  }, [products, query]);

  function openAddModal() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEditModal(product: MockProduct) {
    setEditing(product);
    setModalOpen(true);
  }

  async function handleSave(values: ProductFormValues) {
    // Editing isn't wired up to Prisma yet — keep the existing local-only
    // behavior so the Edit flow continues to work exactly as before.
    if (editing) {
      const today = new Date().toISOString().slice(0, 10);
      setProducts((prev) =>
        prev.map((product) =>
          product.id === editing.id
            ? { ...product, ...values, updatedAt: today }
            : product
        )
      );
      setModalOpen(false);
      setEditing(null);
      return { success: true as const };
    }

    const result = await createProduct(values);

    if (!result.success) {
      return result;
    }

    setProducts((prev) => [result.product, ...prev]);
    setModalOpen(false);
    setEditing(null);
    // Re-sync the server-rendered list too, so a fresh page load (or another
    // tab) reflects the new product as well.
    router.refresh();
    return result;
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    setProducts((prev) => prev.filter((product) => product.id !== pendingDelete.id));
    setPendingDelete(null);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-signal">
            Catalog
          </span>
          <h1 className="font-serif text-[1.75rem] font-semibold leading-[1.1] tracking-tight text-ink sm:text-3xl">
            Products
          </h1>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-ink px-5 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-paper transition-colors hover:bg-ink/85 sm:self-auto"
        >
          <Plus className="h-4 w-4" strokeWidth={1.75} />
          Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
          strokeWidth={1.75}
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, SKU, or category…"
          aria-label="Search products"
          className="w-full rounded-full border border-line bg-cloud/60 py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition-colors placeholder:text-slate focus:border-signal/50 focus:bg-paper"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No products match your search. Try a different name, SKU, or category." />
      ) : (
        <>
          {/* Desktop / tablet table */}
          <div className="hidden overflow-hidden rounded-2xl border border-line md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-cloud/60">
                  <th className="px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate">
                    Product
                  </th>
                  <th className="px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate">
                    Category
                  </th>
                  <th className="px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate">
                    Price
                  </th>
                  <th className="px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate">
                    Stock
                  </th>
                  <th className="px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate">
                    Status
                  </th>
                  <th className="px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate">
                    Updated
                  </th>
                  <th className="px-5 py-3 text-right font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-line last:border-b-0 hover:bg-cloud/40"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <PlaceholderTile
                          seed={product.id}
                          label={product.name}
                          className="h-10 w-10 shrink-0 overflow-hidden rounded-lg"
                        />
                        <div className="flex flex-col">
                          <span className="inline-flex items-center gap-1.5 font-medium text-ink">
                            {product.name}
                            {product.featured ? (
                              <Star
                                className="h-3.5 w-3.5 fill-gold text-gold"
                                strokeWidth={1.5}
                              />
                            ) : null}
                          </span>
                          <span className="font-mono text-xs text-slate">
                            {product.sku ?? "—"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-ink">{product.category}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-baseline gap-2 font-mono">
                        <span className="text-ink">
                          {formatCurrency(product.price, product.currency)}
                        </span>
                        {product.compareAtPrice ? (
                          <span className="text-xs text-slate line-through">
                            {formatCurrency(product.compareAtPrice, product.currency)}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "font-mono",
                          product.stock === 0 ? "text-signal" : "text-ink"
                        )}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={product.status} />
                    </td>
                    <td className="px-5 py-3 text-slate">
                      {formatDate(product.updatedAt, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(product)}
                          aria-label={`Edit ${product.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-ink transition-colors hover:bg-cloud"
                        >
                          <Pencil className="h-4 w-4" strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(product)}
                          aria-label={`Delete ${product.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-ink transition-colors hover:bg-accent-soft hover:text-signal"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="flex flex-col gap-3 md:hidden">
            {filtered.map((product) => (
              <div
                key={product.id}
                className="flex flex-col gap-3 rounded-2xl border border-line bg-paper p-4"
              >
                <div className="flex items-start gap-3">
                  <PlaceholderTile
                    seed={product.id}
                    label={product.name}
                    className="h-12 w-12 shrink-0 overflow-hidden rounded-lg"
                  />
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="inline-flex items-center gap-1.5 font-medium text-ink">
                      {product.name}
                      {product.featured ? (
                        <Star
                          className="h-3.5 w-3.5 fill-gold text-gold"
                          strokeWidth={1.5}
                        />
                      ) : null}
                    </span>
                    <span className="font-mono text-xs text-slate">
                      {product.sku ?? "—"} · {product.category}
                    </span>
                  </div>
                  <StatusBadge status={product.status} />
                </div>

                <div className="flex items-center justify-between border-t border-line pt-3">
                  <div className="flex items-baseline gap-2 font-mono text-sm">
                    <span className="text-ink">
                      {formatCurrency(product.price, product.currency)}
                    </span>
                    {product.compareAtPrice ? (
                      <span className="text-xs text-slate line-through">
                        {formatCurrency(product.compareAtPrice, product.currency)}
                      </span>
                    ) : null}
                  </div>
                  <span
                    className={cn(
                      "font-mono text-xs",
                      product.stock === 0 ? "text-signal" : "text-slate"
                    )}
                  >
                    {product.stock} in stock
                  </span>
                </div>

                <div className="flex items-center gap-2 border-t border-line pt-3">
                  <button
                    type="button"
                    onClick={() => openEditModal(product)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-ink/15 py-2 text-xs font-medium uppercase tracking-[0.1em] text-ink transition-colors hover:bg-cloud"
                  >
                    <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(product)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-line py-2 text-xs font-medium uppercase tracking-[0.1em] text-signal transition-colors hover:bg-accent-soft"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="font-mono text-xs text-slate">
        Showing {filtered.length} of {products.length} products
      </p>

      {modalOpen ? (
        <ProductFormModal
          key={editing?.id ?? "new"}
          product={editing}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      ) : null}

      {/* Delete confirmation */}
      {pendingDelete ? (
        <>
          <div
            onClick={() => setPendingDelete(null)}
            aria-hidden="true"
            className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px]"
          />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label="Confirm delete"
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line bg-paper p-6 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.45)]"
          >
            <h2 className="font-serif text-lg font-semibold text-ink">
              Delete product?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate">
              This will remove{" "}
              <span className="font-medium text-ink">{pendingDelete.name}</span> from
              the catalog. This action can&apos;t be undone.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-full border border-ink/15 px-4 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-ink transition-colors hover:bg-cloud"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-full bg-signal px-4 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-paper transition-colors hover:bg-signal/90"
              >
                Delete
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
