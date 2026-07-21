/**
 * Self-check for footprint ring helpers.
 * Run: npx tsx src/lib/map/pick-building.check.ts
 */

import assert from 'node:assert/strict'
import {
  closeRing,
  FALLBACK_FOOTPRINT_ASPECT,
  FALLBACK_FOOTPRINT_HALF_M,
  geometryRing,
  pickHighlightPolygon,
  pickNearestBuildingGeometry,
  ringCentroid,
  ringContains,
  snapPick,
} from './pick-building'

const open: [number, number][] = [
  [44.77, 41.7],
  [44.771, 41.7],
  [44.771, 41.701],
  [44.77, 41.701],
]
const closed = closeRing(open)
assert.equal(closed.length, 5)
assert.deepEqual(closed[0], closed[4])
assert.deepEqual(closeRing(closed), closed)

const poly: GeoJSON.Polygon = { type: 'Polygon', coordinates: [closed] }
assert.equal(geometryRing(poly)?.length, 5)

const c = ringCentroid(closed)
assert.ok(c.lng > 44.77 && c.lng < 44.771)
assert.ok(c.lat > 41.7 && c.lat < 41.701)

const snapped = snapPick({ lat: 41.7001, lng: 44.7701 }, poly)
assert.ok(Math.abs(snapped.lat - c.lat) < 1e-9)
assert.ok(Math.abs(snapped.lng - c.lng) < 1e-9)

// MultiPolygon → largest outer (Beliashvili-style split wing)
const small: [number, number][] = [
  [44.778, 41.77],
  [44.7781, 41.77],
  [44.7781, 41.7701],
  [44.778, 41.7701],
  [44.778, 41.77],
]
// ~52×63 m apartments @ Beliashvili 68 (way/827825763), simplified
const big: [number, number][] = [
  [44.77845, 41.77050],
  [44.77907, 41.77050],
  [44.77907, 41.77107],
  [44.77845, 41.77107],
  [44.77845, 41.77050],
]
const multi: GeoJSON.MultiPolygon = {
  type: 'MultiPolygon',
  coordinates: [[small], [big]],
}
assert.deepEqual(geometryRing(multi), big)

// Curb pin ~33 m from building center → still pick apartments over shed
const shed: GeoJSON.Polygon = {
  type: 'Polygon',
  coordinates: [
    [
      [44.77940, 41.77040],
      [44.77952, 41.77040],
      [44.77952, 41.77053],
      [44.77940, 41.77053],
      [44.77940, 41.77040],
    ],
  ],
}
const apt: GeoJSON.Polygon = { type: 'Polygon', coordinates: [big] }
const curb = { lat: 41.770564, lng: 44.779028 }
const picked = pickNearestBuildingGeometry([shed, apt], curb.lat, curb.lng)
assert.equal(picked, apt)

// Pin inside apartments → contain wins even if shed centroid is closer
const insideApt = { lat: 41.77078, lng: 44.77876 }
assert.equal(ringContains(big, insideApt.lng, insideApt.lat), true)
assert.equal(ringContains(shed.coordinates[0] as [number, number][], insideApt.lng, insideApt.lat), false)
const contained = pickNearestBuildingGeometry([shed, apt], insideApt.lat, insideApt.lng)
assert.equal(contained, apt)

const hl = pickHighlightPolygon(curb.lat, curb.lng, null)
assert.equal(hl.geometry.type, 'Polygon')
const ring = hl.geometry.coordinates[0]!
const w =
  (ring[1]![0]! - ring[0]![0]!) *
  111_320 *
  Math.cos((curb.lat * Math.PI) / 180)
const h = (ring[2]![1]! - ring[1]![1]!) * 111_320
assert.ok(Math.abs(h - FALLBACK_FOOTPRINT_HALF_M * 2) < 0.5)
assert.ok(Math.abs(w / h - FALLBACK_FOOTPRINT_ASPECT) < 0.05)

console.log('pick-building.check: ok')
