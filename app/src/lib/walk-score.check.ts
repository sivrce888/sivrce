/**
 * Runnable check: npx tsx src/lib/walk-score.check.ts
 */
import assert from 'node:assert/strict'
import { amenityBbox, amenityMeters, hasNeighborhoodSignal, scoreFromAmenities } from './walk-score'
import { estimateMonthlyRent, grossYieldPct } from './finance'

const empty = scoreFromAmenities([])
assert.equal(empty.walk, 0)
assert.equal(empty.transit, 0)
assert.equal(empty.bike, 0)
assert.equal(hasNeighborhoodSignal(empty), false)

const loadingLie = scoreFromAmenities([])
assert.notEqual(loadingLie.walk, 25, 'empty must not floor at Walk Score 25')

const dense = scoreFromAmenities([
  { category: 'metro', meters: 200 },
  { category: 'bus', meters: 80 },
  { category: 'shop', meters: 120 },
  { category: 'pharmacy', meters: 90 },
  { category: 'school', meters: 400 },
  { category: 'park', meters: 250 },
  { category: 'tram', meters: 300 },
])
assert.equal(dense.walk, 100)
assert.equal(dense.transit, 75)
assert.equal(dense.bike, 100)
assert.equal(hasNeighborhoodSignal(dense), true)

const dupBuses = scoreFromAmenities([
  { category: 'bus', meters: 50 },
  { category: 'bus', meters: 80 },
  { category: 'bus', meters: 120 },
])
assert.equal(dupBuses.transit, 25, 'duplicate category must not inflate score')

assert.ok(amenityMeters(41.7151, 44.8271, 41.7151, 44.8271) < 1)
assert.ok(amenityMeters(41.7151, 44.8271, 41.722, 44.8271) > 700)
assert.match(amenityBbox(52.52, 13.405), /13\.397,52\.512,13\.413,52\.528/)

assert.equal(estimateMonthlyRent(200_000), 1000)
assert.equal(estimateMonthlyRent(0), 0)
assert.equal(grossYieldPct(200_000, 1000), 6)
assert.equal(grossYieldPct(0, 1000), 0)

console.log('walk-score.check: ok')
