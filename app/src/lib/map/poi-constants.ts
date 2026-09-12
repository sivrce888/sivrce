/**
 * POI constants — zero data deps, client-safe.
 * Split from lib/map/pois (1.1 MB JSON) so map UI + cards use filters, colors
 * and prefs without shipping the POI corpus (device-budget lock).
 */
import type { FilterSpecification } from 'maplibre-gl'
import { CATEGORY_BRAND } from '@/lib/category-brand'

export const POI_CATEGORIES = [
  'metro',
  'bus',
  'tram',
  'rail',
  'pharmacy',
  'school',
  'university',
  'park',
  'shop',
  'gym',
  'hospital',
  'landmark',
] as const

export type PoiCategory = (typeof POI_CATEGORIES)[number]

/** Default: metro only — highest RE signal, least clutter. */
export const POI_DEFAULT_ON: readonly PoiCategory[] = ['metro']

/** Dense OSM cats appear later — less clutter when toggled on. */
export const POI_MIN_ZOOM: Record<PoiCategory, number> = {
  metro: 11,
  rail: 11.5,
  university: 11.5,
  landmark: 11.5,
  hospital: 12,
  shop: 12,
  park: 12,
  tram: 12.5,
  gym: 12.5,
  school: 13,
  bus: 13.5,
  pharmacy: 13.5,
}

/** Fallback KA labels — UI prefers i18n `map.poi.*`. */
export const POI_LABELS: Record<PoiCategory, string> = {
  metro: 'მეტრო',
  bus: 'ავტობუსი',
  tram: 'ტრამვაი',
  rail: 'მატარებელი',
  pharmacy: 'აფთიაქი',
  school: 'სკოლა',
  university: 'უნივერსიტეტი',
  park: 'პარკი',
  shop: 'მარკეტი',
  gym: 'ჯიმი',
  hospital: 'კლინიკა',
  landmark: 'ღირსშესანიშნაობა',
}

/** Locked category hues only — no new brand hex. */
export const POI_COLORS: Record<PoiCategory, string> = {
  // Tbilisi metro signage is red — reuse locked rose (dailyRent), not a new hex.
  metro: CATEGORY_BRAND.dailyRent.hue,
  // Transit: bus = action orange (houses), tram = violet (commercial), rail = primary blue.
  bus: CATEGORY_BRAND.houses.hue,
  tram: CATEGORY_BRAND.commercial.hue,
  rail: CATEGORY_BRAND.apartments.hue,
  pharmacy: CATEGORY_BRAND.dailyRent.hue,
  school: CATEGORY_BRAND.newProjects.hue,
  university: CATEGORY_BRAND.land.hue,
  park: CATEGORY_BRAND.cottages.hue,
  shop: CATEGORY_BRAND.commercial.hue,
  gym: CATEGORY_BRAND.houses.hue,
  hospital: CATEGORY_BRAND.hotels.hue,
  // highlights get primary blue — locked apartments hue, distinct from school sky.
  landmark: CATEGORY_BRAND.apartments.hue,
}

const CAT_SET = new Set<string>(POI_CATEGORIES)

export function isPoiCategory(v: string): v is PoiCategory {
  return CAT_SET.has(v)
}

/** Cookie/LS: comma list, e.g. "metro,pharmacy". Empty string = none. */
export function parsePoiPrefs(raw: unknown): PoiCategory[] | undefined {
  if (raw == null) return undefined
  if (typeof raw !== 'string') return undefined
  if (raw === '') return []
  const out: PoiCategory[] = []
  for (const part of raw.split(',')) {
    const t = part.trim()
    if (isPoiCategory(t) && !out.includes(t)) out.push(t)
  }
  return out
}

export function serializePoiPrefs(cats: readonly PoiCategory[]): string {
  return cats.join(',')
}

/** Zoom-aware: dense categories stay hidden until closer. */
export function poiFilterSpec(
  enabled: readonly PoiCategory[],
  zoom = 22,
): FilterSpecification {
  const visible = enabled.filter((c) => zoom + 1e-6 >= POI_MIN_ZOOM[c])
  if (visible.length === 0) {
    return ['==', ['get', 'category'], '__none__']
  }
  return ['in', ['get', 'category'], ['literal', [...visible]]]
}
