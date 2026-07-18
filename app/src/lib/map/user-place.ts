/**
 * Map place memory + Georgia city snap.
 * ponytail: city-level only (IP is coarse). Street GPS stays on the locate button.
 */

import { MAP_CENTER } from '@/lib/map/buildings'

export type MapCity = {
  slug: string
  ka: string
  lat: number
  lng: number
}

/** Centers for map fly-to / IP snap. Inventory cities first. */
export const MAP_CITIES: readonly MapCity[] = [
  { slug: 'tbilisi', ka: 'თბილისი', lat: MAP_CENTER.lat, lng: MAP_CENTER.lng },
  { slug: 'batumi', ka: 'ბათუმი', lat: 41.6417, lng: 41.6391 },
  { slug: 'kutaisi', ka: 'ქუთაისი', lat: 42.2679, lng: 42.6946 },
  { slug: 'rustavi', ka: 'რუსთავი', lat: 41.5495, lng: 44.9931 },
  { slug: 'poti', ka: 'ფოთი', lat: 42.1494, lng: 41.6656 },
  { slug: 'zugdidi', ka: 'ზუგდიდი', lat: 42.5088, lng: 41.8709 },
  { slug: 'telavi', ka: 'თელავი', lat: 41.9198, lng: 45.4736 },
  { slug: 'gori', ka: 'გორი', lat: 41.9842, lng: 44.1163 },
  { slug: 'mtskheta', ka: 'მცხეთა', lat: 41.8434, lng: 44.7144 },
  { slug: 'bakuriani', ka: 'ბაკურიანი', lat: 41.7497, lng: 43.5325 },
  { slug: 'borjomi', ka: 'ბორჯომი', lat: 41.8389, lng: 43.3858 },
  { slug: 'gudauri', ka: 'გუდაური', lat: 42.4764, lng: 44.4769 },
] as const

const PLACE_KEY = 'sivrce.map.place'
const IP_DISMISS_KEY = 'sivrce.map.ip-dismiss'
/** Beyond this → treat as “not near a listed city”. */
const SNAP_MAX_KM = 55

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

export function nearestMapCity(
  lat: number,
  lng: number,
  maxKm = SNAP_MAX_KM,
): MapCity | null {
  let best: MapCity | null = null
  let bestKm = Infinity
  for (const c of MAP_CITIES) {
    const km = haversineKm({ lat, lng }, c)
    if (km < bestKm) {
      bestKm = km
      best = c
    }
  }
  return best && bestKm <= maxKm ? best : null
}

export function cityBySlug(slug: string): MapCity | null {
  return MAP_CITIES.find((c) => c.slug === slug) ?? null
}

export type SavedPlace = { slug: string; lat: number; lng: number }

export function readSavedPlace(): SavedPlace | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(PLACE_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as SavedPlace
    if (typeof p.lat !== 'number' || typeof p.lng !== 'number' || typeof p.slug !== 'string') {
      return null
    }
    return p
  } catch {
    return null
  }
}

export function writeSavedPlace(place: SavedPlace): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PLACE_KEY, JSON.stringify(place))
  } catch {
    /* private mode */
  }
}

export function readIpDismiss(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(IP_DISMISS_KEY)
  } catch {
    return null
  }
}

export function writeIpDismiss(slug: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(IP_DISMISS_KEY, slug)
  } catch {
    /* private mode */
  }
}

/** Map boot center: last place → Tbilisi. */
export function initialMapCenter(): { lat: number; lng: number } {
  return readSavedPlace() ?? MAP_CENTER
}
