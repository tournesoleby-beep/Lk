/**
 * Biteship shipping-rates integration.
 *
 * Wraps Biteship's `POST /v1/rates/couriers` endpoint (see
 * https://biteship.com/en/docs/api/rates/retrieve) so the rest of the app
 * can ask "what will it cost to ship this?" without knowing anything about
 * Biteship's request/response shape.
 *
 * Requires `BITESHIP_API_KEY` — see `.env.example`. `BITESHIP_BASE_URL` is
 * optional and only needed to point at a non-default API host (e.g. a
 * sandbox/test environment); it defaults to the production API.
 *
 * This only fetches rates — it never invents or estimates a price itself.
 * If Biteship can't be reached or returns no matching couriers, callers get
 * back an explicit failure rather than a manually-calculated fallback.
 *
 * Uses `BITESHIP_API_KEY`, a server-only secret — only import this from
 * server code (Server Actions, Route Handlers, RSCs), never from a
 * `"use client"` component.
 */

// Biteship account/store is Indonesia-only today, so only these three
// couriers are surfaced to the storefront. Biteship's `couriers` param also
// accepts many others (SiCepat, AnterAja, ...) — narrowing here means we
// only ever request, and only ever return, these three.
//
// NOTE: the courier company code Biteship expects for GoSend is "gojek",
// not "gosend" — GoSend is Gojek's delivery-service *brand name*, but
// Biteship's system (and its `couriers` request param / `courier_code`
// response field) key it under the company name, "gojek". Sending
// "gosend" is a code Biteship doesn't recognize, so it's silently dropped
// rather than erroring — which is exactly the "only JNE comes back"
// symptom this was causing.
const SUPPORTED_COURIERS = {
  jne: "JNE",
  gojek: "GoSend",
  grab: "GrabExpress",
} as const;

type SupportedCourierCode = keyof typeof SUPPORTED_COURIERS;

export const BITESHIP_BASE_URL = process.env.BITESHIP_BASE_URL ?? "https://api.biteship.com";

/**
 * A pickup or drop-off location for a rates request. Biteship accepts
 * several ways to describe a location, and — unlike a typical "pick one"
 * API — lets you send more than one for the same origin/destination at
 * once (Biteship calls this a "mix" request). That matters here because
 * area ID and postal code are what most regular couriers (JNE, etc.) key
 * their rates off of, but Biteship can only return pricing for *instant*
 * couriers (GoSend, GrabExpress) when given precise latitude/longitude —
 * those are priced as an actual point-to-point ride-hailing route, not by
 * administrative area, so Biteship silently omits them from the response
 * whenever only an area ID or postal code is supplied.
 *
 * All fields are optional so a caller can supply just an area ID, just
 * coordinates, or both — `locationToRequestFields` below sends whichever
 * combination is present. Sending both when available is the
 * recommended approach: it gives JNE its usual area-based accuracy
 * while still unlocking GoSend/GrabExpress pricing.
 */
export type BiteshipLocation = {
  areaId?: string;
  postalCode?: string | number;
  /**
   * Precise coordinates. Required by Biteship for instant-courier pricing
   * (see above) — optional here because it isn't always resolvable (e.g.
   * geocoding a free-text destination can fail), in which case requests
   * still go out with area ID / postal code alone.
   */
  latitude?: number;
  longitude?: number;
};

export type GetShippingRatesParams = {
  origin: BiteshipLocation;
  destination: BiteshipLocation;
  /** Total shippable weight of the order, in grams (see `shippingWeightGrams`). */
  shippingWeightGrams: number;
  /**
   * Total value of the goods being shipped, in the smallest whole currency
   * unit Biteship expects (IDR, so e.g. 150000 for Rp150.000). Only used by
   * Biteship for couriers that price based on declared value / insurance —
   * defaults to 0 if omitted.
   */
  itemValue?: number;
};

export type ShippingRateOption = {
  /** Human-readable courier name, e.g. "JNE". */
  courier: string;
  /** Biteship's courier code, e.g. "jne". */
  courierCode: SupportedCourierCode;
  /** Human-readable service name, e.g. "Reguler". */
  service: string;
  /** Biteship's service code, e.g. "reg". */
  serviceCode: string;
  /** Estimated delivery time as reported by Biteship, e.g. "2 - 3 days". */
  eta: string;
  /** Shipping cost in the currency below (no manual calculation — this is Biteship's own quoted price). */
  cost: number;
  currency: string;
};

export type GetShippingRatesResult =
  | { success: true; rates: ShippingRateOption[] }
  | { success: false; error: string };

/**
 * Builds the `{prefix}_area_id` / `{prefix}_postal_code` /
 * `{prefix}_latitude` + `{prefix}_longitude` fields for one location.
 *
 * Unlike a typical "pick one field" mapper, this includes every field the
 * location actually has — per `BiteshipLocation`'s docs above, sending area
 * ID *and* coordinates together (Biteship's "mix" request type) is how a
 * single request gets JNE's usual area-based accuracy while also unlocking
 * GoSend/GrabExpress pricing, which needs coordinates specifically.
 */
function locationToRequestFields(
  location: BiteshipLocation,
  prefix: "origin" | "destination"
): Record<string, string | number> {
  const fields: Record<string, string | number> = {};

  if (location.areaId !== undefined) {
    fields[`${prefix}_area_id`] = location.areaId;
  }
  if (location.postalCode !== undefined) {
    fields[`${prefix}_postal_code`] = location.postalCode;
  }
  // Latitude and longitude only mean anything as a pair — Biteship has no
  // use for one without the other, so both must be present or neither is
  // sent (falling back to whatever of area ID / postal code is available).
  if (location.latitude !== undefined && location.longitude !== undefined) {
    fields[`${prefix}_latitude`] = location.latitude;
    fields[`${prefix}_longitude`] = location.longitude;
  }

  return fields;
}

// Shape of the pricing entries Biteship's rates endpoint returns. Only the
// fields this integration actually uses are declared.
type BiteshipPricingEntry = {
  courier_code: string;
  courier_name: string;
  courier_service_name: string;
  courier_service_code: string;
  duration: string;
  price: number;
  currency: string;
};

type BiteshipRatesResponse = {
  success: boolean;
  error?: string;
  pricing?: BiteshipPricingEntry[];
};

function isSupportedCourierCode(code: string): code is SupportedCourierCode {
  return code in SUPPORTED_COURIERS;
}

/**
 * Fetch live shipping rates from Biteship for JNE, GoSend, and GrabExpress,
 * given an origin, a destination, and the order's total weight.
 *
 * Any courier Biteship returns outside that allow-list is dropped — even if
 * `couriers` in the request already limits the query, results are filtered
 * again defensively.
 */
export async function getShippingRates({
  origin,
  destination,
  shippingWeightGrams,
  itemValue = 0,
}: GetShippingRatesParams): Promise<GetShippingRatesResult> {
  const apiKey = process.env.BITESHIP_API_KEY;
  if (!apiKey) {
    console.error("[biteship] BITESHIP_API_KEY is not configured.");
    return { success: false, error: "Shipping rates aren't configured yet." };
  }

  if (!Number.isFinite(shippingWeightGrams) || shippingWeightGrams <= 0) {
    return { success: false, error: "Order weight must be greater than zero to fetch shipping rates." };
  }

  const body = {
    ...locationToRequestFields(origin, "origin"),
    ...locationToRequestFields(destination, "destination"),
    couriers: Object.keys(SUPPORTED_COURIERS).join(","),
    items: [
      {
        name: "Order items",
        value: itemValue,
        quantity: 1,
        weight: shippingWeightGrams,
      },
    ],
  };

  // TEMPORARY DEBUG LOGGING — added to diagnose why only JNE was coming
  // back from the rates endpoint. Remove once the investigation is done.
  // Logs the exact outgoing body so it's possible to see, per request,
  // whether origin/destination coordinates are actually present (instant
  // couriers need both origin AND destination lat/lng to price at all —
  // area ID/postal code alone silently omits them from `pricing`, with no
  // per-courier error to explain why).
  console.log("[biteship][DEBUG] rates request body:", JSON.stringify(body, null, 2));

  try {
    const response = await fetch(`${BITESHIP_BASE_URL}/v1/rates/couriers`, {
      method: "POST",
      headers: {
        authorization: apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as BiteshipRatesResponse;

    // TEMPORARY DEBUG LOGGING — see note above. Logs the full raw response
    // (status + body) so it's possible to see exactly which couriers
    // Biteship actually returned in `pricing`, versus what was requested.
    console.log(
      "[biteship][DEBUG] rates response:",
      response.status,
      JSON.stringify(data, null, 2)
    );

    if (!response.ok || !data.success) {
      console.error("[biteship] rates request failed:", data.error ?? response.statusText);
      return { success: false, error: "Couldn't fetch shipping rates. Please try again." };
    }

    const rates: ShippingRateOption[] = (data.pricing ?? [])
      .filter((entry) => isSupportedCourierCode(entry.courier_code))
      .map((entry) => ({
        courier: SUPPORTED_COURIERS[entry.courier_code as SupportedCourierCode],
        courierCode: entry.courier_code as SupportedCourierCode,
        service: entry.courier_service_name,
        serviceCode: entry.courier_service_code,
        eta: entry.duration,
        cost: entry.price,
        currency: entry.currency,
      }));

    return { success: true, rates };
  } catch (error) {
    console.error("[biteship] failed to fetch shipping rates:", error);
    return { success: false, error: "Couldn't fetch shipping rates. Please try again." };
  }
}
