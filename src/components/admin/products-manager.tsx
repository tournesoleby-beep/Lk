"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Search, Star, Trash2 } from "lucide-react";

import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { MockProduct, MockProductStatus } from "@/lib/mock/products";
import { createProduct, deleteProduct, updateProduct } from "@/lib/admin/actions";
import { EmptyState } from "@/components/home/empty-state";
import { PlaceholderTile } from "@/components/home/placeholder-tile";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  ProductFormModal,
  type ProductFormValues,
} from "@/components/admin/product-form-modal";

const STATUS_FILTERS: { label: string; value: MockProductStatus | "ALL" }[] = [
  { label: "Semua", value: "ALL" },
  { label: "Aktif", value: "ACTIVE" },
  { label: "Draf", value: "DRAFT" },
];

export function ProductsManager({
  initialProducts,
}: {
  initialProducts: MockProduct[];
}) {
  const router = useRouter();
  const [products, setProducts] = useState<MockProduct[]>(initialProducts);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<MockProductStatus | "ALL">(
    "ALL"
  );
  const [editing, setEditing] = useState<MockProduct | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<MockProduct | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesQuery =
        !trimmed ||
        product.name.toLowerCase().includes(trimmed) ||
        product.sku?.toLowerCase().includes(trimmed) ||
        product.category.toLowerCase().includes(trimmed);
      const matchesStatus =
        statusFilter === "ALL" || product.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [products, query, statusFilter]);

  function openAddModal() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEditModal(product: MockProduct) {
    setEditing(product);
    setModalOpen(true);
  }

  async function handleSave(values: ProductFormValues) {
    const result = editing
      ? await updateProduct(editing.id, values)
      : await createProduct(values);

    if (!result.success) {
      return result;
    }

    setProducts((prev) =>
      editing
        ? prev.map((product) =>
            product.id === result.product.id ? result.product : product
          )
        : [result.product, ...prev]
    );
    setModalOpen(false);
    setEditing(null);
    // Re-sync the server-rendered list too, so a fresh page load (or another
    // tab) reflects the change as well.
    router.refresh();
    return result;
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    const result = await deleteProduct(pendingDelete.id);

    setIsDeleting(false);

    if (!result.success) {
      setDeleteError(result.error);
      return;
    }

    setProducts((prev) => prev.filter((product) => product.id !== pendingDelete.id));
    setPendingDelete(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-signal">
            Katalog
          </span>
          <h1 className="font-serif text-[1.75rem] font-semibold leading-[1.1] tracking-tight text-ink sm:text-3xl">
            Produk
          </h1>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-ink px-5 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-paper shadow-sm transition-all duration-200 hover:bg-ink/85 hover:shadow-md active:scale-[0.98] sm:self-auto"
        >
          <Plus className="h-4 w-4" strokeWidth={1.75} />
          Tambah Produk
        </button>
      </div>

      {/* Search + status filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-sm">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
            strokeWidth={1.75}
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari berdasarkan nama, SKU, atau kategori…"
            aria-label="Cari produk"
            className="w-full rounded-full border border-line bg-cloud/60 py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition-all duration-200 placeholder:text-slate focus:border-signal/50 focus:bg-paper focus:ring-4 focus:ring-signal/10"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              aria-pressed={statusFilter === filter.value}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.1em] transition-all duration-200 active:scale-95",
                statusFilter === filter.value
                  ? "bg-ink text-paper shadow-sm"
                  : "border border-line text-slate hover:border-ink/25 hover:bg-cloud/60 hover:text-ink"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="Tidak ada produk yang cocok dengan pencarian atau filter Anda. Coba nama, SKU, kategori, atau status lain." />
      ) : (
        <>
          {/* Desktop / tablet table */}
          <div className="hidden overflow-hidden rounded-2xl border border-line shadow-xs md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-cloud/60">
                  <th className="px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate">
                    Produk
                  </th>
                  <th className="px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate">
                    Kategori
                  </th>
                  <th className="px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate">
                    Harga
                  </th>
                  <th className="px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate">
                    Stok
                  </th>
                  <th className="px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate">
                    Status
                  </th>
                  <th className="px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate">
                    Diperbarui
                  </th>
                  <th className="px-5 py-3 text-right font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-line transition-colors duration-150 last:border-b-0 hover:bg-cloud/40"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {product.images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.images[0].url}
                            alt={product.name}
                            className="h-10 w-10 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <PlaceholderTile
                            seed={product.id}
                            label={product.name}
                            className="h-10 w-10 shrink-0 overflow-hidden rounded-lg"
                          />
                        )}
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
                          className="flex h-8 w-8 items-center justify-center rounded-full text-ink transition-all duration-200 hover:bg-cloud active:scale-90"
                        >
                          <Pencil className="h-4 w-4" strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError(null);
                            setPendingDelete(product);
                          }}
                          aria-label={`Hapus ${product.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-ink transition-all duration-200 hover:bg-accent-soft hover:text-signal active:scale-90"
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
                className="flex flex-col gap-3 rounded-2xl border border-line bg-paper p-4 shadow-xs transition-shadow duration-200 hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  {product.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.images[0].url}
                      alt={product.name}
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <PlaceholderTile
                      seed={product.id}
                      label={product.name}
                      className="h-12 w-12 shrink-0 overflow-hidden rounded-lg"
                    />
                  )}
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
                    {product.stock} tersedia
                  </span>
                </div>

                <div className="flex items-center gap-2 border-t border-line pt-3">
                  <button
                    type="button"
                    onClick={() => openEditModal(product)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-ink/15 py-2 text-xs font-medium uppercase tracking-[0.1em] text-ink transition-all duration-200 hover:bg-cloud active:scale-[0.98]"
                  >
                    <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError(null);
                      setPendingDelete(product);
                    }}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-line py-2 text-xs font-medium uppercase tracking-[0.1em] text-signal transition-all duration-200 hover:bg-accent-soft active:scale-[0.98]"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="font-mono text-xs text-slate">
        Menampilkan {filtered.length} dari {products.length} produk
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
            onClick={() => {
              if (isDeleting) return;
              setPendingDelete(null);
              setDeleteError(null);
            }}
            aria-hidden="true"
            className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px] animate-in fade-in duration-200"
          />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label="Konfirmasi hapus"
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 animate-in rounded-2xl border border-line bg-paper p-6 shadow-lg zoom-in-95 fade-in duration-200"
          >
            <h2 className="font-serif text-lg font-semibold text-ink">
              Hapus produk ini?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate">
              Tindakan ini akan menghapus{" "}
              <span className="font-medium text-ink">{pendingDelete.name}</span> dari
              katalog. Tindakan ini tidak dapat dibatalkan.
            </p>
            {deleteError ? (
              <p className="mt-3 rounded-xl bg-accent-soft px-3.5 py-2.5 text-sm text-signal">
                {deleteError}
              </p>
            ) : null}
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setPendingDelete(null);
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                className="rounded-full border border-ink/15 px-4 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-ink transition-all duration-200 hover:bg-cloud active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="rounded-full bg-signal px-4 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-paper shadow-sm transition-all duration-200 hover:bg-signal/90 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
              >
                {isDeleting ? "Menghapus…" : "Hapus"}
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
