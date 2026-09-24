/**
 * Runnable check: npx tsx src/lib/place-label.check.ts
 */
import assert from 'node:assert/strict'
import { listingTitle, placeLabel } from './place-label'
import { CITY_NAMES, CITY_NAME_ALIASES } from './city-names.gen'
import { CITY_ALIASES, MAP_CITIES, cityByName } from './map/user-place'

// The leaf must mirror the catalog, or cards mislabel cities silently.
assert.deepEqual(
  CITY_NAMES.map((r) => [...r]),
  MAP_CITIES.map((c) => [c.slug, c.ka, c.en]),
  'city-names.gen.ts drifted from MAP_CITIES — run: npx tsx scripts/gen-city-names.ts',
)
assert.deepEqual({ ...CITY_NAME_ALIASES }, CITY_ALIASES, 'city-names.gen.ts aliases drifted — rerun scripts/gen-city-names.ts')
// Leaf lookup ≡ catalog lookup, including aliases and first-match precedence.
for (const q of [...MAP_CITIES.flatMap((c) => [c.slug, c.ka, c.en.toUpperCase()]), ...Object.keys(CITY_ALIASES), 'Nowhere', ' ']) {
  const want = cityByName(q)
  const label = placeLabel(q, 'en')
  if (want) assert.equal(label, want.en, `placeLabel(${q}) must match cityByName`)
}

assert.equal(placeLabel('ბერლინი', 'en'), 'Berlin')
assert.equal(placeLabel('Berlin', 'en'), 'Berlin')
assert.equal(placeLabel('Berlin', 'ka'), 'ბერლინი')
assert.equal(placeLabel('თბილისი', 'en'), 'Tbilisi')
assert.equal(placeLabel('მიტე', 'en', 'DE'), '')
assert.equal(placeLabel('მიტე', 'ka', 'DE'), 'მიტე')
assert.equal(placeLabel('ვაკე', 'en', 'GE'), 'ვაკე')
assert.equal(
  listingTitle('Quartier Lilienthal — ბერლინი', 'ბერლინი', 'en'),
  'Quartier Lilienthal — Berlin',
)
assert.equal(listingTitle('ბინა ვაკეში', 'თბილისი', 'en'), 'ბინა ვაკეში')
// Authored Mkhedruli titles stay verbatim — no mid-string city swap that
// breaks Georgian grammar (ქუთაისის → Kutaisiს).
const kaHotelTitle = 'ძველი თბილისი — ბუტიკ სასტუმრო, დღიური'
assert.equal(listingTitle(kaHotelTitle, 'თბილისი', 'en'), kaHotelTitle)
assert.equal(listingTitle('სტუდიო ქუთაისის ცენტრში დღიურად', 'ქუთაისი', 'en'), 'სტუდიო ქუთაისის ცენტრში დღიურად')
assert.equal(listingTitle('Batumi — სასტუმრო 500 მ²', 'ბათუმი', 'en'), 'Batumi — სასტუმრო 500 მ²')

console.log('place-label.check: ok')
