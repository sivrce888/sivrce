/**
 * Runnable check: npx tsx src/lib/walk-score.check.ts
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { amenityBbox, amenityMeters, hasNeighborhoodSignal, scoreFromAmenities } from './walk-score'
import { estimateMonthlyRent, grossYieldPct } from './finance'
import { parseSearchHistory } from './search-history'

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
const box = amenityBbox(52.52, 13.405).split(',').map(Number)
assert.equal(box.length, 4)
assert.ok(Math.abs(box[0]! - 13.397) < 1e-6)
assert.ok(Math.abs(box[1]! - 52.512) < 1e-6)
assert.ok(Math.abs(box[2]! - 13.413) < 1e-6)
assert.ok(Math.abs(box[3]! - 52.528) < 1e-6)

assert.equal(estimateMonthlyRent(200_000), 1000)
assert.equal(estimateMonthlyRent(0), 0)
assert.equal(grossYieldPct(200_000, 1000), 6)
assert.equal(grossYieldPct(0, 1000), 0)

const listingI18n = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../components/listing/i18n.ts'),
  'utf8',
)
for (const key of [
  'walkTitle',
  'walkWalk',
  'walkTransit',
  'walkBike',
  'walkParadise',
  'walkVery',
  'walkSome',
  'walkCar',
  'walkAlmost',
  'yieldEst',
  'yieldRent',
]) {
  assert.equal(listingI18n.split(`${key}:`).length - 1, 10, `${key} must exist in all 10 locales`)
}

assert.equal(parseSearchHistory(null).length, 0)
assert.equal(parseSearchHistory('not-json').length, 0)
assert.equal(parseSearchHistory('[{}]').length, 0)
assert.equal(
  parseSearchHistory(
    JSON.stringify([{ query: 'vake', filters: 'city=vake', label: 'Vake', timestamp: 1 }]),
  ).length,
  1,
)

console.log('walk-score.check: ok')
