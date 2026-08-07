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
export async function geocode(query: string): Promise<GeocodedPoint | null> {
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
 * unparsable, the origin falls back to area ID only — JNE and other
 * hub-network couriers are priced fine either way.
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
  postal_code?: number;
  // Biteship's own district-level field for this area — same object shape
  // Biteship uses for origin/destination in rates responses (level_1 =
  // province, level_2 = city, level_3 = district). Used to exactly filter
  // out unrelated districts that Biteship's fuzzy `input` text search can
  // still surface (e.g. matching loosely on a shared province name) —
  // see `searchAreas` below.
  administrative_division_level_3_name?: string;
};

type BiteshipAreasResponse = {
  success: boolean;
  error?: string;
  areas?: BiteshipArea[];
};

/**
 * Resolve a single area's postal code, tolerating Biteship area entries
 * that omit `postal_code` (confirmed on real district-level "(all)"
 * matches — the code is still present as text inside `name` in that
 * case). Returns `null` when no postal code can be determined at all.
 * Shared by `searchAreas` and `resolveDestinationAreaId` so both apply
 * the same fallback.
 */
function resolvePostalCode(area: BiteshipArea): number | null {
  if (typeof area.postal_code === "number" && Number.isFinite(area.postal_code)) {
    return area.postal_code;
  }
  const match = Number(area.name.match(/\b\d{5}\b/)?.[0]);
  return Number.isFinite(match) ? match : null;
}

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
 * area simply omits `latitude`/`longitude`, which existing callers that
 * only read `areaId` are unaffected by.
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

    const postalCode = resolvePostalCode(match);
    if (postalCode === null) {
      console.warn("[biteship] resolveDestinationAreaId: no resolvable postal code:", match);
      return { success: false, error: "Couldn't determine a postal code for that location." };
    }

    return {
      success: true,
      area: {
        areaId: match.id,
        name: match.name,
        postalCode,
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

export type SearchAreasResult =
  | { success: true; areas: ResolvedArea[] }
  | { success: false; error: string };

/**
 * Like `resolveDestinationAreaId`, but returns every Biteship area match
 * instead of just the top one — used to populate the checkout postal-code
 * dropdown, since one district can resolve to several Biteship areas that
 * differ only by postal code. Does not geocode each result (that's only
 * needed for the final origin/destination pair at rates time, not for
 * listing options), so this is cheaper than calling
 * `resolveDestinationAreaId` once per option.
 */
export async function searchAreas(input: string, exactDistrict?: string): Promise<SearchAreasResult> {
  const apiKey = process.env.BITESHIP_API_KEY;
  if (!apiKey) {
    console.error("[biteship] BITESHIP_API_KEY is not configured.");
    return { success: false, error: "Shipping isn't configured yet." };
  }

  const query = input.trim();
  if (!query) {
    return { success: false, error: "Enter a district, city, or postal code." };
  }
  // Biteship's own search ranks by loose text relevance, not by
  // administrative hierarchy — a query combining district + city +
  // province can still return areas from a completely different district
  // that happen to share text with the query (e.g. the province name).
  // `input` is only used to get Biteship a reasonable candidate set;
  // `normalizedDistrict` below is what actually restricts results to the
  // exact selected district, via Biteship's own structured district field
  // rather than any text-matching heuristic.
  const normalizedDistrict = exactDistrict?.trim().toLowerCase();

  try {
    const url = new URL("/v1/maps/areas", BITESHIP_BASE_URL);
    url.searchParams.set("countries", "ID");
    url.searchParams.set("input", query);
    url.searchParams.set("type", "multiple");

    const response = await fetch(url, { headers: { authorization: apiKey } });
    const data = (await response.json()) as BiteshipAreasResponse;

    if (!response.ok || !data.success) {
      console.error("[biteship] area search failed:", data.error ?? response.statusText);
      return { success: false, error: "Couldn't look up postal codes for that district." };
    }

    const seenAreaIds = new Set<string>();
    const seenPostalCodes = new Set<number>();
    const areas: ResolvedArea[] = [];
    for (const area of data.areas ?? []) {
      if (!area.id || !area.name) continue;

      if (normalizedDistrict) {
        const areaDistrict = area.administrative_division_level_3_name?.trim().toLowerCase();
        if (areaDistrict !== normalizedDistrict) {
          console.warn(
            "[biteship] area search: dropping result outside selected district:",
            { expected: exactDistrict, got: area.administrative_division_level_3_name, area }
          );
          continue;
        }
      }

      const postalCode = resolvePostalCode(area);
      if (postalCode === null) {
        console.warn("[biteship] area search: no resolvable postal code, skipping entry:", area);
        continue;
      }
      // Two entries can carry different postal-code text in `name` while
      // sharing the same underlying area id — since areaId (not the
      // postal code label) is what's actually sent to Biteship for rate
      // calculation, such entries are functionally identical. Keep only
      // the first: this both avoids a duplicate React key on the postal
      // code dropdown and avoids presenting the customer two options that
      // would price identically.
      if (seenAreaIds.has(area.id) || seenPostalCodes.has(postalCode)) continue;

      seenAreaIds.add(area.id);
      seenPostalCodes.add(postalCode);
      areas.push({ areaId: area.id, name: area.name, postalCode });
    }

    if (areas.length === 0) {
      return { success: false, error: "No postal codes found for that district." };
    }

    return { success: true, areas };
  } catch (error) {
    console.error("[biteship] failed to search areas:", error);
    return { success: false, error: "Couldn't look up postal codes for that district." };
  }
}
