"use server";

import { prisma } from "@/lib/prisma";
import { getShippingRates } from "@/lib/shipping/biteship";
import { getStoreOrigin, resolveDestinationAreaId } from "@/lib/shipping/location";
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

/**
 * Fetch live shipping rates for checkout, given whatever free-text
 * destination the checkout form collects (city/district/postal code) and
 * the cart lines (product id + quantity — same shape `placeOrder` takes in
 * src/lib/checkout/actions.ts).
 *
 * Resolves that destination to a Biteship area ID via
 * src/lib/shipping/location.ts::resolveDestinationAreaId before requesting
 * rates — callers (e.g. the checkout page) never resolve or pass an area ID
 * themselves. Shipping weight is derived from each product's
 * `weightGrams` (re-read from the database, same as `placeOrder` does),
 * never trusted from the client.
 *
 * The origin is always the store's own pickup location (see
 * getStoreOrigin) — never something a caller can override — and rates are
 * always JNE, GoSend, and GrabExpress only, since that allow-list lives in
 * getShippingRates itself (src/lib/shipping/biteship.ts).
 */
export async function getCheckoutShippingRates(
  destination: string,
  lines: CheckoutCartLine[]
): Promise<GetCheckoutShippingRatesResult> {
  const destinationInput = destination?.trim();
  if (!destinationInput) {
    return { success: false, error: "Destination is required to calculate shipping." };
  }
  if (!Array.isArray(lines) || lines.length === 0) {
    return { success: false, error: "Your bag is empty." };
  }

  const origin = getStoreOrigin();
  if (!origin.success) {
    return { success: false, error: origin.error };
  }

  const area = await resolveDestinationAreaId(destinationInput);
  if (!area.success) {
    return { success: false, error: area.error };
  }

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
    // `area.area` already carries latitude/longitude alongside areaId when
    // geocoding succeeded (see resolveDestinationAreaId in
    // src/lib/shipping/location.ts) — passing the whole thing through
    // (rather than just areaId) is what actually lets Biteship price
    // instant couriers (GoSend, GrabExpress) for this destination; area ID
    // alone still prices JNE correctly either way.
    destination: {
      areaId: area.area.areaId,
      latitude: area.area.latitude,
      longitude: area.area.longitude,
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
