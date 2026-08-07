import { NextRequest, NextResponse } from "next/server";

import { searchAreas } from "@/lib/shipping/location";

/**
 * GET /api/shipping/postal-codes?q=<district, city, province>&district=<district>
 *
 * Thin server wrapper around `searchAreas` (see lib/shipping/location.ts) —
 * exists only because `BITESHIP_API_KEY` is server-only and can't be
 * called directly from the checkout page's client component. Powers the
 * Postal Code dropdown: one district can resolve to several Biteship
 * areas that differ only by postal code, so this returns all of them
 * (deduplicated by postal code and area id), each carrying the Biteship
 * Area ID the checkout form needs for accurate shipping calculation.
 *
 * `district` is the exact district name the customer selected (from the
 * cascading dropdowns) — it's passed separately from `q` because Biteship's
 * own search is a fuzzy text match, not an administrative-hierarchy
 * lookup, so `q` alone isn't enough to keep results scoped to that one
 * district (see `searchAreas`'s `exactDistrict` filtering).
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  const district = request.nextUrl.searchParams.get("district")?.trim();
  if (!q) {
    return NextResponse.json({ success: false, error: "Missing query" }, { status: 400 });
  }

  const result = await searchAreas(q, district);
  return NextResponse.json(result, { status: result.success ? 200 : 502 });
}
