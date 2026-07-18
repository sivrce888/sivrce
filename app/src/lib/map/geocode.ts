/**
 * Address → coords for Georgia listings.
 * ponytail: Nominatim (OSM) server-side only; 1 rps ToS. Upgrade → self-hosted Photon.
 */

import { MAP_CITIES, type MapCity } from '@/lib/map/user-place'
import { GEORGIA_MAX_BOUNDS, MAP_CENTER } from '@/lib/map/buildings'
import { canonicalizeDistrict } from '@/lib/district-canon'

export type GeocodeHit = {
  lat: number
  lng: number
  label: string
  city?: string
  district?: string
  street?: string
  houseNo?: string
}

const [[W, S], [E, N]] = GEORGIA_MAX_BOUNDS

const NOMINATIM_UA = 'Sivrce/1.0 (https://sivrce.ge; maps@sivrce.ge)'

type NominatimRow = {
  lat: string
  lon: string
  display_name?: string
  class?: string
  type?: string
  addresstype?: string
  importance?: number
  address?: {
    city?: string
    town?: string
    village?: string
    municipality?: string
    suburb?: string
    neighbourhood?: string
    quarter?: string
    city_district?: string
    road?: string
    pedestrian?: string
    house_number?: string
  }
}

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

/** Nominatim city (ka/en/slug) → Sivrce ka city label. */
export function matchCityKa(name?: string | null): string | undefined {
  if (!name) return undefined
  const n = name.trim().toLowerCase()
  const hit = MAP_CITIES.find(
    (c) => c.ka.toLowerCase() === n || c.slug === n || n.includes(c.slug),
  )
  return hit?.ka
}

/** Prefer neighbourhood over "X რაიონი" suburb; canonicalize EN/combined. */
export function normalizeDistrict(a?: NominatimRow['address']): string | undefined {
  const raw =
    a?.neighbourhood?.trim() ||
    a?.quarter?.split(',')[0]?.trim() ||
    a?.suburb?.trim() ||
    a?.city_district?.trim()
  if (!raw) return undefined
  const stripped = raw.replace(/\s*რაიონი\s*$/u, '').trim() || raw
  return canonicalizeDistrict(stripped) || stripped
}

/** "ჭავჭავაძის გამზ. 47" → street + houseNo (keeps casing). */
export function splitStreetHouse(raw: string): { street: string; houseNo: string } {
  const head = (raw.split(',')[0] ?? raw).trim()
  const m = head.match(/^(.*?)\s+(\d+[a-zA-Zა-ჰ]?)\s*$/u)
  if (!m?.[1] || !m[2]) return { street: head, houseNo: '' }
  return { street: m[1].trim(), houseNo: m[2] }
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

function hitFromRow(row: NominatimRow, fallbackLabel: string): GeocodeHit | null {
  const lat = Number(row.lat)
  const lng = Number(row.lon)
  if (!inGeorgia(lat, lng)) return null
  const a = row.address
  return {
    lat,
    lng,
    label: row.display_name ?? fallbackLabel,
    city: matchCityKa(a?.city ?? a?.town ?? a?.village ?? a?.municipality),
    district: normalizeDistrict(a),
    street: a?.road ?? a?.pedestrian,
    houseNo: a?.house_number,
  }
}

/** Prefer house/building pins over cafes / street centroids. */
export function scoreNominatimRow(row: NominatimRow): number {
  let s = Number(row.importance) || 0
  if (row.class === 'building' || row.addresstype === 'building') s += 12
  if (row.type === 'house' || row.type === 'apartments' || row.type === 'building') s += 8
  if (row.address?.house_number) s += 6
  if (row.class === 'place' && row.type === 'house') s += 5
  if (row.class === 'amenity') s -= 6
  if (row.class === 'highway') s -= 8
  if (row.class === 'shop') s -= 4
  return s
}

function pickBestRow(rows: NominatimRow[]): NominatimRow | null {
  if (!rows.length) return null
  return [...rows].sort((a, b) => scoreNominatimRow(b) - scoreNominatimRow(a))[0] ?? null
}

function rankRows(rows: NominatimRow[]): NominatimRow[] {
  return [...rows].sort((a, b) => scoreNominatimRow(b) - scoreNominatimRow(a))
}

async function nominatimSearch(
  params: Record<string, string>,
  signal?: AbortSignal,
): Promise<NominatimRow[]> {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  url.searchParams.set('format', 'json')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('countrycodes', 'ge')
  url.searchParams.set('viewbox', `${W},${N},${E},${S}`)
  url.searchParams.set('bounded', '1')

  const res = await fetch(url, {
    signal,
    headers: { Accept: 'application/json', 'User-Agent': NOMINATIM_UA },
    next: { revalidate: 86_400 },
  }).catch(() => null)
  if (!res?.ok) return []
  return (await res.json()) as NominatimRow[]
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

  const rows = await nominatimSearch({ q, limit: '8' }, signal)
  const row = pickBestRow(rows)
  return row ? hitFromRow(row, q) : null
}

/** Autocomplete — up to 5 ranked Georgia hits. */
export async function suggestAddresses(
  query: string,
  city?: string,
  signal?: AbortSignal,
): Promise<GeocodeHit[]> {
  const q = query.trim()
  if (q.length < 2 || q.length > 120) return []

  const { street, houseNo } = splitStreetHouse(q)
  const needle = [street && `${street}${houseNo ? ` ${houseNo}` : ''}`, city, 'Georgia']
    .filter(Boolean)
    .join(', ')

  const rows = await nominatimSearch({ q: needle, limit: '8' }, signal)
  const seen = new Set<string>()
  const out: GeocodeHit[] = []
  for (const row of rankRows(rows)) {
    const hit = hitFromRow(row, q)
    if (!hit) continue
    const key = `${hit.lat.toFixed(5)}:${hit.lng.toFixed(5)}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(hit)
    if (out.length >= 5) break
  }
  return out
}

/** Structured listing address — house № first when present. */
export async function geocodeListingAddress(
  parts: { street?: string; houseNo?: string; district?: string; city?: string },
  signal?: AbortSignal,
): Promise<GeocodeHit | null> {
  let street = parts.street?.trim() ?? ''
  let houseNo = parts.houseNo?.trim() ?? ''
  const district = parts.district?.trim() ?? ''
  const city = parts.city?.trim() ?? ''
  if (!street && !city) return null

  // Split "Street 47" pasted into street field.
  if (street && !houseNo) {
    const split = splitStreetHouse(street)
    if (split.houseNo) {
      street = split.street
      houseNo = split.houseNo
    }
  }

  if (street) {
    const streetLine = houseNo ? `${houseNo} ${street}` : street
    const structured = await nominatimSearch(
      {
        street: streetLine,
        city: city || 'Tbilisi',
        country: 'Georgia',
        limit: '8',
      },
      signal,
    )
    const hit = pickBestRow(structured)
    if (hit) {
      const out = hitFromRow(hit, streetLine)
      if (out) {
        // Keep user's street text if OSM road is empty; prefer OSM house №.
        return {
          ...out,
          street: out.street || street,
          houseNo: out.houseNo || houseNo || undefined,
          city: out.city || matchCityKa(city) || city || undefined,
          district: out.district || district || undefined,
        }
      }
    }
  }

  const q = [street && `${street} ${houseNo}`.trim(), district, city, 'Georgia']
    .filter(Boolean)
    .join(', ')
  return geocodeAddress(q, signal)
}

/** Click-to-address — reverse Nominatim at building zoom. */
export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<GeocodeHit | null> {
  if (!inGeorgia(lat, lng)) return null

  const url = new URL('https://nominatim.openstreetmap.org/reverse')
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lng))
  url.searchParams.set('format', 'json')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('zoom', '18')

  const res = await fetch(url, {
    signal,
    headers: { Accept: 'application/json', 'User-Agent': NOMINATIM_UA },
    next: { revalidate: 86_400 },
  }).catch(() => null)
  if (!res?.ok) return null

  const row = (await res.json()) as NominatimRow & { error?: string }
  if (row.error || !row.lat) return null
  const hit = hitFromRow(row, `${lat.toFixed(5)}, ${lng.toFixed(5)}`)
  if (!hit) return null
  // Fallback city from coords when Nominatim omits it.
  if (!hit.city) hit.city = nearestCity(lat, lng)?.ka
  return hit
}
