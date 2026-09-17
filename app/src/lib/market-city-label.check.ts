/**
 * Runnable check: npx tsx src/lib/market-city-label.check.ts
 *
 * `market-city-label.ts` is a hand-kept leaf that exists so the always-mounted
 * chrome never imports the 88 KB city catalog. A leaf can drift. This asserts
 * it does not: every market default city is present, every label matches the
 * catalog exactly, and nothing extra rides along.
 */
import assert from 'node:assert/strict'
import { COUNTRY_IDS, MARKETS } from './markets'
import { cityBySlug } from './map/user-place'
import { MARKET_CITY_LABEL, marketCityLabel } from './market-city-label'

const needed = new Set<string>(['tbilisi'])
for (const id of COUNTRY_IDS) needed.add(MARKETS[id].defaultCitySlug)

for (const slug of needed) {
  const row = MARKET_CITY_LABEL[slug]
  assert.ok(row, `market-city-label: missing default city '${slug}' — chrome would render an empty label`)
  const city = cityBySlug(slug)
  assert.ok(city, `market-city-label: '${slug}' is not in the city catalog — bad defaultCitySlug in markets.ts`)
  assert.equal(row[0], city.ka, `market-city-label: ka drift for '${slug}' (catalog says '${city.ka}')`)
  assert.equal(row[1], city.en, `market-city-label: en drift for '${slug}' (catalog says '${city.en}')`)
}

// No dead rows: an unused label is 60 bytes shipped to every page for nothing.
for (const slug of Object.keys(MARKET_CITY_LABEL)) {
  assert.ok(needed.has(slug), `market-city-label: '${slug}' is no market default — delete the row`)
}

assert.equal(marketCityLabel('tbilisi', 'ka'), 'თბილისი')
assert.equal(marketCityLabel('tbilisi', 'en'), 'Tbilisi')
assert.equal(marketCityLabel('tbilisi', 'ru'), 'Tbilisi', 'non-ka locales fall back to the latin label')
assert.equal(marketCityLabel(null, 'ka'), '')
assert.equal(marketCityLabel('not-a-city', 'en'), '', 'unknown slug must be empty, never the raw slug')

console.log(`market-city-label: ${needed.size} default cities, 0 drift ✓`)
