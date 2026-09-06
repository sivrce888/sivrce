/**
 * Runnable check: npx tsx src/lib/map/footprint-pin.check.ts
 * Exact-building pin — ringLabelPoint (pole of inaccessibility) + footprintPin.
 */
import assert from 'node:assert/strict'
import { footprintPin, ringLabelPoint, haversineM } from './buildings'
import { ringContains } from './pick-building'

// L-shape: vertex average lands inside the cut-out quadrant, label point inside.
const lRing: [number, number][] = [
  [44.79, 41.72],
  [44.82, 41.72],
  [44.82, 41.724],
  [44.794, 41.724],
  [44.794, 41.73],
  [44.79, 41.73],
]
const avg = lRing
  .reduce((a, p) => [a[0] + p[0], a[1] + p[1]], [0, 0])
  .map((v) => v / lRing.length) as [number, number]
assert.ok(
  !ringContains(lRing, avg[0], avg[1]),
  `L-shape vertex avg (${avg[0]}, ${avg[1]}) sits in the cut-out`,
)
const lp = ringLabelPoint(lRing)
assert.ok(ringContains(lRing, lp.lng, lp.lat), 'label point inside the walls')
assert.ok(
  haversineM(lp.lat, lp.lng, avg[1], avg[0]) > 30,
  'label point moved off the vertex average',
)

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
// complex. The verified dev-* ring must win and the pin must move inside; the
// pin sits in official NAPR lot 05.21.48.012 (maps.gov.ge, 2026-09-06 audit).
const at = { lat: 41.64779326, lng: 41.64314032 }
const pin = footprintPin({ slug: 'next-downtown' }, at)
assert.ok(pin, 'next-downtown footprint pin resolves')
assert.ok(pin!.ring.length >= 5, 'ring present')
assert.equal(pin!.ring[0]![0], 41.64318859577179, 'verified ring wins over hand-drawn neighbour')
assert.ok(ringContains(pin!.ring, pin!.lng, pin!.lat), 'pin inside its own ring')
// Catalog coords were snapped onto the verified ring (≤25 m policy) — pin must stay glued.
assert.ok(haversineM(at.lat, at.lng, pin!.lat, pin!.lng) < 30, 'pin glued to snapped catalog pin')
assert.equal(footprintPin({ slug: 'no-such-building' }, at), null, 'unknown slug → null')

console.log('footprint-pin: ok')
