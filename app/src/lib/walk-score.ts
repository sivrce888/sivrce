/**
 * Neighborhood walk / transit / bike scores from amenity hits.
 * Unique categories in catchment — 40 bus stops ≠ a walkable street.
 * ponytail: pure; 0 means hide the widget (never invent a fake 25).
 */

export type AmenityHit = { category: string; meters: number }

const WALK_CATS = new Set(['metro', 'bus', 'tram', 'shop', 'pharmacy', 'school', 'park'])
const TRANSIT_CATS = new Set(['metro', 'bus', 'tram', 'rail'])
const BIKE_CATS = new Set(['park', 'school', 'shop'])

function uniqueInRange(hits: AmenityHit[], cats: Set<string>, maxM: number): number {
  const seen = new Set<string>()
  for (const h of hits) {
    if (h.meters <= maxM && cats.has(h.category)) seen.add(h.category)
  }
  return seen.size
}

export function scoreFromAmenities(hits: AmenityHit[]): { walk: number; transit: number; bike: number } {
  return {
    walk: Math.min(100, uniqueInRange(hits, WALK_CATS, 600) * 15),
    transit: Math.min(100, uniqueInRange(hits, TRANSIT_CATS, 1000) * 25),
    bike: Math.min(100, uniqueInRange(hits, BIKE_CATS, 1200) * 34),
  }
}

export function hasNeighborhoodSignal(s: { walk: number; transit: number; bike: number }): boolean {
  return s.walk + s.transit + s.bike > 0
}

/** WGS84 metres — local copy so listing clients never import buildings.ts. */
export function amenityMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toR = Math.PI / 180
  const dLat = (bLat - aLat) * toR
  const dLng = (bLng - aLng) * toR
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(aLat * toR) * Math.cos(bLat * toR) * Math.sin(dLng / 2) ** 2
  return 6371000 * 2 * Math.asin(Math.min(1, Math.sqrt(a)))
}

/** ~900 m bbox around a pin — Overpass span stays under TRANSIT_MAX_SPAN. */
export function amenityBbox(lat: number, lng: number): string {
  const d = 0.008
  return `${lng - d},${lat - d},${lng + d},${lat + d}`
}
