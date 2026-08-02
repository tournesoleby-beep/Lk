import type { StockChangeReason } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { StockHistoryEntry } from "@/lib/admin/stock-history.types";

export type { StockChangeReason, StockHistoryEntry };

/**
 * Write a single row to the stock ledger. Called alongside every write that
 * changes a product's tracked stock:
 * - Product create/edit from the admin form (src/lib/admin/actions.ts)
 * - The automatic deduction when an order is marked PAID
 *   (src/lib/admin/order-actions.ts)
 *
 * Takes `previousStock`/`newStock` rather than a bare delta so the ledger
 * always has both endpoints of the change, not just the difference.
 *
 * A no-op (previousStock === newStock) is skipped — there's nothing to log.
 * Logging failures are swallowed by the caller (best-effort, same pattern as
 * the order-confirmation emails elsewhere in this codebase) so a ledger
 * write can never block the underlying stock change from succeeding.
 */
export async function recordStockChange(params: {
  productId: string;
  previousStock: number;
  newStock: number;
  reason: StockChangeReason;
  orderId?: string | null;
}): Promise<void> {
  const { productId, previousStock, newStock, reason, orderId } = params;
  if (previousStock === newStock) return;

  await prisma.stockHistory.create({
    data: {
      productId,
      previousStock,
      newStock,
      quantityChange: newStock - previousStock,
      reason,
      orderId: orderId ?? null,
    },
  });
}

function toStockHistoryEntry(row: {
  id: string;
  quantityChange: number;
  previousStock: number;
  newStock: number;
  reason: StockChangeReason;
  createdAt: Date;
  order: { orderNumber: string } | null;
}): StockHistoryEntry {
  return {
    id: row.id,
    quantityChange: row.quantityChange,
    previousStock: row.previousStock,
    newStock: row.newStock,
    reason: row.reason,
    orderNumber: row.order?.orderNumber ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Full stock ledger for a single product, newest first — powers the Stock
 * History section of the admin product edit modal (see
 * src/components/admin/product-form-modal.tsx).
 */
export async function queryProductStockHistory(
  productId: string
): Promise<StockHistoryEntry[]> {
  try {
    const rows = await prisma.stockHistory.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        quantityChange: true,
        previousStock: true,
        newStock: true,
        reason: true,
        createdAt: true,
        order: { select: { orderNumber: true } },
      },
    });
    return rows.map(toStockHistoryEntry);
  } catch (error) {
    console.error("[admin products] failed to load stock history:", error);
    return [];
  }
}
