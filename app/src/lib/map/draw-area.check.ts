/**
 * Runnable self-check: drawn-area geometry.
 * Run: npx tsx src/lib/map/draw-area.check.ts
 */

import assert from 'node:assert/strict'
import {
  isDrawableRing,
  pointInRing,
  ringToGeoJSON,
  thinPath,
  type LngLat,
} from './draw-area'

// A box over central Tbilisi.
const box: LngLat[] = [
  [44.78, 41.7],
  [44.82, 41.7],
  [44.82, 41.73],
  [44.78, 41.73],
]

assert.equal(pointInRing(box, 44.8, 41.715), true, 'inside the box')
assert.equal(pointInRing(box, 44.77, 41.715), false, 'west of the box')
assert.equal(pointInRing(box, 44.8, 41.75), false, 'north of the box')
// Half-open edges: south/west belong to the shape, north/east do not, so two
// areas sharing a border never claim the same building twice.
assert.equal(pointInRing(box, 44.8, 41.7), true, 'south edge belongs to the shape')
assert.equal(pointInRing(box, 44.8, 41.73), false, 'north edge belongs to the neighbour')

// Concave: the whole point of drawing instead of a radius.
const u: LngLat[] = [
  [0, 0],
  [4, 0],
  [4, 4],
  [3, 4],
  [3, 1],
  [1, 1],
  [1, 4],
  [0, 4],
]
assert.equal(pointInRing(u, 0.5, 3), true, 'left arm of the U')
assert.equal(pointInRing(u, 2, 3), false, 'the notch is outside')
assert.equal(pointInRing(u, 2, 0.5), true, 'base of the U')

// A tap, a line and a zero-area ring are not searchable areas.
assert.equal(isDrawableRing([]), false)
assert.equal(isDrawableRing([[44.8, 41.7]]), false)
assert.equal(
  isDrawableRing([
    [44.8, 41.7],
    [44.81, 41.7],
  ]),
  false,
)
assert.equal(
  isDrawableRing([
    [44.8, 41.7],
    [44.81, 41.7],
    [44.82, 41.7],
  ]),
  false,
  'collinear points enclose nothing',
)
assert.equal(isDrawableRing(box), true)
assert.equal(pointInRing([[44.8, 41.7]], 44.8, 41.7), false, 'degenerate ring holds nothing')

// Thinning keeps the shape, drops the jitter.
const path = Array.from({ length: 20 }, (_, i) => ({ x: i, y: 0 }))
assert.deepEqual(
  thinPath(path, 8).map((p) => p.x),
  [0, 8, 16],
)
assert.equal(thinPath([], 8).length, 0)
assert.equal(thinPath([{ x: 3, y: 3 }], 8).length, 1, 'first sample always kept')

// GeoJSON closes the ring; a non-area clears the layer instead of drawing junk.
const fc = ringToGeoJSON(box)
const coords = (fc.features[0]!.geometry as GeoJSON.Polygon).coordinates[0]!
assert.equal(coords.length, box.length + 1)
assert.deepEqual(coords[0], coords[coords.length - 1], 'ring closed')
assert.equal(ringToGeoJSON(null).features.length, 0)
assert.equal(ringToGeoJSON([[1, 1]]).features.length, 0)
assert.equal(
  (ringToGeoJSON([...box, box[0]!].slice()).features[0]!.geometry as GeoJSON.Polygon)
    .coordinates[0]!.length,
  box.length + 1,
  'already-closed ring is not closed twice',
)

console.log('draw-area.check: ok')
