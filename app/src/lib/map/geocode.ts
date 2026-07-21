/**
 * Address → coords for Georgia listings.
 * ponytail: Nominatim (OSM) server-side only; 1 rps ToS. Upgrade → self-hosted Photon.
 */

import { MAP_CITIES, type MapCity } from '@/lib/map/user-place'
import { GEORGIA_MAX_BOUNDS, MAP_CENTER } from '@/lib/map/buildings'
import { canonicalizeDistrict } from '@/lib/district-canon'
import { geometryRing } from '@/lib/map/pick-building'
import {
  isQuarterLabel,
  matchQuarter,
  quarterSearchQuery,
  type TbilisiQuarter,
} from '@/data/tbilisi-quarters'

export type GeocodeHit = {
  lat: number
  lng: number
  label: string
  city?: string
  district?: string
  street?: string
  houseNo?: string
  /** OSM building outer ring [lng,lat]… when Nominatim returns polygon_geojson. */
  ring?: [number, number][]
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
  geojson?: GeoJSON.Geometry
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

/** Prefer catalog ubani (quarter) over rayon neighbourhood; canonicalize EN/combined. */
export function normalizeDistrict(a?: NominatimRow['address']): string | undefined {
  // quarter first — OSM "დიღმის მასივი" beats rayon "დიდუბის რაიონი"
  const parts = [
    a?.quarter?.split(',')[0]?.trim(),
    a?.neighbourhood?.trim(),
    a?.suburb?.trim(),
    a?.city_district?.trim(),
  ].filter((x): x is string => Boolean(x?.trim()))

  let fallback: string | undefined
  for (const raw of parts) {
    const stripped = raw.replace(/\s*რაიონი\s*$/u, '').trim() || raw
    const canon = canonicalizeDistrict(stripped)
    if (canon) return canon
    if (!fallback) fallback = stripped
  }
  return fallback
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

/** Building footprint only — skip road/amenity polygons. */
function buildingRing(row: NominatimRow): [number, number][] | undefined {
  const isBldg =
    row.class === 'building' ||
    row.addresstype === 'building' ||
    row.type === 'house' ||
    row.type === 'apartments' ||
    Boolean(row.address?.house_number)
  if (!isBldg || !row.geojson) return undefined
  return geometryRing(row.geojson) ?? undefined
}

function hitFromRow(row: NominatimRow, fallbackLabel: string): GeocodeHit | null {
  const lat = Number(row.lat)
  const lng = Number(row.lon)
  if (!inGeorgia(lat, lng)) return null
  const a = row.address
  const ring = buildingRing(row)
  return {
    lat,
    lng,
    label: row.display_name ?? fallbackLabel,
    city: matchCityKa(a?.city ?? a?.town ?? a?.village ?? a?.municipality),
    district: normalizeDistrict(a),
    street: a?.road ?? a?.pedestrian,
    houseNo: a?.house_number,
    ...(ring ? { ring } : {}),
  }
}

function normHouse(n: string): string {
  return n.trim().toLowerCase().replace(/\s+/g, '')
}

/** Prefer house/building pins over cafes / street centroids. */
export function scoreNominatimRow(row: NominatimRow, wantHouse?: string): number {
  let s = Number(row.importance) || 0
  if (row.class === 'building' || row.addresstype === 'building') s += 12
  if (row.type === 'house' || row.type === 'apartments' || row.type === 'building') s += 8
  if (row.address?.house_number) s += 6
  if (row.class === 'place' && row.type === 'house') s += 5
  if (row.class === 'amenity') s -= 6
  if (row.class === 'highway') s -= 8
  if (row.class === 'shop') s -= 4
  if (wantHouse && row.address?.house_number) {
    if (normHouse(row.address.house_number) === normHouse(wantHouse)) s += 20
  }
  return s
}

function pickBestRow(rows: NominatimRow[], wantHouse?: string): NominatimRow | null {
  if (!rows.length) return null
  return (
    [...rows].sort((a, b) => scoreNominatimRow(b, wantHouse) - scoreNominatimRow(a, wantHouse))[0] ??
    null
  )
}

function rankRows(rows: NominatimRow[], wantHouse?: string): NominatimRow[] {
  return [...rows].sort((a, b) => scoreNominatimRow(b, wantHouse) - scoreNominatimRow(a, wantHouse))
}

async function nominatimSearch(
  params: Record<string, string>,
  signal?: AbortSignal,
): Promise<NominatimRow[]> {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  url.searchParams.set('format', 'json')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('polygon_geojson', '1')
  url.searchParams.set('countrycodes', 'ge')
  url.searchParams.set('viewbox', `${W},${N},${E},${S}`)
  url.searchParams.set('bounded', '1')

  // ponytail: no-store — empty 200s were poison-cached 24h → add-listing 404 in 5ms
  // Referer+From: Next may strip User-Agent; Nominatim still accepts these.
  const res = await fetch(url, {
    signal,
    headers: {
      Accept: 'application/json',
      'User-Agent': NOMINATIM_UA,
      Referer: 'https://sivrce.ge/',
      From: 'maps@sivrce.ge',
    },
    cache: 'no-store',
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

  const { houseNo } = splitStreetHouse(q)
  const rows = await nominatimSearch({ q, limit: '8' }, signal)
  const row = pickBestRow(rows, houseNo || undefined)
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
  for (const row of rankRows(rows, houseNo || undefined)) {
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

/** ~350m — reject Nominatim false-hits (e.g. Varketili მე-3 → მე-7). */
const QUARTER_SNAP_DEG = 0.0035

function preferQuarterPin(
  hit: GeocodeHit | null,
  cat: TbilisiQuarter | undefined,
  street: string,
  houseNo: string,
  district: string,
  city: string,
): GeocodeHit | null {
  const near =
    !!hit &&
    !!cat &&
    Math.abs(hit.lat - cat.lat) < QUARTER_SNAP_DEG &&
    Math.abs(hit.lng - cat.lng) < QUARTER_SNAP_DEG

  if (hit && (!cat || near)) {
    return {
      ...hit,
      street: hit.street || street,
      houseNo: hit.houseNo || houseNo || undefined,
      city: hit.city || matchCityKa(city) || city || undefined,
      district: hit.district || cat?.district || district || undefined,
    }
  }
  if (!cat) return null
  return {
    lat: cat.lat,
    lng: cat.lng,
    label: cat.ka,
    street: cat.ka,
    houseNo: houseNo || undefined,
    city: matchCityKa(city) || city || 'თბილისი',
    district: cat.district || district || undefined,
  }
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

  // Massiv / microdistrict labels — Nominatim rewrite + catalog pin fallback.
  const cat = matchQuarter(street)
  if (street && (cat || isQuarterLabel(street))) {
    const qStreet = quarterSearchQuery(street)
    // Digomi: drop commas. Varketili III nominatim field keeps "მესამე მასივი, მე-N".
    const qCore = cat?.nominatim
      ? qStreet
      : qStreet.replace(/,\s*/g, ' ').replace(/\s+/g, ' ').trim()
    const query = houseNo ? `${houseNo} ${qCore}` : qCore
    const hit = await geocodeAddress(query, signal)
    const pinned = preferQuarterPin(hit, cat, street, houseNo, district, city)
    if (pinned) return pinned
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
    const hit = pickBestRow(structured, houseNo || undefined)
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

/** UI line from a geocode hit — street + house № first. */
export function formatGeocodeAddress(
  hit: Pick<GeocodeHit, 'street' | 'houseNo' | 'district' | 'city' | 'label'>,
): string {
  const street = [hit.street, hit.houseNo].filter(Boolean).join(' ').trim()
  const line = [street || null, hit.district, hit.city].filter(Boolean).join(', ')
  return line || hit.label
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
    headers: {
      Accept: 'application/json',
      'User-Agent': NOMINATIM_UA,
      Referer: 'https://sivrce.ge/',
      From: 'maps@sivrce.ge',
    },
    cache: 'no-store',
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
