/**
 * Runnable check: npx tsx src/lib/map/footprint-pin.check.ts
 * Exact-building pin — ringLabelPoint (pole of inaccessibility) + footprintPin.
 */
import assert from 'node:assert/strict'
import { footprintPin, ringLabelPoint, haversineM } from './buildings'
import { ringContains } from './pick-building'

// L-shape: vertex average lands in the inner notch, label point stays inside.
const lRing: [number, number][] = [
  [44.79, 41.72],
  [44.81, 41.72],
  [44.81, 41.725],
  [44.795, 41.725],
  [44.795, 41.73],
  [44.79, 41.73],
]
const avg = lRing
  .reduce((a, p) => [a[0] + p[0], a[1] + p[1]], [0, 0])
  .map((v) => v / lRing.length) as [number, number]
assert.ok(!ringContains(lRing, avg[0], avg[1]), 'L-shape vertex avg sits in the notch')
const lp = ringLabelPoint(lRing)
assert.ok(ringContains(lRing, lp.lng, lp.lat), 'label point inside the walls')

// Square ring → dead center.
const sq = ringLabelPoint([
  [44.79, 41.72],
  [44.81, 41.72],
  [44.81, 41.73],
  [44.79, 41.73],
])
assert.ok(Math.abs(sq.lat - 41.725) < 2e-5, `square lat center (${sq.lat})`)
assert.ok(Math.abs(sq.lng - 44.8) < 2e-5, `square lng center (${sq.lng})`)

// next-downtown (Batumi): catalog coords are a street geocode ~60m off the real
// complex; the hand-drawn bldg-* ring is a 2-storey neighbour (osmId 0). The
// verified dev-* OSM ring (way 323193015) must win and the pin must move inside.
const at = { lat: 41.64779326, lng: 41.64314032 }
const pin = footprintPin({ slug: 'next-downtown' }, at)
assert.ok(pin, 'next-downtown footprint pin resolves')
assert.ok(pin!.ring.length >= 5, 'ring present')
assert.equal(pin!.ring[0]![0], 41.643539, 'verified OSM ring wins over hand-drawn neighbour')
assert.ok(ringContains(pin!.ring, pin!.lng, pin!.lat), 'pin inside its own ring')
assert.ok(haversineM(at.lat, at.lng, pin!.lat, pin!.lng) > 30, 'pin moved off the street geocode')
assert.equal(footprintPin({ slug: 'no-such-building' }, at), null, 'unknown slug → null')

console.log('footprint-pin: ok')
