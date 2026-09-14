/**
 * Runnable check: tsx src/data/georgia-locations.check.ts
 *
 * LocationPicker (client) reads districts from this catalog instead of
 * data/listings, which kept the ~1.1 MB LISTINGS array out of the browser
 * bundle. That swap is only safe while the catalog is a superset of every
 * district our inventory actually uses — this check is that lock.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { LISTINGS, districtsOf } from './listings'
import { GEO_ALL_PLACES, GEO_CITIES, geoDistrictsOf } from './georgia-locations'

assert.ok(GEO_CITIES.length > 50, `expected a real city catalog, got ${GEO_CITIES.length}`)
assert.ok(GEO_ALL_PLACES.length >= GEO_CITIES.length)

// ——— superset lock: every district reachable from inventory is in the catalog ———
const cities = new Set(LISTINGS.filter((l) => !l.country || l.country === 'GE').map((l) => l.city))
for (const city of [undefined, ...cities]) {
  const geo = geoDistrictsOf(city)
  const missing = districtsOf(city).filter((d) => !geo.includes(d))
  assert.deepEqual(
    missing,
    [],
    `${city ?? '(all cities)'}: districts missing from georgia-locations.json — ` +
      `add them there or LocationPicker silently drops them`,
  )
}

// ——— bundle lock ———
const picker = readFileSync(
  new URL('../components/search/LocationPicker.tsx', import.meta.url),
  'utf8',
)
assert.ok(
  !/from\s+['"]@\/data\/listings['"]/.test(picker.replace(/import\s+type[^\n]*\n/g, '')),
  'LocationPicker must not value-import @/data/listings (ships the catalog to the browser)',
)

console.log(
  `georgia-locations.check: ok — ${GEO_CITIES.length} cities, ${geoDistrictsOf().length} districts`,
)
