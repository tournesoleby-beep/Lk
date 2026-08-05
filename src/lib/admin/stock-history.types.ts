import type { StockChangeReason } from "@prisma/client";

export type { StockChangeReason };

export type StockHistoryEntry = {
  id: string;
  quantityChange: number;
  previousStock: number;
  newStock: number;
  reason: StockChangeReason;
  orderNumber: string | null;
  createdAt: string;
};

export const STOCK_CHANGE_REASON_LABELS: Record<StockChangeReason, string> = {
  INITIAL_STOCK: "Stok awal",
  RESTOCK: "Penambahan stok",
  MANUAL_ADJUSTMENT: "Penyesuaian manual",
  ORDER_PAID: "Pesanan dibayar",
};
