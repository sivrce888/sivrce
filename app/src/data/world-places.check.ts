/**
 * Run: npx tsx src/data/world-places.check.ts
 */
import assert from 'node:assert/strict'
import { WORLD_PLACES } from './world-places'
import { MAP_CITIES } from '@/lib/map/user-place'
import { countryOf } from '@/lib/place-context'

const slugs = new Set<string>()
const ccs = new Set<string>()
for (const w of WORLD_PLACES) {
  assert.ok(w.slug && w.en && w.cc.length === 2, `row ${w.slug}`)
  assert.ok(Number.isFinite(w.lat) && Number.isFinite(w.lng), `coords ${w.slug}`)
  assert.ok(!slugs.has(w.slug), `dup world slug ${w.slug}`)
  slugs.add(w.slug)
  ccs.add(w.cc)
}

const mapSlugs = new Set(MAP_CITIES.map((c) => c.slug))
assert.ok(mapSlugs.has('vienna'))
assert.ok(mapSlugs.has('singapore'))
assert.ok(mapSlugs.has('sydney'))
assert.ok(mapSlugs.has('nairobi'))
assert.ok(mapSlugs.has('baku'))
assert.ok(mapSlugs.has('washington'))
assert.ok(mapSlugs.has('wellington'))
assert.equal(MAP_CITIES[0]!.slug, 'tbilisi')
assert.ok(MAP_CITIES.length >= 200)

assert.equal(countryOf('FR').en, 'France')
assert.equal(countryOf('AE').en, 'UAE')
assert.ok((countryOf('GE').ka ?? '').length > 2)
assert.ok((countryOf('SG').en ?? '').toLowerCase().includes('singapore'))

console.log(
  `world-places.check: ${WORLD_PLACES.length} places, ${ccs.size} countries, MAP_CITIES=${MAP_CITIES.length} ok`,
)
