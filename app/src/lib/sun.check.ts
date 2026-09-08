/**
 * Runnable check for the sun model.
 * Run: npx tsx src/lib/sun.check.ts
 *
 * Asserts against well-known astronomy for Tbilisi (41.7151, 44.8271):
 * summer solstice ≈ 05:30→20:35 local (~15h daylight, noon altitude ≈72°),
 * winter solstice ≈ 08:40→17:40 local (~9h, noon altitude ≈25°).
 */
import assert from 'node:assert/strict'
import { dayLengthMinutes, formatSunTime, sunPosition, sunTimes } from './sun'

const TBILISI = { lat: 41.7151, lng: 44.8271 }

const summer = sunTimes(TBILISI.lat, TBILISI.lng, new Date('2026-06-21T12:00:00Z'))
const winter = sunTimes(TBILISI.lat, TBILISI.lng, new Date('2026-12-21T12:00:00Z'))

assert.ok(summer.sunrise && summer.sunset, 'summer sunrise/sunset must exist')
assert.ok(winter.sunrise && winter.sunset, 'winter sunrise/sunset must exist')

const riseS = formatSunTime(summer.sunrise, 'ka')
const setS = formatSunTime(summer.sunset, 'ka')
const riseW = formatSunTime(winter.sunrise, 'ka')
const setW = formatSunTime(winter.sunset, 'ka')
assert.ok(riseS.startsWith('05:'), `summer sunrise ~05:3x, got ${riseS}`)
assert.ok(setS.startsWith('20:'), `summer sunset ~20:3x, got ${setS}`)
assert.ok(riseW.startsWith('08:'), `winter sunrise ~08:4x, got ${riseW}`)
assert.ok(setW.startsWith('17:'), `winter sunset ~17:4x, got ${setW}`)

const lenS = dayLengthMinutes(summer)
const lenW = dayLengthMinutes(winter)
// timeanddate: Tbilisi solstice daylight 6h03m longer in June — 15h12m vs 9h09m.
assert.ok(lenS > 15.0 * 60 && lenS < 15.35 * 60, `summer daylight ≈15h12m, got ${lenS}min`)
assert.ok(lenW > 8.9 * 60 && lenW < 9.25 * 60, `winter daylight ≈9h09m, got ${lenW}min`)
assert.ok(Math.abs(lenS - lenW - 6 * 60 - 3) < 12, `June − December ≈6h03m, got ${lenS - lenW}min`)

// Noon altitude: summer ≈ 90 − 41.7 + 23.4 ≈ 71.7°, winter ≈ 90 − 41.7 − 23.4 ≈ 24.9°
assert.ok(summer.noonAltitude > 70 && summer.noonAltitude < 73, `summer noon alt, got ${summer.noonAltitude}`)
assert.ok(winter.noonAltitude > 24 && winter.noonAltitude < 26, `winter noon alt, got ${winter.noonAltitude}`)

// Position model: at solar noon the sun stands due south (~180°) at noon altitude.
const noonPos = sunPosition(TBILISI.lat, TBILISI.lng, summer.noon)
assert.ok(Math.abs(noonPos.altitude - summer.noonAltitude) < 0.5, `noon altitude vs position, ${noonPos.altitude}`)
assert.ok(noonPos.azimuth > 175 && noonPos.azimuth < 185, `noon azimuth ≈180° (south), got ${noonPos.azimuth}`)
// Sunrise in Tbilisi (northern hemisphere) rises north of east in summer.
const riseAz = sunPosition(TBILISI.lat, TBILISI.lng, summer.sunrise!).azimuth
assert.ok(riseAz > 45 && riseAz < 75, `summer sunrise azimuth ≈NE, got ${riseAz}`)

// Garbage coords must not throw and must not fake events.
const pole = sunTimes(89.9, 0, new Date('2026-06-21T12:00:00Z'))
assert.equal(pole.sunrise, null, 'polar day → null sunrise')
assert.equal(dayLengthMinutes({ ...summer, sunrise: null, sunset: null }), 0)

console.log(`sun: Tbilisi ${riseS}→${setS} (${Math.round(lenS / 6) / 10}h) · winter ${riseW}→${setW} ✓`)
