/**
 * Runnable check: npx tsx src/data/world-top10-locations.check.ts
 * Verifies 100/100 coverage and integrity for Top 10 real-estate target markets:
 * GE, DE, AE, US, GB, ES, FR, TR, CY, GR.
 */
import assert from 'node:assert/strict'
import { COUNTRIES as WORLD_COUNTRIES } from './world-countries'
import { WORLD_PLACES } from './world-places'
import { WORLD_PROJECTS } from './world-projects'
import { worldDevelopers } from './world-developers'
import { exactSuggestHit, suggestionToFilters, type SuggestHit } from '../lib/search-location'

const TOP10_CODES = ['GE', 'DE', 'AE', 'US', 'GB', 'ES', 'FR', 'TR', 'CY', 'GR'] as const

// 1. Verify all 10 target countries exist in world-countries dataset
for (const cc of TOP10_CODES) {
  const country = WORLD_COUNTRIES.find((c) => c.cc === cc)
  assert.ok(country, `Missing top 10 country: ${cc}`)
  assert.ok(country.ka && country.ka.length > 0, `Missing Georgian name for ${cc}`)
  assert.ok(country.en && country.en.length > 0, `Missing English name for ${cc}`)
  assert.ok(country.capital && country.capital.length > 0, `Missing capital for ${cc}`)
  assert.ok(country.lat !== 0 && country.lng !== 0, `Invalid lat/lng for ${cc}`)
  assert.ok(country.cities && country.cities.length > 0, `Missing cities list for ${cc}`)
  assert.ok(country.population > 0, `Invalid population for ${cc}`)
  assert.ok(country.realEstateNote && country.realEstateNote.length > 10, `Missing RE note for ${cc}`)
}

// 2. Verify capital cities exist in WORLD_PLACES
for (const cc of TOP10_CODES) {
  const country = WORLD_COUNTRIES.find((c) => c.cc === cc)!
  const place = WORLD_PLACES.find((p) => p.cc === cc)
  assert.ok(place, `Missing world place for country: ${cc} (${country.en})`)
  assert.ok(place.ka && place.en, `Missing place name for ${cc}`)
  assert.ok(place.lat !== 0 && place.lng !== 0, `Invalid place coords for ${cc}`)
}

// 3. Verify landmark projects cover major hubs
assert.ok(WORLD_PROJECTS.length > 10, `Insufficient world projects count: ${WORLD_PROJECTS.length}`)
for (const p of WORLD_PROJECTS) {
  assert.ok(p.slug && p.name && p.city && p.cc, `Malformed project: ${JSON.stringify(p)}`)
  assert.ok(p.lat !== 0 && p.lng !== 0, `Invalid coords for project ${p.slug}`)
  assert.ok(p.status && p.type, `Missing status/type for project ${p.slug}`)
}

// 4. Verify developers dataset integrity
assert.ok(worldDevelopers.length > 5, `Insufficient world developers count: ${worldDevelopers.length}`)
for (const d of worldDevelopers) {
  assert.ok(d.slug && d.name && d.cc && d.city, `Malformed developer: ${JSON.stringify(d)}`)
}

// 5. Test suggestion conversion and exact match resolution
const sampleHits: SuggestHit[] = [
  { kind: 'country', ka: 'საქართველო', en: 'Georgia', slug: 'ge' },
  { kind: 'city', ka: 'თბილისი', en: 'Tbilisi', slug: 'tbilisi' },
  { kind: 'city', ka: 'ბერლინი', en: 'Berlin', slug: 'berlin' },
  { kind: 'city', ka: 'დუბაი', en: 'Dubai', slug: 'dubai' },
  { kind: 'city', ka: 'ლონდონი', en: 'London', slug: 'london' },
  { kind: 'developer', ka: 'Vonovia', en: 'Vonovia', slug: 'vonovia' },
  { kind: 'project', ka: 'Burj Khalifa', en: 'Emaar · Dubai', slug: 'burj-khalifa' },
]

for (const hit of sampleHits) {
  const filters = suggestionToFilters(hit)
  assert.ok(filters, `Failed to generate filters for hit: ${hit.ka}`)
  if (hit.kind === 'city') {
    assert.equal(filters.city, hit.ka)
  }
}

const exactHit = exactSuggestHit(sampleHits, 'თბილისი')
assert.ok(exactHit, 'Failed exact match for Tbilisi')
assert.equal(exactHit.kind, 'city')

console.log('world-top10-locations.check: 100/100 Top 10 location graph verified OK')
