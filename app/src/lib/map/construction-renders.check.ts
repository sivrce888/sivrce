/**
 * Self-check for construction render bbox coords.
 * Run: npx tsx src/lib/map/construction-renders.check.ts
 */

import assert from 'node:assert/strict'
import { ringToImageCoords } from './pick-building'

const ring: [number, number][] = [
  [44.77, 41.7],
  [44.772, 41.7],
  [44.772, 41.702],
  [44.77, 41.702],
  [44.77, 41.7],
]
const [nw, ne, se, sw] = ringToImageCoords(ring)
assert.deepEqual(nw, [44.77, 41.702])
assert.deepEqual(ne, [44.772, 41.702])
assert.deepEqual(se, [44.772, 41.7])
assert.deepEqual(sw, [44.77, 41.7])

console.log('construction-renders.check: ok')
