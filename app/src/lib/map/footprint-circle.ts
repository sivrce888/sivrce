/** Circular tower footprint from TAS centroid (m² Highlight twin cylinders). */

export type FootprintRing = [number, number][]

export function ringBboxHalfM(ring: ReadonlyArray<readonly number[]>): number {
  let minLng = Infinity
  let maxLng = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity
  for (const pt of ring) {
    const lng = pt[0]
    const lat = pt[1]
    if (lng === undefined || lat === undefined) continue
    if (lng < minLng) minLng = lng
    if (lng > maxLng) maxLng = lng
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
  }
  const latC = (minLat + maxLat) / 2
  const w = (maxLng - minLng) * 111_320 * Math.cos((latC * Math.PI) / 180)
  const h = (maxLat - minLat) * 111_320
  return Math.max(w, h) / 2
}

export function ringCentroid(ring: FootprintRing): { lat: number; lng: number } {
  let sLat = 0
  let sLng = 0
  let n = 0
  const last = ring.length - 1
  const closed =
    last > 0 && ring[0]![0] === ring[last]![0] && ring[0]![1] === ring[last]![1]
  const end = closed ? last : ring.length
  for (let i = 0; i < end; i++) {
    sLng += ring[i]![0]!
    sLat += ring[i]![1]!
    n++
  }
  return { lat: sLat / n, lng: sLng / n }
}

/** Closed ring — lng/lat, 32 segments default (reads round on 3D map). */
export function circleRing(lat: number, lng: number, radiusM: number, segments = 32): FootprintRing {
  const mPerDegLat = 111_320
  const mPerDegLng = 111_320 * Math.cos((lat * Math.PI) / 180)
  const ring: FootprintRing = []
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * 2 * Math.PI
    ring.push([
      lng + (radiusM * Math.sin(a)) / mPerDegLng,
      lat + (radiusM * Math.cos(a)) / mPerDegLat,
    ])
  }
  return ring
}

/** TAS permit blob → tower core circle (~48% of bbox half, 14–22 m). */
export function tasTowerCirclePart(
  lat: number,
  lng: number,
  tasHalfM: number,
  floors?: number,
): { ring: FootprintRing; floors?: number; circular: true; radiusM: number } {
  const radiusM = Math.min(Math.max(tasHalfM * 0.48, 14), 22)
  return {
    ring: circleRing(lat, lng, radiusM),
    ...(floors ? { floors } : {}),
    circular: true,
    radiusM,
  }
}
