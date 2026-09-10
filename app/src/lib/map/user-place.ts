/**
 * Map place memory + city snap.
 * ponytail: city-level only (IP is coarse). Street GPS stays on the locate button.
 */

import { FREEDOM_SQUARE, MAP_CENTER, parseCoords } from '@/lib/map/map-geo'
import type { MarketId } from '@/lib/markets'

export type MapCityCc = 'GE' | 'DE' | 'AE' | 'FR' | 'ES' | 'IT' | 'GB' | 'US' | 'CA' | 'TR'

export type MapCity = {
  slug: string
  ka: string
  /** Latin name — non-ka UI picks this for chips/popups. */
  en: string
  lat: number
  lng: number
  cc: MapCityCc
}

function city(
  slug: string,
  ka: string,
  en: string,
  lat: number,
  lng: number,
  cc: MapCityCc,
): MapCity {
  return { slug, ka, en, lat, lng, cc }
}

/** Centers for map fly-to / IP snap. Inventory cities first. */
export const MAP_CITIES: readonly MapCity[] = [
  city('tbilisi', 'თბილისი', 'Tbilisi', FREEDOM_SQUARE.lat, FREEDOM_SQUARE.lng, 'GE'),
  city('batumi', 'ბათუმი', 'Batumi', 41.6417, 41.6391, 'GE'),
  city('kutaisi', 'ქუთაისი', 'Kutaisi', 42.2679, 42.6946, 'GE'),
  city('rustavi', 'რუსთავი', 'Rustavi', 41.5495, 44.9931, 'GE'),
  city('poti', 'ფოთი', 'Poti', 42.1494, 41.6656, 'GE'),
  city('zugdidi', 'ზუგდიდი', 'Zugdidi', 42.5088, 41.8709, 'GE'),
  city('telavi', 'თელავი', 'Telavi', 41.9198, 45.4736, 'GE'),
  city('gori', 'გორი', 'Gori', 41.9842, 44.1163, 'GE'),
  city('mtskheta', 'მცხეთა', 'Mtskheta', 41.8434, 44.7144, 'GE'),
  city('bakuriani', 'ბაკურიანი', 'Bakuriani', 41.7497, 43.5325, 'GE'),
  city('borjomi', 'ბორჯომი', 'Borjomi', 41.8389, 43.3858, 'GE'),
  city('gudauri', 'გუდაური', 'Gudauri', 42.4764, 44.4769, 'GE'),
  city('berlin', 'ბერლინი', 'Berlin', 52.52, 13.405, 'DE'),
  city('hamburg', 'ჰამბურგი', 'Hamburg', 53.5511, 9.9937, 'DE'),
  city('munich', 'მიუნხენი', 'Munich', 48.1351, 11.582, 'DE'),
  city('cologne', 'კელნი', 'Cologne', 50.9375, 6.9603, 'DE'),
  city('frankfurt', 'ფრანკფურტი', 'Frankfurt', 50.1109, 8.6821, 'DE'),
  city('stuttgart', 'შტუტგარტი', 'Stuttgart', 48.7758, 9.1829, 'DE'),
  city('duesseldorf', 'დიუსელდორფი', 'Düsseldorf', 51.2277, 6.7735, 'DE'),
  city('leipzig', 'ლაიფციგი', 'Leipzig', 51.3397, 12.3731, 'DE'),
  city('dortmund', 'დორტმუნდი', 'Dortmund', 51.5136, 7.4653, 'DE'),
  city('essen', 'ესენი', 'Essen', 51.4556, 7.0116, 'DE'),
  city('bremen', 'ბრემენი', 'Bremen', 53.0793, 8.8017, 'DE'),
  city('dresden', 'დრეზდენი', 'Dresden', 51.0504, 13.7373, 'DE'),
  city('hanover', 'ჰანოვერი', 'Hanover', 52.3759, 9.732, 'DE'),
  city('nuremberg', 'ნიურნბერგი', 'Nuremberg', 49.4521, 11.0767, 'DE'),
  city('duisburg', 'დუისბურგი', 'Duisburg', 51.4344, 6.7623, 'DE'),
  city('bochum', 'ბოხუმი', 'Bochum', 51.4818, 7.2162, 'DE'),
  city('dubai', 'დუბაი', 'Dubai', 25.2048, 55.2708, 'AE'),
  city('abu-dhabi', 'აბუ-დაბი', 'Abu Dhabi', 24.4539, 54.3773, 'AE'),
  city('paris', 'პარიზი', 'Paris', 48.8566, 2.3522, 'FR'),
  city('lyon', 'ლიონი', 'Lyon', 45.764, 4.8357, 'FR'),
  city('madrid', 'მადრიდი', 'Madrid', 40.4168, -3.7038, 'ES'),
  city('barcelona', 'ბარსელონა', 'Barcelona', 41.3874, 2.1686, 'ES'),
  city('rome', 'რომი', 'Rome', 41.9028, 12.4964, 'IT'),
  city('milan', 'მილანი', 'Milan', 45.4642, 9.19, 'IT'),
  city('london', 'ლონდონი', 'London', 51.5074, -0.1278, 'GB'),
  city('manchester', 'მანჩესტერი', 'Manchester', 53.4808, -2.2426, 'GB'),
  city('new-york', 'ნიუ-იორკი', 'New York', 40.7128, -74.006, 'US'),
  city('miami', 'მაიამი', 'Miami', 25.7617, -80.1918, 'US'),
  city('toronto', 'ტორონტო', 'Toronto', 43.6532, -79.3832, 'CA'),
  city('vancouver', 'ვანკუვერი', 'Vancouver', 49.2827, -123.1207, 'CA'),
  city('istanbul', 'სტამბოლი', 'Istanbul', 41.0082, 28.9784, 'TR'),
  city('antalya', 'ანტალია', 'Antalya', 36.8969, 30.7133, 'TR'),
]

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

const CITY_ALIASES: Record<string, string> = {
  tiflis: 'tbilisi',
  batoum: 'batumi',
  koeln: 'cologne',
  muenchen: 'munich',
  'new york': 'new-york',
  'abu dhabi': 'abu-dhabi',
  abu_dhabi: 'abu-dhabi',
}

function isoForMarket(market: MarketId): MapCityCc | null {
  switch (market) {
    case 'ge':
      return 'GE'
    case 'de':
      return 'DE'
    case 'ae':
      return 'AE'
    case 'global':
      return null
    default: {
      const _n: never = market
      return _n
    }
  }
}

/** Saved-place allowlist for a market. `global` = any slug. */
export function slugsForMarket(market: MarketId): Set<string> | undefined {
  const iso = isoForMarket(market)
  if (!iso) return undefined
  const out = new Set<string>(['here'])
  for (const c of MAP_CITIES) {
    if (c.cc === iso) out.add(c.slug)
  }
  return out
}

/** Catalog city from IP/header/user string (en, slug, ka, a few aliases). */
export function cityByName(raw: string): MapCity | null {
  const q = raw.trim().toLowerCase()
  if (!q) return null
  const aliased = CITY_ALIASES[q]
  if (aliased) return cityBySlug(aliased)
  return (
    MAP_CITIES.find(
      (c) => c.slug === q || c.en.toLowerCase() === q || c.ka.toLowerCase() === q,
    ) ?? null
  )
}

/**
 * IP → place. Catalog snap when near a listed city; otherwise the IP pin itself
 * (Google/Airbnb "you're here"). (0,0) is unset, not Null Island.
 */
export function placeFromIp(lat: number, lng: number, cityName?: string | null): MapCity | null {
  let name = cityName?.trim() ?? ''
  if (name) {
    try {
      name = decodeURIComponent(name)
    } catch {
      /* keep raw */
    }
  }
  const named = name ? cityByName(name) : null
  const here = parseCoords(lat, lng)
  if (here) {
    const near = nearestMapCity(here.lat, here.lng)
    if (near) return { ...near, lat: here.lat, lng: here.lng }
    const label = name || named?.en || 'here'
    return {
      slug: named?.slug ?? 'here',
      ka: named?.ka ?? label,
      en: label,
      lat: here.lat,
      lng: here.lng,
      cc: named?.cc ?? 'GE',
    }
  }
  return named
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

/** Map boot center: last in-market place → fallback → Tbilisi. */
export function initialMapCenter(
  fallback?: { lat: number; lng: number },
  allow?: ReadonlySet<string>,
): { lat: number; lng: number } {
  const saved = readSavedPlace()
  if (saved && (!allow || allow.has(saved.slug))) return saved
  return fallback ?? MAP_CENTER
}
