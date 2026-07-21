/**
 * Self-check for footprint ring helpers.
 * Run: npx tsx src/lib/map/pick-building.check.ts
 */

import assert from 'node:assert/strict'
import {
  closeRing,
  geometryRing,
  ringCentroid,
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

console.log('pick-building.check: ok')
