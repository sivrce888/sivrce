/**
 * Shared place resolver for project + developer pages.
 * Pure functions over committed catalogs only (MAP_CITIES, NEIGHBORHOODS) —
 * no fetch, no client JS, no new data files.
 * ponytail: metro/amenities/weather stay in map/pois + WeatherBadge (buildings-page
 * precedent); this file only resolves city → country/neighborhood + dedupes photos.
 * Ceiling: PostGIS nearest-neighbor + live market stats when pages need them.
 */
import { NEIGHBORHOODS, type Neighborhood } from '@/data/neighborhoods'
import { cityByName, nearestMapCity, type MapCity } from '@/lib/map/user-place'

export type PlaceCoords = { lat: number; lng: number }

export function validCoords(c?: PlaceCoords | null): c is PlaceCoords {
  return (
    !!c &&
    Number.isFinite(c.lat) &&
    Number.isFinite(c.lng) &&
    !(Math.abs(c.lat) < 0.01 && Math.abs(c.lng) < 0.01)
  )
}

/** Catalog city by ka name, else nearest catalog city to the pin. */
export function resolvePlaceCity(cityKa: string, coords?: PlaceCoords | null): MapCity | null {
  return cityByName(cityKa) ?? (validCoords(coords) ? nearestMapCity(coords.lat, coords.lng) : null)
}

/** Short overrides where Intl is awkward for RE chrome (UAE, US, UK, Türkiye). */
const CC_SHORT: Record<string, Partial<{ ka: string; en: string; ru: string; de: string }>> = {
  AE: { en: 'UAE', ka: 'არაბთა გაერთიანებული საამიროები', ru: 'ОАЭ', de: 'VAE' },
  US: { en: 'United States', ka: 'აშშ', ru: 'США', de: 'USA' },
  GB: { en: 'United Kingdom', ka: 'დიდი ბრიტანეთი', ru: 'Великобритания' },
  TR: { en: 'Türkiye' },
  XK: { en: 'Kosovo', ka: 'კოსოვო', ru: 'Косово', de: 'Kosovo' },
}

function regionName(lang: string, cc: string): string | undefined {
  try {
    return new Intl.DisplayNames([lang], { type: 'region' }).of(cc.toUpperCase()) ?? undefined
  } catch {
    return undefined
  }
}

/**
 * Country label for any ISO alpha-2. Uses Intl so every MAP_CITIES cc resolves —
 * no hand map to maintain. Hub copy still only for launched markets (hubs-extra).
 */
export function countryOf(cc: string): { ka: string; en: string; ru: string; de?: string } {
  const code = cc.toUpperCase()
  const o = CC_SHORT[code]
  return {
    ka: o?.ka ?? regionName('ka', code) ?? code,
    en: o?.en ?? regionName('en', code) ?? code,
    ru: o?.ru ?? regionName('ru', code) ?? code,
    de: o?.de ?? regionName('de', code),
  }
}

function haversineKm(a: PlaceCoords, b: PlaceCoords): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

/**
 * Neighborhood guide for a project/developer pin: exact district hit first,
 * else nearest guide in the same city, else the city guide itself.
 */
export function matchNeighborhood(
  cityKa: string,
  district?: string,
  coords?: PlaceCoords | null,
): Neighborhood | null {
  const cands = NEIGHBORHOODS.filter((n) => n.cityKey === cityKa)
  if (cands.length === 0) return null
  if (district) {
    // Neighborhood guides first — City guides list every district and would shadow them.
    const hit =
      cands.find((n) => n.type === 'Neighborhood' && n.districts.includes(district)) ??
      cands.find((n) => n.districts.includes(district))
    if (hit) return hit
  }
  if (validCoords(coords)) {
    let best: Neighborhood | null = null
    let bestKm = Infinity
    for (const n of cands) {
      const km = haversineKm(coords, n.coords)
      if (km < bestKm) {
        bestKm = km
        best = n
      }
    }
    if (best) return best
  }
  // Unknown district + no pin: stay honest (page shows the raw district text).
  if (district) return null
  return cands.find((n) => n.type === 'City') ?? cands[0] ?? null
}

export type PlaceLoc = 'ka' | 'en' | 'ru' | 'de'

/** Anchor + heading labels without touching the shared directory-seo dicts. */
export function placeLabels(loc: PlaceLoc): { area: string; photos: string } {
  if (loc === 'ru') return { area: 'Район', photos: 'Все фото' }
  if (loc === 'de') return { area: 'Umgebung', photos: 'Alle Fotos' }
  if (loc === 'en') return { area: 'Area', photos: 'All photos' }
  return { area: 'არეალი', photos: 'ყველა ფოტო' }
}

/** Dedupe hero + gallery + passport art into one render-everything list. */
export function collectPhotos(parts: (string | string[] | undefined)[], cap = 12): string[] {  const out: string[] = []
  const seen = new Set<string>()
  for (const p of parts) {
    for (const src of Array.isArray(p) ? p : [p]) {
      if (!src || seen.has(src)) continue
      seen.add(src)
      out.push(src)
      if (out.length >= cap) return out
    }
  }
  return out
}
