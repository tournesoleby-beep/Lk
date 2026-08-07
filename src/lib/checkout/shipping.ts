"use server";

import { prisma } from "@/lib/prisma";
import { getShippingRates } from "@/lib/shipping/biteship";
import { getStoreOrigin, geocode } from "@/lib/shipping/location";
import type { CheckoutCartLine } from "@/lib/checkout/actions";

export type CheckoutShippingRate = {
  courierCode: string;
  courier: string;
  service: string;
  eta: string;
  cost: number;
  currency: string;
};

export type GetCheckoutShippingRatesResult =
  | { success: true; rates: CheckoutShippingRate[] }
  | { success: false; error: string };

export type CheckoutDestination = {
  /**
   * Biteship Area ID for the customer's selected postal code — resolved
   * client-side by the checkout form's cascading dropdowns (see
   * app/checkout/page.tsx and app/api/shipping/postal-codes/route.ts,
   * both backed by src/lib/shipping/location.ts::searchAreas). This is
   * used as-is; it is never re-derived or re-looked-up here.
   */
  areaId: string;
  /**
   * Optional free-text address (street + district + city + province),
   * used ONLY to geocode a lat/lng point for pricing instant couriers
   * (GoSend, GrabExpress) — see src/lib/shipping/location.ts::geocode.
   * This never affects which area/postal code is priced (areaId above
   * already fixes that); a missing or failed geocode just means instant
   * couriers won't be priced for this request, same as before area IDs
   * were resolved client-side.
   */
  geocodeQuery?: string;
};

/**
 * Fetch live shipping rates for checkout, given the Biteship Area ID the
 * checkout form's cascading Province → City → District → Postal Code
 * dropdowns already resolved (see `CheckoutDestination` above), and the
 * cart lines (product id + quantity — same shape `placeOrder` takes in
 * src/lib/checkout/actions.ts).
 *
 * Unlike the previous free-text flow, this never calls
 * src/lib/shipping/location.ts::resolveDestinationAreaId — the area is
 * already fixed by `destination.areaId`. Shipping weight is derived from
 * each product's `weightGrams` (re-read from the database, same as
 * `placeOrder` does), never trusted from the client.
 *
 * The origin is always the store's own pickup location (see
 * getStoreOrigin) — never something a caller can override — and rates are
 * always JNE, GoSend, and GrabExpress only, since that allow-list lives in
 * getShippingRates itself (src/lib/shipping/biteship.ts).
 */
export async function getCheckoutShippingRates(
  destination: CheckoutDestination,
  lines: CheckoutCartLine[]
): Promise<GetCheckoutShippingRatesResult> {
  const areaId = destination?.areaId?.trim();
  if (!areaId) {
    return { success: false, error: "Select a postal code to calculate shipping." };
  }
  if (!Array.isArray(lines) || lines.length === 0) {
    return { success: false, error: "Your bag is empty." };
  }

  const origin = getStoreOrigin();
  if (!origin.success) {
    return { success: false, error: origin.error };
  }

  // Best-effort only — a failed or skipped geocode still prices JNE
  // correctly via areaId alone, same fallback guarantee documented on
  // `geocode` in src/lib/shipping/location.ts.
  const point = destination.geocodeQuery ? await geocode(destination.geocodeQuery) : null;

  const products = await prisma.product.findMany({
    where: { id: { in: lines.map((line) => line.id) } },
    select: { id: true, weightGrams: true },
  });
  const weightById = new Map(products.map((product) => [product.id, product.weightGrams]));

  let shippingWeightGrams = 0;
  for (const line of lines) {
    const weightGrams = weightById.get(line.id);
    if (weightGrams === undefined) {
      return { success: false, error: "One of the items in your bag is no longer available." };
    }
    const quantity = Math.max(1, Math.floor(line.quantity) || 1);
    shippingWeightGrams += weightGrams * quantity;
  }

  if (shippingWeightGrams <= 0) {
    return { success: false, error: "Order weight must be greater than zero to calculate shipping." };
  }

  const result = await getShippingRates({
    origin: origin.origin,
    // point is only set when geocodeQuery was provided and resolved — see
    // the geocode() call above. Passing latitude/longitude through (rather
    // than just areaId) is what lets Biteship price instant couriers
    // (GoSend, GrabExpress) for this destination; areaId alone still
    // prices JNE correctly either way.
    destination: {
      areaId,
      latitude: point?.latitude,
      longitude: point?.longitude,
    },
    shippingWeightGrams,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    rates: result.rates.map((rate) => ({
      courierCode: rate.courierCode,
      courier: rate.courier,
      service: rate.service,
      eta: rate.eta,
      cost: rate.cost,
      currency: rate.currency,
    })),
  };
}
