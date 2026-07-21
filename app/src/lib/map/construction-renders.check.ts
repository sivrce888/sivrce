/**
 * Self-check for construction 3D local meters.
 * Run: npx tsx src/lib/map/construction-renders.check.ts
 */

import assert from 'node:assert/strict'
import { ringToLocalEN } from './construction-renders'

const origin = { lat: 41.7151, lng: 44.8271 }
const ring: [number, number][] = [
  [44.8271, 41.7151],
  [44.8272, 41.7151],
  [44.8272, 41.7152],
  [44.8271, 41.7152],
  [44.8271, 41.7151],
]
const pts = ringToLocalEN(ring, origin.lat, origin.lng)
assert.equal(pts.length, 4)
assert.ok(Math.abs(pts[0]!.x) < 1e-6)
assert.ok(Math.abs(pts[0]!.y) < 1e-6)
assert.ok(pts[1]!.x > 5 && pts[1]!.x < 15) // ~8–11 m east
assert.ok(pts[2]!.y > 5 && pts[2]!.y < 15)

console.log('construction-renders.check: ok')
