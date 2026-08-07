/**
 * Client-side fetchers for Indonesian administrative regions (province →
 * city/regency → district), used to drive the checkout address cascading
 * dropdowns. Backed by emsifa's `api-wilayah-indonesia` — a free,
 * CORS-enabled, static JSON dataset (no API key), fetched directly from
 * the browser. Postal codes are intentionally NOT sourced here: this
 * dataset doesn't carry them reliably, and one district can map to
 * several postal codes. That step goes through Biteship's own area
 * search instead — see `/api/shipping/postal-codes` (backed by
 * `searchAreas` in lib/shipping/location.ts) — so the postal code the
 * user picks always matches a real Biteship Area ID.
 */

const BASE = "https://www.emsifa.com/api-wilayah-indonesia/api";

export type WilayahOption = {
  id: string;
  name: string;
};

async function fetchJson(url: string): Promise<WilayahOption[]> {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    return (await res.json()) as WilayahOption[];
  } catch (error) {
    console.error("[wilayah] fetch failed:", error);
    return [];
  }
}

export const getProvinces = (): Promise<WilayahOption[]> => fetchJson(`${BASE}/provinces.json`);

export const getRegencies = (provinceId: string): Promise<WilayahOption[]> =>
  fetchJson(`${BASE}/regencies/${provinceId}.json`);

export const getDistricts = (regencyId: string): Promise<WilayahOption[]> =>
  fetchJson(`${BASE}/districts/${regencyId}.json`);
