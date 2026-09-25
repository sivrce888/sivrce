/**
 * Runnable check: tsx src/data/georgia-streets.check.ts
 *
 * Locks the Georgia street catalog (server-only, feeds /api/suggest):
 * keys are real catalog cities, entries are Georgian-script street names,
 * no locative-form city noise ('აბასთუმანში'), no per-city duplicates,
 * and Tbilisi stays out (owned by tbilisi-streets.ts).
 */
import assert from 'node:assert/strict'
import data from './georgia-streets.json'
import { GEO_CITIES } from './georgia-locations'

const STREETS = data.streets as Record<string, string[]>
const CITIES = new Set(GEO_CITIES)

assert.ok(Object.keys(STREETS).length >= 80, `expected ≥80 streetful cities, got ${Object.keys(STREETS).length}`)
const total = Object.values(STREETS).reduce((n, v) => n + v.length, 0)
assert.ok(total >= 8000, `expected a real street catalog, got ${total}`)

for (const [city, names] of Object.entries(STREETS)) {
  assert.ok(city !== 'თბილისი', 'თბილისი streets belong to tbilisi-streets.ts, not georgia-streets.json')
  assert.ok(CITIES.has(city), `street key not a catalog city: ${city}`)
  assert.ok(names.length > 0, `empty street list for ${city} — drop the key`)
  assert.equal(new Set(names).size, names.length, `duplicate street in ${city}`)
  for (const ka of names) {
    assert.ok(/[\u10a0-\u10ff]/.test(ka), `${city}: non-Georgian street name '${ka}'`)
    assert.ok(ka !== city + 'ში' && ka !== city + 'ზე', `${city}: locative city name posing as street '${ka}'`)
    assert.ok(ka.length >= 2 && ka.length <= 120, `${city}: implausible street length '${ka}'`)
  }
}

console.log(
  `georgia-streets.check: ok — ${Object.keys(STREETS).length} cities, ${total} streets`,
)
