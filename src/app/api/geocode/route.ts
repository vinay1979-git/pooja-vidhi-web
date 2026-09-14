import { NextRequest, NextResponse } from 'next/server';

/**
 * Geocoding proxy.
 *
 * The viewer previously called nominatim.openstreetmap.org straight from the
 * browser with `limit=1`. Two problems with that.
 *
 * 1. Policy. The OSM Foundation requires an identifying User-Agent, caps you at
 *    one request per second, and requires results to be cached. A browser fetch
 *    provides none of that and will eventually get the app blocked.
 * 2. Correctness. `limit=1` silently picks the first match, so "Springfield"
 *    or "Tirupati" resolves to whichever one OSM happens to rank first. For a
 *    Sankalpam the coordinates are the whole point, so the user has to choose.
 *
 * This route returns up to five candidates with structured city, state and
 * country, and lets the caller disambiguate.
 */

export const runtime = 'nodejs';

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const USER_AGENT =
  'PoojaVidhi/0.1 (+https://github.com/vinay1979-git/pooja-vidhi-web)';

export interface GeoPlace {
  /** "Chennai, Tamil Nadu, India" */
  label: string;
  city: string | null;
  state: string | null;
  country: string | null;
  countryCode: string | null;
  lat: number;
  lon: number;
  osmId: string;
}

// --- cache -------------------------------------------------------------------
// Place lookups are effectively immutable, so cache hard. Keeps us well inside
// the usage policy and makes repeat lookups instant.
const TTL_MS = 30 * 24 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; value: GeoPlace[] }>();

function cached(key: string): GeoPlace[] | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

// --- one request per second, serialised --------------------------------------
let lastCall = 0;
let chain: Promise<unknown> = Promise.resolve();

function throttled<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(async () => {
    const wait = Math.max(0, 1000 - (Date.now() - lastCall));
    if (wait) await new Promise((r) => setTimeout(r, wait));
    lastCall = Date.now();
    return fn();
  });
  chain = run.catch(() => {});
  return run as Promise<T>;
}

// --- shaping -----------------------------------------------------------------
interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  suburb?: string;
  county?: string;
  state?: string;
  state_district?: string;
  region?: string;
  country?: string;
  country_code?: string;
}

interface NominatimResult {
  place_id?: number | string;
  osm_id?: number | string;
  lat: string;
  lon: string;
  display_name?: string;
  address?: NominatimAddress;
}

function toPlace(r: NominatimResult): GeoPlace {
  const a = r.address ?? {};
  // Nominatim uses a different key depending on settlement size, so fall
  // through them in order of preference.
  const city =
    a.city ?? a.town ?? a.village ?? a.municipality ?? a.suburb ?? a.county ?? null;
  const state = a.state ?? a.state_district ?? a.region ?? null;
  const country = a.country ?? null;

  // "Chennai, Tamil Nadu, India" rather than the 8-part display_name, but fall
  // back to display_name when the structured fields are too thin to identify
  // the place.
  const parts = [city, state, country].filter(Boolean) as string[];
  const label = parts.length >= 2 ? parts.join(', ') : (r.display_name ?? parts.join(', '));

  return {
    label,
    city,
    state,
    country,
    countryCode: a.country_code ? a.country_code.toUpperCase() : null,
    lat: parseFloat(r.lat),
    lon: parseFloat(r.lon),
    osmId: String(r.osm_id ?? r.place_id ?? `${r.lat},${r.lon}`),
  };
}

async function nominatim(path: string): Promise<NominatimResult[]> {
  const res = await throttled(() =>
    fetch(`${NOMINATIM}${path}`, {
      headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en' },
    }),
  );
  if (!res.ok) throw new Error(`Nominatim responded ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [data];
}

// -----------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get('q')?.trim();
  const lat = sp.get('lat');
  const lon = sp.get('lon');

  try {
    if (lat && lon) {
      const key = `r:${Number(lat).toFixed(4)},${Number(lon).toFixed(4)}`;
      const hit = cached(key);
      if (hit) return NextResponse.json({ places: hit, cached: true });

      const raw = await nominatim(
        `/reverse?format=jsonv2&addressdetails=1&zoom=10&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
      );
      // Reverse lookup is unambiguous, but keep the caller's precise
      // coordinates: they are what the Sankalpam is computed from, and the
      // settlement centroid can be tens of kilometres away.
      const places = raw.map(toPlace).map((p) => ({
        ...p,
        lat: parseFloat(lat),
        lon: parseFloat(lon),
      }));
      cache.set(key, { at: Date.now(), value: places });
      return NextResponse.json({ places });
    }

    if (q) {
      if (q.length < 2) {
        return NextResponse.json({ places: [] });
      }
      const key = `s:${q.toLowerCase()}`;
      const hit = cached(key);
      if (hit) return NextResponse.json({ places: hit, cached: true });

      // limit=5, not 1. Multiple places share a name and the user must choose.
      const raw = await nominatim(
        `/search?format=jsonv2&addressdetails=1&limit=5&q=${encodeURIComponent(q)}`,
      );

      // Distinct by label: OSM often returns the same settlement several times
      // at different administrative levels.
      const seen = new Set<string>();
      const places = raw
        .map(toPlace)
        .filter((p) => {
          if (seen.has(p.label)) return false;
          seen.add(p.label);
          return true;
        });

      cache.set(key, { at: Date.now(), value: places });
      return NextResponse.json({ places });
    }

    return NextResponse.json(
      { error: 'Pass either q, or lat and lon.' },
      { status: 400 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Lookup failed', places: [] },
      { status: 502 },
    );
  }
}
