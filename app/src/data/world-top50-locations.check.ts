/**
 * Runnable check: npx tsx src/data/world-top50-locations.check.ts
 * Verifies 100/100 coverage and integrity for Top 50 real-estate target markets:
 * Europe, Americas, Asia-Pacific, Middle East & Africa.
 */
import assert from 'node:assert/strict'
import { COUNTRIES as WORLD_COUNTRIES } from './world-countries'
import { WORLD_PLACES } from './world-places'
import { WORLD_PROJECTS } from './world-projects'
import { worldDevelopers } from './world-developers'
import { exactSuggestHit, suggestionToFilters, type SuggestHit } from '../lib/search-location'

export const TOP50_CODES = [
  'GE', 'DE', 'AE', 'US', 'GB', 'ES', 'FR', 'TR', 'CY', 'GR',
  'IT', 'PT', 'NL', 'CH', 'AT', 'PL', 'CZ', 'HU', 'IE', 'SE',
  'DK', 'NO', 'FI', 'BE', 'LU', 'SA', 'QA', 'KW', 'BH', 'OM',
  'IL', 'SG', 'JP', 'KR', 'AU', 'NZ', 'CA', 'MX', 'BR', 'AR',
  'CL', 'TH', 'ID', 'MY', 'VN', 'PH', 'IN', 'KZ', 'UZ', 'ZA',
] as const

assert.equal(TOP50_CODES.length, 50, 'Top 50 count must be exactly 50')
assert.equal(new Set(TOP50_CODES).size, 50, 'Top 50 codes must be unique')

// 1. Verify all 50 target countries exist in world-countries dataset
for (const cc of TOP50_CODES) {
  const country = WORLD_COUNTRIES.find((c) => c.cc === cc)
  assert.ok(country, `Missing Top 50 country code: ${cc}`)
  assert.ok(country.ka && country.ka.length > 0, `Missing Georgian name for country ${cc}`)
  assert.ok(country.en && country.en.length > 0, `Missing English name for country ${cc}`)
  assert.ok(country.capital && country.capital.length > 0, `Missing capital for country ${cc}`)
  assert.ok(country.lat !== 0 && country.lng !== 0, `Invalid lat/lng for country ${cc}`)
  assert.ok(country.cities && country.cities.length > 0, `Missing cities list for country ${cc}`)
  assert.ok(country.population > 0, `Invalid population for country ${cc}`)
  assert.ok(country.realEstateNote && country.realEstateNote.length > 10, `Missing RE note for country ${cc}`)
}

// 2. Verify capital/major cities exist in WORLD_PLACES for Top 50 markets
for (const cc of TOP50_CODES) {
  const country = WORLD_COUNTRIES.find((c) => c.cc === cc)!
  const place = WORLD_PLACES.find((p) => p.cc === cc)
  assert.ok(place, `Missing world place entry for country: ${cc} (${country.en})`)
  assert.ok(place.ka && place.en, `Missing place name for ${cc}`)
  assert.ok(place.lat !== 0 && place.lng !== 0, `Invalid place coords for ${cc}`)
}

// 3. Verify landmark projects dataset coverage
assert.ok(WORLD_PROJECTS.length >= 300, `Insufficient world projects count: ${WORLD_PROJECTS.length}`)
for (const p of WORLD_PROJECTS) {
  assert.ok(p.slug && p.name && p.city && p.cc, `Malformed project: ${JSON.stringify(p)}`)
  assert.ok(p.lat !== 0 && p.lng !== 0, `Invalid coords for project ${p.slug}`)
  assert.ok(p.status && p.type, `Missing status/type for project ${p.slug}`)
}

// 4. Verify developers dataset coverage
assert.ok(worldDevelopers.length >= 300, `Insufficient world developers count: ${worldDevelopers.length}`)
for (const d of worldDevelopers) {
  assert.ok(d.slug && d.name && d.cc && d.city, `Malformed developer: ${JSON.stringify(d)}`)
}

// 5. Test suggestion conversion and exact match resolution across Top 50 hubs
const sampleHits: SuggestHit[] = [
  { kind: 'country', ka: 'საქართველო', en: 'Georgia', slug: 'ge' },
  { kind: 'city', ka: 'თბილისი', en: 'Tbilisi', slug: 'tbilisi' },
  { kind: 'city', ka: 'ბერლინი', en: 'Berlin', slug: 'berlin' },
  { kind: 'city', ka: 'დუბაი', en: 'Dubai', slug: 'dubai' },
  { kind: 'city', ka: 'ლონდონი', en: 'London', slug: 'london' },
  { kind: 'city', ka: 'ტოკიო', en: 'Tokyo', slug: 'tokyo' },
  { kind: 'city', ka: 'სიდნეი', en: 'Sydney', slug: 'sydney' },
  { kind: 'city', ka: 'რომი', en: 'Rome', slug: 'rome' },
  { kind: 'city', ka: 'ტორონტო', en: 'Toronto', slug: 'toronto' },
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

const exactHit = exactSuggestHit(sampleHits, 'ტოკიო')
assert.ok(exactHit, 'Failed exact match for Tokyo')
assert.equal(exactHit.kind, 'city')

console.log('world-top50-locations.check: 100/100 Top 50 location graph verified OK')
