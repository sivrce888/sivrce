/**
 * Weather lock — fails the build if the badge's data guarantees regress.
 * Run: npx tsx src/lib/weather.check.ts
 */
import assert from 'node:assert/strict'
import { LANGS } from './i18n/core'
import { CITIES } from './seo-pages'
import { GEO_REGIONS, geoMuniSeat } from '../data/georgia-locations'
import { cityByName } from './map/user-place.server'
import {
  aqiBand,
  CITY_COORDS,
  cityCoords,
  GE_TOWN_COORDS,
  parseWeatherBatch,
  parseWeatherDetail,
  wmoLabel,
  weatherIcon,
  type WeatherIconName,
} from './weather'

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

// European AQI banding — EU scale collapsed to 4 bands, boundaries inclusive.
assert.equal(aqiBand(0), 'good')
assert.equal(aqiBand(40), 'good')
assert.equal(aqiBand(41), 'moderate')
assert.equal(aqiBand(60), 'moderate')
assert.equal(aqiBand(61), 'poor')
assert.equal(aqiBand(80), 'poor')
assert.equal(aqiBand(81), 'bad')
assert.equal(aqiBand(150), 'bad')

// ── Canonical forecast parser — the contract every weather surface derives from. ──
const HOURS = 40
const at = (h: number) => `2026-09-26T${String(h % 24).padStart(2, '0')}:00`
const PAYLOAD = {
  current: {
    time: '2026-09-26T14:30',
    temperature_2m: 23.4,
    apparent_temperature: 24.9,
    relative_humidity_2m: 61.7,
    weather_code: 61,
    wind_speed_10m: 12.6,
  },
  daily: {
    time: ['2026-09-26', '2026-09-27', '2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02'],
    weather_code: [61, 80, 3, 0, 0, 2, 61],
    temperature_2m_max: [26.8, 28.1, 27.4, 29.9, 30.2, 28.6, 24.0],
    temperature_2m_min: [17.2, 16.8, 18.0, 19.1, 18.4, 17.9, 15.5],
    sunrise: Array.from({ length: 7 }, (_, i) => `2026-09-${26 + i}T07:32`),
    sunset: Array.from({ length: 7 }, (_, i) => `2026-09-${26 + i}T20:15`),
    uv_index_max: [5.4, 6, 6, 7, 7, 6, 4],
    precipitation_probability_max: [80, 20, 0, 5, 10, 0, 90],
  },
  hourly: {
    time: Array.from({ length: HOURS }, (_, i) => at(i)),
    temperature_2m: Array.from({ length: HOURS }, (_, i) => 20 + (i % 24) / 10),
    weather_code: Array.from({ length: HOURS }, () => 61),
    precipitation_probability: Array.from({ length: HOURS }, (_, i) => (i < 24 ? 40 : 10)),
  },
}

const d = parseWeatherDetail(PAYLOAD, 'ka')
assert.ok(d, 'canonical payload must parse')
assert.equal(d!.temp, 23)
assert.equal(d!.feels, 25)
assert.equal(d!.code, 61)
assert.equal(d!.label, 'წვიმა')
assert.equal(d!.humidity, 62)
assert.equal(d!.wind, 13)
assert.equal(d!.hi, 27)
assert.equal(d!.lo, 17)
assert.equal(d!.pop, 80)
assert.equal(d!.uv, 5)
assert.equal(d!.sunrise, '07:32')
assert.equal(d!.sunset, '20:15')
// hourly window opens at the first slot ≥ now (14:30 → 15:00) and spans 24 h.
assert.equal(d!.hourly.length, 24)
assert.equal(d!.hourly[0]!.t, '15:00')
assert.equal(d!.hourly[0]!.pop, 40)
assert.equal(d!.days.length, 7)
assert.equal(d!.days[0]!.hi, 27)
assert.equal(d!.days[6]!.pop, 90)

// Missing/malformed payloads → null, never a throw (decorative surface).
assert.equal(parseWeatherDetail(null), null)
assert.equal(parseWeatherDetail({}), null)
assert.equal(parseWeatherDetail({ current: { temperature_2m: 1, weather_code: 0 } }), null)
assert.equal(
  parseWeatherDetail({ current: PAYLOAD.current, daily: {} }),
  null,
  'daily.time array is required',
)

// Batch parser: array response, single-object response, short arrays → nulls.
const batch = parseWeatherBatch([PAYLOAD, PAYLOAD], 'en')
assert.equal(batch.length, 2)
assert.equal(batch[0]!.temp, 23)
assert.equal(batch[0]!.label, 'Rain')
assert.equal(parseWeatherBatch(PAYLOAD).length, 1)
assert.deepEqual(parseWeatherBatch(null), [null])
assert.deepEqual(parseWeatherBatch([PAYLOAD, null], 'en'), [batch[0], null])

console.log('weather.check ok — parser, batch, WMO space, AQI bands')

// ── Coverage lock — EVERY location-catalog place resolves to coords, so no
//    chip on the locations index ever renders blind. Same chain as wxPoints:
//    map-city corpus → registered CITIES → GE_TOWN_COORDS. ──
const slugByKa = new Map(CITIES.map((c) => [c.ka, c.slug]))
const resolves = (name: string): boolean =>
  cityByName(name) !== null ||
  (slugByKa.has(name) && cityCoords(slugByKa.get(name)) !== undefined) ||
  GE_TOWN_COORDS[name] !== undefined
let places = 0
for (const r of Object.keys(GEO_REGIONS)) {
  for (const city of GEO_REGIONS[r]!.cities) {
    places++
    assert.ok(resolves(city), `no weather coords for city ${city}`)
  }
  for (const m of GEO_REGIONS[r]!.munis) {
    const seat = geoMuniSeat(m)
    if (!seat) continue
    places++
    assert.ok(resolves(seat), `no weather coords for muni seat ${seat}`)
  }
}
assert.ok(Object.keys(GE_TOWN_COORDS).length > 0)

console.log(`weather.check ok — ${places} catalog places resolved, parser + batch + WMO + AQI locks hold`)
