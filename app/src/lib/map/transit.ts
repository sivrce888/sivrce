/**
 * Live transit + amenity overlay — bus stops for Berlin, Germany, everywhere.
 * Committed OSM JSON covers Georgia only; the rest resolves on demand via
 * /api/transit (Overpass bbox proxy, CDN-cached). Zero repo weight, zero
 * bundle growth: one debounced fetch per viewport, zoom-gated, lite-capped.
 * ponytail: bbox Overpass only; upgrade → GTFS/MVT when transit QPS hurts.
 */

import { inGeorgia, inServiceArea } from './map-geo'
import { POI_COLORS, POI_LABELS, isPoiCategory, type PoiCategory } from './pois'

/** Transit-first: bus stops are the ask; tram/rail ride the same request. */
export const TRANSIT_CATS = ['bus', 'tram', 'rail'] as const
export type TransitCat = (typeof TRANSIT_CATS)[number]

const TRANSIT_SET = new Set<string>(TRANSIT_CATS)
export function isTransitCat(v: string): v is TransitCat {
  return TRANSIT_SET.has(v)
}

/** Categories the live endpoint can serve (transit + amenity mirror of POI cats). */
export const LIVE_CATS: readonly PoiCategory[] = [
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
]
const LIVE_SET = new Set<string>(LIVE_CATS)

/** Fetch gates — old phones stay smooth: fewer pins, later zooms. */
export const TRANSIT_MIN_ZOOM = 12
export const TRANSIT_LITE_MIN_ZOOM = 13
export const TRANSIT_MAX = 400
export const TRANSIT_LITE_MAX = 150
/** Max viewport span per request — bounds Overpass cost (z12+ viewports pass). */
export const TRANSIT_MAX_SPAN = 0.5
/** CDN cache: stops move slowly; serve stale for a week on failure. */
export const TRANSIT_SMAXAGE = 86_400

export type TransitBbox = { w: number; s: number; e: number; n: number }

export type TransitStop = {
  id: string
  category: PoiCategory
  name: string | null
  lat: number
  lng: number
}

/** Parse + validate ?bbox=w,s,e,n&cats=… — null when the request must not run. */
export function parseTransitParams(
  bboxRaw: string | null,
  catsRaw: string | null,
): { bbox: TransitBbox; cats: PoiCategory[] } | null {
  if (!bboxRaw) return null
  const parts = bboxRaw.split(',').map(Number)
  if (parts.length !== 4 || parts.some((v) => !Number.isFinite(v))) return null
  const [w, s, e, n] = parts as [number, number, number, number]
  if (w >= e || s >= n) return null
  if (!inServiceArea(s, w) || !inServiceArea(n, e)) return null
  if (e - w > TRANSIT_MAX_SPAN || n - s > TRANSIT_MAX_SPAN) return null
  const cats: PoiCategory[] = []
  for (const part of (catsRaw ?? 'bus').split(',')) {
    const c = part.trim()
    if (isPoiCategory(c) && LIVE_SET.has(c) && !cats.includes(c)) cats.push(c)
  }
  if (cats.length === 0 || cats.length > LIVE_CATS.length) return null
  return { bbox: { w, s, e, n }, cats }
}

/** Overpass QL for the requested cats. Bbox order: south,west,north,east. */
export function transitQuery(cats: readonly PoiCategory[], bbox: TransitBbox): string {
  const bb = `${bbox.s},${bbox.w},${bbox.n},${bbox.e}`
  const sel: Record<string, string[]> = {
    bus: [`node["highway"="bus_stop"](${bb})`, `node["public_transport"="platform"]["bus"="yes"](${bb})`],
    tram: [`node["railway"="tram_stop"](${bb})`],
    rail: [
      `node["railway"="station"](${bb})`,
      `node["railway"="halt"](${bb})`,
      `node["public_transport"="station"](${bb})`,
    ],
    metro: [`node["railway"="station"]["station"="subway"](${bb})`],
    school: [`node["amenity"="school"](${bb})`],
    hospital: [`node["amenity"="hospital"](${bb})`],
    pharmacy: [`node["amenity"="pharmacy"](${bb})`],
    university: [`node["amenity"~"^(university|college)$"](${bb})`],
    park: [`nwr["leisure"~"^(park|garden)$"](${bb})`],
    shop: [`node["shop"](${bb})`],
    gym: [`node["leisure"="fitness_centre"](${bb})`],
    landmark: [`nwr["tourism"~"^(attraction|museum|artwork|viewpoint)$"](${bb})`],
  }
  const lines = cats.flatMap((c) => sel[c] ?? []).map((q) => `  ${q};`)
  return `[out:json][timeout:12];\n(\n${lines.join('\n')}\n);\nout center ${TRANSIT_MAX + 200};`
}

export type OverpassEl = {
  type: string
  id: number | string
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

/** Tag → category, transit-first so a subway station reads as metro, not rail. */
function matchTransitCat(
  tags: Record<string, string>,
  want: ReadonlySet<string>,
): PoiCategory | null {
  if (want.has('bus') && (tags.highway === 'bus_stop' || (tags.public_transport === 'platform' && tags.bus === 'yes')))
    return 'bus'
  if (want.has('tram') && tags.railway === 'tram_stop') return 'tram'
  if (want.has('metro') && tags.railway === 'station' && tags.station === 'subway') return 'metro'
  if (
    want.has('rail') &&
    (tags.railway === 'station' || tags.railway === 'halt' || tags.public_transport === 'station')
  )
    return 'rail'
  if (want.has('school') && tags.amenity === 'school') return 'school'
  if (want.has('hospital') && tags.amenity === 'hospital') return 'hospital'
  if (want.has('pharmacy') && tags.amenity === 'pharmacy') return 'pharmacy'
  if (want.has('university') && (tags.amenity === 'university' || tags.amenity === 'college'))
    return 'university'
  if (want.has('park') && (tags.leisure === 'park' || tags.leisure === 'garden')) return 'park'
  if (want.has('shop') && typeof tags.shop === 'string') return 'shop'
  if (want.has('gym') && tags.leisure === 'fitness_centre') return 'gym'
  if (
    want.has('landmark') &&
    (tags.tourism === 'attraction' ||
      tags.tourism === 'museum' ||
      tags.tourism === 'artwork' ||
      tags.tourism === 'viewpoint')
  )
    return 'landmark'
  return null
}

/** Pure: Overpass JSON → capped, deduped stops (ways/relations via center). */
export function parseOverpass(
  json: { elements?: OverpassEl[] } | null | undefined,
  cats: readonly PoiCategory[],
  max = TRANSIT_MAX,
): TransitStop[] {
  const els = json?.elements
  if (!Array.isArray(els)) return []
  const want = new Set<string>(cats)
  const seen = new Set<string>()
  const out: TransitStop[] = []
  for (const el of els) {
    if (out.length >= max) break
    const key = `${el.type}/${el.id}`
    if (seen.has(key)) continue
    const lat = el.lat ?? el.center?.lat
    const lng = el.lon ?? el.center?.lon
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
    if (!inServiceArea(lat as number, lng as number)) continue
    const cat = matchTransitCat(el.tags ?? {}, want)
    if (!cat) continue
    seen.add(key)
    const rawName = (el.tags?.name ?? '').trim()
    out.push({
      id: `osm:${key}`,
      category: cat,
      name: rawName ? rawName.slice(0, 120) : null,
      lat: lat as number,
      lng: lng as number,
    })
  }
  return out
}

/** Stops → GeoJSON in the static-POI shape, so layers/clicks work unchanged. */
export function transitToGeoJSON(stops: readonly TransitStop[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: stops.map((p) => ({
      type: 'Feature' as const,
      id: p.id,
      properties: {
        id: p.id,
        category: p.category,
        name: p.name ?? POI_LABELS[p.category],
        color: POI_COLORS[p.category],
        label: POI_LABELS[p.category],
        icon: `sv-poi-${p.category}`,
        live: true,
      },
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
    })),
  }
}

/**
 * Which requested cats need the live endpoint here.
 * Static JSON already covers amenities in Georgia — transit always goes live.
 */
export function liveCatsFor(
  lat: number,
  lng: number,
  cats: readonly PoiCategory[],
): PoiCategory[] {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return []
  const live = cats.filter((c) => LIVE_SET.has(c))
  if (inGeorgia(lat, lng)) return live.filter((c) => TRANSIT_SET.has(c))
  return live
}

/** Cache-friendly fetch URL — rounded bbox, sorted cats. Null when too wide. */
export function transitFetchUrl(bbox: TransitBbox, cats: readonly PoiCategory[]): string | null {
  if (bbox.e - bbox.w > TRANSIT_MAX_SPAN || bbox.n - bbox.s > TRANSIT_MAX_SPAN) return null
  const live = [...new Set(cats.filter((c) => LIVE_SET.has(c)))].sort()
  if (live.length === 0) return null
  const r = (v: number) => Math.round(v * 1e5) / 1e5
  return `/api/transit?bbox=${r(bbox.w)},${r(bbox.s)},${r(bbox.e)},${r(bbox.n)}&cats=${live.join(',')}`
}
