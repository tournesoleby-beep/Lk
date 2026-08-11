// Thin client for Biteship's Public Tracking API — the only Biteship
// endpoint this app calls. It looks up live courier checkpoint history for
// a waybill number we already have (entered by an admin, see
// src/lib/admin/order-actions.ts), rather than creating shipments/orders
// through Biteship. No order-creation, rates, or webhook handling here.
//
// Docs: https://biteship.com/en/docs/api/trackings/retrieve_public
//   GET https://api.biteship.com/v1/trackings/{waybill_id}/couriers/{courier_code}
//   Header: authorization: <BITESHIP_API_KEY>  (raw key, not "Bearer ...")

const BITESHIP_API_BASE = "https://api.biteship.com/v1";

/**
 * Couriers offered in the admin shipping form, paired with the exact
 * `courier_code` Biteship's tracking API expects. Not Biteship's full
 * courier list (they support 30+) — just the ones Lapiita Karya actually
 * ships with. Add more pairs here if a new courier comes into use; the
 * code must match Biteship's Courier API value or tracking lookups for
 * that courier will fail.
 */
export const BITESHIP_COURIERS: { code: string; label: string }[] = [
  { code: "jne", label: "JNE" },
  { code: "jnt", label: "J&T Express" },
  { code: "sicepat", label: "SiCepat" },
  { code: "anteraja", label: "AnterAja" },
  { code: "ninja", label: "Ninja Xpress" },
  { code: "wahana", label: "Wahana" },
  { code: "pos", label: "Pos Indonesia" },
  { code: "tiki", label: "TIKI" },
  { code: "lion", label: "Lion Parcel" },
  { code: "idexpress", label: "ID Express" },
  { code: "sap", label: "SAP Express" },
  { code: "first", label: "First Logistics" },
  { code: "ncs", label: "NCS" },
  { code: "rex", label: "REX" },
  { code: "rpx", label: "RPX" },
  // Gojek's delivery service is branded "GoSend", but Biteship's own
  // courier_code for it follows their usual bare-company-name pattern
  // (same as "grab", "jne") — confirmed against Biteship's rates-API
  // examples, which pass instant couriers as e.g. "grab,jne,tiki". If a
  // Gojek waybill ever comes back "not found" from the tracking API,
  // check Biteship's dashboard (Couriers list) for the exact code your
  // account uses and update this entry.
  { code: "gojek", label: "Gojek (GoSend)" },
  { code: "grab", label: "GrabExpress" },
  { code: "paxel", label: "Paxel" },
];

const BITESHIP_COURIER_LABEL_BY_CODE = new Map(
  BITESHIP_COURIERS.map((courier) => [courier.code, courier.label])
);

/** Human-readable label for a Biteship courier code, e.g. "jne" -> "JNE". */
export function courierLabelForCode(code: string): string {
  return BITESHIP_COURIER_LABEL_BY_CODE.get(code) ?? code.toUpperCase();
}

export type BiteshipTrackingCheckpoint = {
  note: string;
  status: string | null;
  updatedAt: string;
};

export type BiteshipTracking = {
  status: string;
  waybillId: string;
  courierCompany: string;
  history: BiteshipTrackingCheckpoint[];
};

/**
 * Fetch live checkpoint history for a waybill from Biteship's public
 * tracking endpoint. Returns `null` on any failure (missing API key,
 * network error, non-2xx response, unexpected shape) — callers treat that
 * exactly like "no live tracking available yet" rather than an error that
 * should block rendering the rest of the order. See getOrderForTracking in
 * src/lib/checkout/orders.ts, which is the only caller.
 */
export async function getBiteshipTracking(
  waybillId: string,
  courierCode: string
): Promise<BiteshipTracking | null> {
  const apiKey = process.env.BITESHIP_API_KEY;
  if (!apiKey || !waybillId || !courierCode) return null;

  try {
    const response = await fetch(
      `${BITESHIP_API_BASE}/trackings/${encodeURIComponent(waybillId)}/couriers/${encodeURIComponent(courierCode)}`,
      {
        method: "GET",
        headers: { authorization: apiKey },
        // Tracking pages are read live on every visit — no point caching
        // a courier status that changes throughout the day.
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error(
        `[biteship] tracking request failed (${response.status}) for waybill ${waybillId}`
      );
      return null;
    }

    const data = await response.json();

    if (!data?.success || !Array.isArray(data?.history)) {
      return null;
    }

    return {
      status: typeof data.status === "string" ? data.status : "unknown",
      waybillId: typeof data.waybill_id === "string" ? data.waybill_id : waybillId,
      courierCompany:
        typeof data.courier?.company === "string" ? data.courier.company : courierCode,
      history: data.history
        .filter(
          (entry: unknown): entry is { note: unknown; updated_at: unknown; status?: unknown } =>
            typeof entry === "object" && entry !== null
        )
        .map((entry: { note: unknown; updated_at: unknown; status?: unknown }) => ({
          note: typeof entry.note === "string" ? entry.note : "",
          status: typeof entry.status === "string" ? entry.status : null,
          updatedAt: typeof entry.updated_at === "string" ? entry.updated_at : "",
        }))
        .filter((checkpoint: BiteshipTrackingCheckpoint) => checkpoint.note && checkpoint.updatedAt),
    };
  } catch (error) {
    console.error(`[biteship] failed to fetch tracking for waybill ${waybillId}:`, error);
    return null;
  }
}
