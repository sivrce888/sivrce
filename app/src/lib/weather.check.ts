/**
 * Weather lock — fails the build if the badge's data guarantees regress.
 * Run: npx tsx src/lib/weather.check.ts
 */
import assert from 'node:assert/strict'
import { LANGS } from './i18n/core'
import { CITIES } from './seo-pages'
import { CITY_COORDS, cityCoords, wmoLabel, weatherIcon, type WeatherIconName } from './weather'

// Every registered city resolves to coordinates — city pages never render blind.
for (const c of CITIES) {
  assert.ok(cityCoords(c.slug), `cityCoords(${c.slug}) missing`)
  assert.ok(CITY_COORDS[c.slug], `CITY_COORDS[${c.slug}] missing`)
}
assert.equal(cityCoords('not-a-city'), undefined)
assert.equal(cityCoords(undefined), undefined)

// Full WMO space (0–99) yields a non-empty label in all 10 locales and a valid icon.
const ICONS: readonly WeatherIconName[] = [
  'sun', 'cloud-sun', 'cloud', 'cloud-fog', 'cloud-drizzle',
  'cloud-rain', 'cloud-snow', 'snowflake', 'cloud-lightning', 'thermometer',
]
for (let code = 0; code <= 99; code++) {
  assert.ok(ICONS.includes(weatherIcon(code)), `icon uncovered for WMO ${code}`)
  for (const lang of LANGS) assert.ok(wmoLabel(code, lang).length > 0, `label ${lang} empty for WMO ${code}`)
}
// Spot-check group boundaries (drizzle→fog→rain→snow→shower→storm).
assert.equal(wmoLabel(0, 'ka'), 'ნათელი')
assert.equal(wmoLabel(48, 'en'), 'Fog')
assert.equal(wmoLabel(67, 'ru'), 'Дождь')
assert.equal(wmoLabel(77, 'en'), 'Snow')
assert.equal(wmoLabel(82, 'ka'), 'წვიმა')
assert.equal(wmoLabel(99, 'en'), 'Thunderstorm')

console.log(`weather.check ok — ${CITIES.length} cities, 100 WMO codes × ${LANGS.length} locales`)
