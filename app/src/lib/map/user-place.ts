/**
 * Map place memory + Georgia city snap.
 * ponytail: city-level only (IP is coarse). Street GPS stays on the locate button.
 */

import { FREEDOM_SQUARE, MAP_CENTER } from '@/lib/map/map-geo'

export type MapCity = {
  slug: string
  ka: string
  /** Latin name — non-ka UI picks this for chips/popups. */
  en: string
  lat: number
  lng: number
}

/** Centers for map fly-to / IP snap. Inventory cities first. */
export const MAP_CITIES: readonly MapCity[] = [
  { slug: 'tbilisi', ka: 'თბილისი', en: 'Tbilisi', lat: FREEDOM_SQUARE.lat, lng: FREEDOM_SQUARE.lng },
  { slug: 'batumi', ka: 'ბათუმი', en: 'Batumi', lat: 41.6417, lng: 41.6391 },
  { slug: 'kutaisi', ka: 'ქუთაისი', en: 'Kutaisi', lat: 42.2679, lng: 42.6946 },
  { slug: 'rustavi', ka: 'რუსთავი', en: 'Rustavi', lat: 41.5495, lng: 44.9931 },
  { slug: 'poti', ka: 'ფოთი', en: 'Poti', lat: 42.1494, lng: 41.6656 },
  { slug: 'zugdidi', ka: 'ზუგდიდი', en: 'Zugdidi', lat: 42.5088, lng: 41.8709 },
  { slug: 'telavi', ka: 'თელავი', en: 'Telavi', lat: 41.9198, lng: 45.4736 },
  { slug: 'gori', ka: 'გორი', en: 'Gori', lat: 41.9842, lng: 44.1163 },
  { slug: 'mtskheta', ka: 'მცხეთა', en: 'Mtskheta', lat: 41.8434, lng: 44.7144 },
  { slug: 'bakuriani', ka: 'ბაკურიანი', en: 'Bakuriani', lat: 41.7497, lng: 43.5325 },
  { slug: 'borjomi', ka: 'ბორჯომი', en: 'Borjomi', lat: 41.8389, lng: 43.3858 },
  { slug: 'gudauri', ka: 'გუდაური', en: 'Gudauri', lat: 42.4764, lng: 44.4769 },
  // DE market (sivrce.de) — map fly-to / IP snap + geocode city match.
  { slug: 'berlin', ka: 'ბერლინი', en: 'Berlin', lat: 52.52, lng: 13.405 },
  { slug: 'hamburg', ka: 'ჰამბურგი', en: 'Hamburg', lat: 53.5511, lng: 9.9937 },
  { slug: 'munich', ka: 'მიუნხენი', en: 'Munich', lat: 48.1351, lng: 11.582 },
  { slug: 'cologne', ka: 'კელნი', en: 'Cologne', lat: 50.9375, lng: 6.9603 },
  { slug: 'frankfurt', ka: 'ფრანკფურტი', en: 'Frankfurt', lat: 50.1109, lng: 8.6821 },
  { slug: 'stuttgart', ka: 'შტუტგარტი', en: 'Stuttgart', lat: 48.7758, lng: 9.1829 },
  { slug: 'duesseldorf', ka: 'დიუსელდორფი', en: 'Düsseldorf', lat: 51.2277, lng: 6.7735 },
  { slug: 'leipzig', ka: 'ლაიფციგი', en: 'Leipzig', lat: 51.3397, lng: 12.3731 },
  { slug: 'dortmund', ka: 'დორტმუნდი', en: 'Dortmund', lat: 51.5136, lng: 7.4653 },
  { slug: 'essen', ka: 'ესენი', en: 'Essen', lat: 51.4556, lng: 7.0116 },
  { slug: 'bremen', ka: 'ბრემენი', en: 'Bremen', lat: 53.0793, lng: 8.8017 },
  { slug: 'dresden', ka: 'დრეზდენი', en: 'Dresden', lat: 51.0504, lng: 13.7373 },
  { slug: 'hanover', ka: 'ჰანოვერი', en: 'Hanover', lat: 52.3759, lng: 9.732 },
  { slug: 'nuremberg', ka: 'ნიურნბერგი', en: 'Nuremberg', lat: 49.4521, lng: 11.0767 },
  { slug: 'duisburg', ka: 'დუისბურგი', en: 'Duisburg', lat: 51.4344, lng: 6.7623 },
  { slug: 'bochum', ka: 'ბოხუმი', en: 'Bochum', lat: 51.4818, lng: 7.2162 },
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
