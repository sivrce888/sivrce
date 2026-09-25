/**
 * POI constants — zero data deps, client-safe.
 * Split from lib/map/pois (1.1 MB JSON) so map UI + cards use filters, colors
 * and prefs without shipping the POI corpus (device-budget lock).
 */
import type { ExpressionSpecification, FilterSpecification } from 'maplibre-gl'
import { CATEGORY_BRAND } from '@/lib/category-brand'

export const POI_CATEGORIES = [
  'metro',
  'bus',
  'tram',
  'rail',
  'pharmacy',
  'school',
  'kindergarten',
  'bank',
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
  kindergarten: 13,
  bank: 12.5,
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
  kindergarten: 'ბაგა-ბაღი',
  bank: 'ბანკი',
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
  // kindergarten shares the school hue — same family decision, same color.
  kindergarten: CATEGORY_BRAND.newProjects.hue,
  // bank = commercial hue (money/errands family, same as shop).
  bank: CATEGORY_BRAND.commercial.hue,
  university: CATEGORY_BRAND.land.hue,
  park: CATEGORY_BRAND.cottages.hue,
  shop: CATEGORY_BRAND.commercial.hue,
  gym: CATEGORY_BRAND.houses.hue,
  hospital: CATEGORY_BRAND.hotels.hue,
  // highlights get primary blue — locked apartments hue, distinct from school sky.
  landmark: CATEGORY_BRAND.apartments.hue,
}

/**
 * Placement priority when two badges collide — MapLibre draws the LOWER key first
 * and it wins the spot. Ordered by what actually moves a property decision: rapid
 * transit, then the civic anchors, then everyday errands. Bus is last because a
 * city has thousands of stops and they are the least differentiating pin on the
 * map; without this, a dense corridor buries the metro station under bus badges.
 */
export const POI_SORT_KEY: Record<PoiCategory, number> = {
  metro: 0,
  rail: 1,
  tram: 2,
  landmark: 3,
  hospital: 4,
  university: 4,
  school: 5,
  kindergarten: 5,
  bank: 5,
  park: 5,
  pharmacy: 6,
  shop: 6,
  gym: 6,
  bus: 7,
}

/** `symbol-sort-key` expression — no per-feature bytes, unlike a baked property. */
export function poiSortKeySpec(): ExpressionSpecification {
  // ponytail: variadic `match` can't be expressed in the spec's fixed-arity tuple.
  return [
    'match',
    ['get', 'category'],
    ...POI_CATEGORIES.flatMap((c) => [c, POI_SORT_KEY[c]]),
    9,
  ] as unknown as ExpressionSpecification
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

/**
 * Filters for the three amenity icon layers.
 *
 * `symbol-sort-key` only orders symbols WITHIN one layer. Static OSM POIs and
 * live transit are two sources, so they are two layers, and MapLibre resolves a
 * cross-layer collision by layer order alone — which silently hid every metro
 * station behind the bus stops drawn above it. Metro therefore gets its own
 * always-on layer on top; `rest` covers everything that is allowed to yield.
 */
export function poiLayerFilters(
  enabled: readonly PoiCategory[],
  zoom = 22,
): { rest: FilterSpecification; metro: FilterSpecification; labels: FilterSpecification } {
  const visible = enabled.filter((c) => zoom + 1e-6 >= POI_MIN_ZOOM[c])
  return {
    rest: poiFilterSpec(visible.filter((c) => c !== 'metro')),
    metro: poiFilterSpec(visible.filter((c) => c === 'metro')),
    labels: poiFilterSpec(visible),
  }
}
