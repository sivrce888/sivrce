/**
 * Address → coords for Georgia listings.
 * ponytail: Nominatim (OSM) server-side only; 1 rps ToS. Upgrade → self-hosted Photon.
 */

import { MAP_CITIES, type MapCity } from '@/lib/map/user-place'
import { GEORGIA_MAX_BOUNDS, MAP_CENTER } from '@/lib/map/buildings'

export type GeocodeHit = {
  lat: number
  lng: number
  label: string
  city?: string
  district?: string
}

const [[W, S], [E, N]] = GEORGIA_MAX_BOUNDS

export function inGeorgia(lat: number, lng: number): boolean {
  return lat >= S && lat <= N && lng >= W && lng <= E
}

export function cityCenter(city: string): { lat: number; lng: number } {
  const needle = city.trim().toLowerCase()
  const hit =
    MAP_CITIES.find((c) => c.ka.toLowerCase() === needle || c.slug === needle) ??
    null
  return hit ? { lat: hit.lat, lng: hit.lng } : MAP_CENTER
}

export function nearestCity(lat: number, lng: number): MapCity | null {
  let best: MapCity | null = null
  let bestD = Infinity
  for (const c of MAP_CITIES) {
    const d = (c.lat - lat) ** 2 + (c.lng - lng) ** 2
    if (d < bestD) {
      bestD = d
      best = c
    }
  }
  return best
}

/** Parse body lat/lng; reject out-of-Georgia. */
export function parseCoords(
  lat: unknown,
  lng: unknown,
): { lat: number; lng: number } | null {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (!inGeorgia(lat, lng)) return null
  return { lat, lng }
}

/**
 * Geocode a free-text address in Georgia via Nominatim.
 * Returns null on miss / network / ToS soft-fail.
 */
export async function geocodeAddress(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodeHit | null> {
  const q = query.trim()
  if (q.length < 3 || q.length > 240) return null

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', q)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')
  url.searchParams.set('countrycodes', 'ge')
  url.searchParams.set('viewbox', `${W},${N},${E},${S}`)
  url.searchParams.set('bounded', '1')
  url.searchParams.set('addressdetails', '1')

  const res = await fetch(url, {
    signal,
    headers: {
      Accept: 'application/json',
      // Nominatim ToS — identify the product
      'User-Agent': 'Sivrce/1.0 (https://sivrce.ge; maps@sivrce.ge)',
    },
    next: { revalidate: 86_400 },
  }).catch(() => null)
  if (!res?.ok) return null

  const rows = (await res.json()) as Array<{
    lat: string
    lon: string
    display_name?: string
    address?: { city?: string; town?: string; suburb?: string; neighbourhood?: string }
  }>
  const row = rows[0]
  if (!row) return null
  const lat = Number(row.lat)
  const lng = Number(row.lon)
  if (!inGeorgia(lat, lng)) return null
  return {
    lat,
    lng,
    label: row.display_name ?? q,
    city: row.address?.city ?? row.address?.town,
    district: row.address?.suburb ?? row.address?.neighbourhood,
  }
}
