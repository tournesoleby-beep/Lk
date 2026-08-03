/**
 * Biteship location support — store origin + destination area lookup.
 *
 * This is the step that has to happen *before* a rates request
 * (see `getShippingRates` in ./biteship.ts, which this module doesn't call):
 *
 * - The store's own pickup location ("origin") is fixed and lives in env
 *   vars — see `.env.example` — rather than being looked up per-request.
 * - A customer's destination is free text (a city/district they typed, or a
 *   postal code) and has to be resolved to a Biteship area ID via Biteship's
 *   Maps API (https://biteship.com/en/docs/api/maps/search_area) — area ID
 *   is the most accurate location type `getShippingRates` accepts.
 *
 * No rates are fetched here — this only produces the `BiteshipLocation`
 * values a later rates request would use as `origin`/`destination`.
 *
 * Uses `BITESHIP_API_KEY`, a server-only secret — only import this from
 * server code (Server Actions, Route Handlers, RSCs), never from a
 * `"use client"` component.
 */

import { BITESHIP_BASE_URL, type BiteshipLocation } from "./biteship";

export type GetStoreOriginResult =
  | { success: true; origin: BiteshipLocation }
  | { success: false; error: string };

type GeocodedPoint = { latitude: number; longitude: number };

/**
 * Best-effort geocoding of free-text input (a city, district, or address)
 * to a lat/lng point, via OpenStreetMap's free Nominatim API.
 *
 * Biteship's own Maps API (`/v1/maps/areas`, used by
 * `resolveDestinationAreaId` below) only ever returns area IDs — never
 * coordinates — so it can't supply what instant couriers (GoSend,
 * GrabExpress) need on its own; Biteship's own rates docs point integrators
 * at an external map/geocoding service for exactly this reason. This is
 * that step. No API key is required, which is why it's used here rather
 * than a paid provider — for higher volume or stricter reliability, this
 * function can be swapped for something like Google Maps' Geocoding API
 * without any caller needing to change (every caller only ever sees a
 * `{ latitude, longitude }` point or `null`).
 *
 * Never throws: a failure here (network error, no match, rate limiting)
 * always resolves to `null` rather than rejecting, so callers can treat
 * "couldn't geocode" as "fall back to area ID only" — see
 * `resolveDestinationAreaId` and `BiteshipLocation`'s docs in ./biteship.ts
 * for why that fallback is safe (area ID alone still prices JNE and other
 * hub-network couriers correctly; it just can't price instant couriers).
 */
async function geocodeQuery(query: string): Promise<GeocodedPoint | null> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "json");
    url.searchParams.set("q", query);
    url.searchParams.set("countrycodes", "id");
    url.searchParams.set("limit", "1");

    const response = await fetch(url, {
      headers: {
        // Nominatim's usage policy requires a descriptive User-Agent
        // identifying the calling application — see
        // https://operations.osmfoundation.org/policies/nominatim/.
        "user-agent": "lapiita-karya-storefront (shipping rate lookup)",
      },
    });

    if (!response.ok) return null;

    const results = (await response.json()) as { lat: string; lon: string }[];
    const [top] = results;
    if (!top) return null;

    const latitude = Number(top.lat);
    const longitude = Number(top.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

    return { latitude, longitude };
  } catch (error) {
    console.error("[biteship] geocoding failed:", error);
    return null;
  }
}

/**
 * Best-effort geocoding with one fallback: Nominatim matches free-form
 * queries against the whole string, so a leading segment that isn't an
 * indexed OpenStreetMap place — a specific institution/building name, for
 * instance — can make the *entire* query return zero results, even though
 * the rest of the address (the city/district/postal code portion Biteship's
 * own area search matches against just fine) is perfectly geocodable on its
 * own. Same pattern reported against Nominatim directly:
 * https://help.openstreetmap.org/questions/73102
 *
 * If the full query comes back empty, retry once with the first
 * comma-separated segment dropped. This is what let `resolveStoreAreaId`'s
 * geocode lookup fail silently for an address like "Lapas Perempuan Kelas
 * IIA Jakarta, Pondok Bambu, Duren Sawit, Jakarta Timur, 13430" — the area
 * lookup still resolved "Duren Sawit, Jakarta Timur" fine, but the facility
 * name up front zeroed out the geocode, leaving `origin.latitude/longitude`
 * unset and silently dropping GoSend/GrabExpress from every rates response
 * (they need coordinates for *both* origin and destination — see
 * `BiteshipLocation`'s docs in ./biteship.ts).
 */
async function geocode(query: string): Promise<GeocodedPoint | null> {
  const point = await geocodeQuery(query);
  if (point) return point;

  const segments = query
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (segments.length > 1) {
    return geocodeQuery(segments.slice(1).join(", "));
  }

  return null;
}

/**
 * The store's pickup location, read from `BITESHIP_ORIGIN_AREA_ID` (see
 * .env.example). That env var should be set once, by resolving the store's
 * own address with `resolveDestinationAreaId` and pasting the resulting
 * area ID in — the store doesn't move between requests, so there's no need
 * to re-resolve it every time an origin is needed.
 *
 * `BITESHIP_ORIGIN_LATITUDE` / `BITESHIP_ORIGIN_LONGITUDE` are optional,
 * set the same one-time way (e.g. from `resolveStoreAreaId`'s geocoded
 * result). Biteship needs coordinates — not just an area ID — to price
 * instant couriers (GoSend, GrabExpress) for the origin leg; see
 * `BiteshipLocation`'s docs in ./biteship.ts. If either is unset or
 * unparsable, the origin falls back to area ID only, exactly as before
 * these env vars existed — JNE and other hub-network couriers are priced
 * fine either way.
 */
export function getStoreOrigin(): GetStoreOriginResult {
  const areaId = process.env.BITESHIP_ORIGIN_AREA_ID?.trim();
  if (!areaId) {
    console.error("[biteship] BITESHIP_ORIGIN_AREA_ID is not configured.");
    return { success: false, error: "Store shipping origin isn't configured yet." };
  }

  const origin: BiteshipLocation = { areaId };

  const originLatitude = process.env.BITESHIP_ORIGIN_LATITUDE?.trim();
  const originLongitude = process.env.BITESHIP_ORIGIN_LONGITUDE?.trim();
  const latitude = originLatitude ? Number(originLatitude) : NaN;
  const longitude = originLongitude ? Number(originLongitude) : NaN;
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    origin.latitude = latitude;
    origin.longitude = longitude;
  }

  return { success: true, origin };
}

export type ResolvedArea = {
  areaId: string;
  /** Full display name Biteship returns, e.g. "Pesanggrahan, Jakarta Selatan, DKI Jakarta. 12250". */
  name: string;
  postalCode: number;
  /**
   * Precise coordinates for this same input, resolved separately from the
   * area lookup above (see `geocode`) — only present when geocoding
   * succeeded. Biteship needs these to price instant couriers (GoSend,
   * GrabExpress); the area ID alone still prices JNE and other
   * hub-network couriers, which is why this is optional rather than
   * required — a caller that only reads `areaId` is unaffected either way.
   */
  latitude?: number;
  longitude?: number;
};

export type ResolveAreaResult =
  | { success: true; area: ResolvedArea }
  | { success: false; error: string };

// Shape of the entries Biteship's area-search endpoint returns. Only the
// fields this integration actually uses are declared.
type BiteshipArea = {
  id: string;
  name: string;
  postal_code: number;
};

type BiteshipAreasResponse = {
  success: boolean;
  error?: string;
  areas?: BiteshipArea[];
};

/**
 * Resolve free-text destination input (a city, district, or postal code a
 * customer typed) to a Biteship area ID, via Biteship's Maps API — and, in
 * parallel, best-effort geocode the same input to a lat/lng point (see
 * `geocode` above), since Biteship's Maps API alone never returns
 * coordinates but instant couriers (GoSend, GrabExpress) need them to
 * price at all.
 *
 * Returns Biteship's top area match — its area search is itself a ranked
 * autocomplete (see the endpoint docs), so no extra ranking is done here.
 * The geocode lookup runs concurrently rather than after, since it's an
 * independent, best-effort lookup against the same input — a slow or
 * failed geocode should never delay or block the area lookup that every
 * courier (including JNE) depends on. If geocoding fails, the returned
 * area simply omits `latitude`/`longitude` — exactly what this function
 * returned before those fields existed, so existing callers are unaffected.
 *
 * Also usable to resolve the store's own address once, to populate
 * `BITESHIP_ORIGIN_AREA_ID` (and optionally `BITESHIP_ORIGIN_LATITUDE` /
 * `BITESHIP_ORIGIN_LONGITUDE`) — see `getStoreOrigin` above.
 */
export async function resolveDestinationAreaId(input: string): Promise<ResolveAreaResult> {
  const apiKey = process.env.BITESHIP_API_KEY;
  if (!apiKey) {
    console.error("[biteship] BITESHIP_API_KEY is not configured.");
    return { success: false, error: "Shipping isn't configured yet." };
  }

  const query = input.trim();
  if (!query) {
    return { success: false, error: "Enter a city, district, or postal code." };
  }

  try {
    const url = new URL("/v1/maps/areas", BITESHIP_BASE_URL);
    url.searchParams.set("countries", "ID");
    url.searchParams.set("input", query);
    url.searchParams.set("type", "single");

    const [response, point] = await Promise.all([
      fetch(url, { headers: { authorization: apiKey } }),
      geocode(query),
    ]);

    const data = (await response.json()) as BiteshipAreasResponse;

    if (!response.ok || !data.success) {
      console.error("[biteship] area search failed:", data.error ?? response.statusText);
      return { success: false, error: "Couldn't look up that location. Please try again." };
    }

    const match = (data.areas ?? []).find((area) => area.id && area.name);
    if (!match) {
      return { success: false, error: "No matching location found. Try a different city or district." };
    }

    return {
      success: true,
      area: {
        areaId: match.id,
        name: match.name,
        postalCode: match.postal_code,
        ...(point ? { latitude: point.latitude, longitude: point.longitude } : {}),
      },
    };
  } catch (error) {
    console.error("[biteship] failed to resolve destination area:", error);
    return { success: false, error: "Couldn't look up that location. Please try again." };
  }
}

/**
 * The store's own address, as free text. Used only by `resolveStoreAreaId`
 * below, to resolve `BITESHIP_ORIGIN_AREA_ID` once — not used anywhere
 * else. The store's origin at request time is always read from
 * `BITESHIP_ORIGIN_AREA_ID` (see `getStoreOrigin`), never re-resolved here.
 */
const STORE_ADDRESS = [
  "Lapas Perempuan Kelas IIA Jakarta",
  "Pondok Bambu",
  "Duren Sawit",
  "Jakarta Timur",
  "13430",
].join(", ");

/**
 * One-off helper to resolve the store's own address (see `STORE_ADDRESS`
 * above) to a Biteship area ID, via `resolveDestinationAreaId`. Run this
 * once and paste the resulting area ID into `BITESHIP_ORIGIN_AREA_ID` (see
 * .env.example) — the store doesn't move between requests, so
 * `getStoreOrigin` reads that env var directly rather than calling this on
 * every request.
 */
export async function resolveStoreAreaId(): Promise<ResolveAreaResult> {
  return resolveDestinationAreaId(STORE_ADDRESS);
}
