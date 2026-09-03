import assert from 'node:assert/strict'
import { circleRing, ringBboxHalfM, tasTowerCirclePart } from './footprint-circle'

const ring = circleRing(41.74935, 44.76901, 18)
assert.equal(ring[0]![0], ring[ring.length - 1]![0])
assert.ok(ring.length >= 33)
const half = ringBboxHalfM(ring)
assert.ok(half >= 17 && half <= 19, `circle half ${half}`)

const tower = tasTowerCirclePart(41.74935, 44.76901, 40, 36)
assert.equal(tower.circular, true)
assert.equal(tower.floors, 36)
assert.ok(tower.radiusM >= 14 && tower.radiusM <= 22)

console.log('footprint-circle.check: ok')
