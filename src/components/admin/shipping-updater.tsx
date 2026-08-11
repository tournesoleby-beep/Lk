"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import { updateOrderShipping } from "@/lib/admin/order-actions";
import { BITESHIP_COURIERS } from "@/lib/biteship";

const CUSTOM_COURIER_VALUE = "__custom__";

export function ShippingUpdater({
  orderId,
  currentCourierCode,
  currentTrackingNumber,
}: {
  orderId: string;
  currentCourierCode: string | null;
  currentTrackingNumber: string | null;
}) {
  const router = useRouter();
  const isKnownCourier =
    currentCourierCode !== null &&
    BITESHIP_COURIERS.some((courier) => courier.code === currentCourierCode);

  const [selection, setSelection] = useState(
    currentCourierCode === null ? "" : isKnownCourier ? currentCourierCode : CUSTOM_COURIER_VALUE
  );
  const [customCode, setCustomCode] = useState(isKnownCourier ? "" : currentCourierCode ?? "");
  const [trackingNumber, setTrackingNumber] = useState(currentTrackingNumber ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const courierCode = selection === CUSTOM_COURIER_VALUE ? customCode.trim() : selection;

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);

    const result = await updateOrderShipping(orderId, courierCode, trackingNumber);

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  const hasChanged =
    courierCode !== (currentCourierCode ?? "") ||
    trackingNumber.trim() !== (currentTrackingNumber ?? "");

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-slate">
          Kurir
        </span>
        <select
          value={selection}
          onChange={(event) => setSelection(event.target.value)}
          className="w-full rounded-xl border border-line bg-cloud/60 px-3.5 py-2.5 text-sm text-ink outline-none transition-all duration-200 focus:border-signal/50 focus:bg-paper focus:ring-4 focus:ring-signal/10"
        >
          <option value="">Belum dipilih</option>
          {BITESHIP_COURIERS.map((courier) => (
            <option key={courier.code} value={courier.code}>
              {courier.label}
            </option>
          ))}
          <option value={CUSTOM_COURIER_VALUE}>Lainnya (masukkan kode manual)</option>
        </select>
      </label>

      {selection === CUSTOM_COURIER_VALUE ? (
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-slate">
            Kode Kurir Biteship
          </span>
          <input
            type="text"
            value={customCode}
            onChange={(event) => setCustomCode(event.target.value.trim().toLowerCase())}
            placeholder="mis. gojek, lalamove, borzo"
            className="w-full rounded-xl border border-line bg-cloud/60 px-3.5 py-2.5 font-mono text-sm text-ink outline-none transition-all duration-200 placeholder:font-sans placeholder:text-slate focus:border-signal/50 focus:bg-paper focus:ring-4 focus:ring-signal/10"
          />
          <span className="text-xs text-slate">
            Lihat kode yang tepat di daftar Kurir pada dashboard Biteship Anda.
          </span>
        </label>
      ) : null}

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-slate">
          Nomor Resi
        </span>
        <input
          type="text"
          value={trackingNumber}
          onChange={(event) => setTrackingNumber(event.target.value)}
          placeholder="Masukkan nomor resi"
          className="w-full rounded-xl border border-line bg-cloud/60 px-3.5 py-2.5 font-mono text-sm text-ink outline-none transition-all duration-200 placeholder:font-sans placeholder:text-slate focus:border-signal/50 focus:bg-paper focus:ring-4 focus:ring-signal/10"
        />
      </label>

      {error ? (
        <p className="rounded-xl bg-accent-soft px-3.5 py-2.5 text-sm text-signal">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!hasChanged || isSubmitting}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-paper shadow-sm transition-all duration-200 hover:bg-ink/85 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : null}
        {isSubmitting ? "Menyimpan…" : "Simpan Pengiriman"}
      </button>
    </div>
  );
}
