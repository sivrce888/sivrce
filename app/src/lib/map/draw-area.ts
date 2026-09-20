/**
 * Draw-to-search — a finger/pointer path becomes a search area.
 *
 * Rightmove, Zillow and ImmoScout all ship this because a drawn shape says
 * what no radius can: "this side of the river, not that one". Pure geometry
 * here so the filter is testable without a map.
 *
 * ponytail: ray casting + distance thinning, no turf/geo dependency. Ceiling —
 * a ring crossing the antimeridian tests wrong; the map renders no world copies
 * so a drawn shape can't span it. Upgrade → split the ring at ±180 if Sivrce
 * ever lets one drag wrap the planet.
 * Run self-check: npx tsx src/lib/map/draw-area.check.ts
 */

export type LngLat = [number, number]
export type ScreenPoint = { x: number; y: number }

/** Below this the shape is a tap, not an area — treat it as "no area drawn". */
export const MIN_RING_POINTS = 3
/** Screen px between kept samples. A scribble of 600 events becomes ~50 vertices. */
export const PATH_MIN_PX = 8

/** Drop samples closer than `minPx` to the last kept one. */
export function thinPath(points: readonly ScreenPoint[], minPx = PATH_MIN_PX): ScreenPoint[] {
  const out: ScreenPoint[] = []
  for (const p of points) {
    const last = out[out.length - 1]
    if (!last || Math.hypot(p.x - last.x, p.y - last.y) >= minPx) out.push(p)
  }
  return out
}

/** Signed area × 2 in squared degrees — sign gives winding, magnitude gives size. */
function shoelace(ring: readonly LngLat[]): number {
  let sum = 0
  for (let i = 0, n = ring.length; i < n; i++) {
    const [x1, y1] = ring[i]!
    const [x2, y2] = ring[(i + 1) % n]!
    sum += x1 * y2 - x2 * y1
  }
  return sum
}

/** Enough vertices and enough enclosed area to mean something at this zoom. */
export function isDrawableRing(ring: readonly LngLat[]): boolean {
  if (ring.length < MIN_RING_POINTS) return false
  return Math.abs(shoelace(ring)) > 1e-10
}

/**
 * Ray casting. The ring may be open (the last vertex need not repeat the
 * first) — the modulo closes it.
 */
export function pointInRing(ring: readonly LngLat[], lng: number, lat: number): boolean {
  if (ring.length < MIN_RING_POINTS) return false
  let inside = false
  for (let i = 0, n = ring.length, j = n - 1; i < n; j = i++) {
    const [xi, yi] = ring[i]!
    const [xj, yj] = ring[j]!
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

/** GeoJSON for the drawn shape — closed ring, or an empty collection when clear. */
export function ringToGeoJSON(ring: readonly LngLat[] | null): GeoJSON.FeatureCollection {
  if (!ring || !isDrawableRing(ring)) return { type: 'FeatureCollection', features: [] }
  const closed: LngLat[] = [...ring]
  const first = closed[0]!
  const last = closed[closed.length - 1]!
  if (first[0] !== last[0] || first[1] !== last[1]) closed.push(first)
  return {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [closed] } }],
  }
}
