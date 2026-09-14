/**
 * Run: npx tsx src/lib/map/atmosphere.check.ts
 * Guards the three things that silently break the 3D map: a globe that never
 * turns on, a night sky that renders as day, and a sun light that is not
 * anchored to the map (façade lighting spins with the compass).
 */

import assert from 'node:assert/strict'
import {
  camMs,
  FLAT_PROJECTION,
  GLOBE_PROJECTION,
  lightFor,
  mapProjection,
  skyFor,
} from './atmosphere'

const TBILISI = { lat: 41.7151, lng: 44.8271 }
/** 2026-06-21 09:00 UTC = 13:00 Tbilisi — sun high. */
const NOON = new Date('2026-06-21T09:00:00Z')
/** 2026-12-21 20:00 UTC = midnight Tbilisi — sun well below the horizon. */
const NIGHT = new Date('2026-12-21T20:00:00Z')

// ——— projection ———
assert.equal(mapProjection(false).type, 'globe', 'full devices get the globe')
assert.equal(mapProjection(true).type, 'mercator', 'lite devices stay flat')
assert.equal(GLOBE_PROJECTION.type, 'globe')
assert.equal(FLAT_PROJECTION.type, 'mercator')

// ——— reduced motion ———
assert.equal(camMs(900, false), 900, 'normal motion keeps the fly duration')
assert.equal(camMs(900, true), 0, 'reduced motion jumps instead of flying')
assert.equal(camMs(0, false), 0)

// ——— sky ———
const daySky = skyFor({ dark: false, ...TBILISI, date: NOON })
const nightSky = skyFor({ dark: true, ...TBILISI, date: NIGHT })
assert.notEqual(daySky['sky-color'], nightSky['sky-color'], 'day and night skies differ')
assert.match(String(daySky['sky-color']), /^#[0-9a-f]{6}$/i, 'sky is a hex colour')
assert.match(String(nightSky['sky-color']), /^#[0-9a-f]{6}$/i)
// Dark theme must be honoured even when the real sun is up — the user picked it.
const darkAtNoon = skyFor({ dark: true, ...TBILISI, date: NOON })
assert.equal(darkAtNoon['sky-color'], nightSky['sky-color'], 'dark theme wins over wall clock')

// Atmosphere fades out as you zoom in — a hazy street view is a bug, not depth.
const blend = daySky['atmosphere-blend'] as unknown[]
assert.equal(blend[0], 'interpolate')
const stops = blend.slice(3) as number[]
for (let i = 0; i + 3 < stops.length; i += 2) {
  assert.ok(stops[i]! < stops[i + 2]!, 'atmosphere zoom stops ascend')
  assert.ok(stops[i + 1]! >= stops[i + 3]!, 'atmosphere weakens as zoom grows')
}

// ——— light ———
const dayLight = lightFor({ dark: false, ...TBILISI, date: NOON })
const nightLight = lightFor({ dark: true, ...TBILISI, date: NIGHT })
assert.equal(dayLight.anchor, 'map', 'sun light is map-anchored, not viewport-anchored')
assert.equal(nightLight.anchor, 'map')
assert.ok(
  (dayLight.intensity as number) > (nightLight.intensity as number),
  'noon is brighter than midnight',
)
const [, az, polar] = dayLight.position as [number, number, number]
assert.ok(az >= -360 && az <= 360, 'azimuth is a bearing')
assert.ok(polar >= 0 && polar <= 90, 'polar is a zenith angle')

console.log(
  `atmosphere: globe ✓ · reduced-motion ✓ · sky day/night ✓ · light map-anchored (noon I=${dayLight.intensity}) ✓`,
)
