/**
 * Runnable check for the map shadow model.
 * Run: npx tsx src/lib/map/sun-shadow.check.ts
 *
 * Asserts against known solar geometry for Tbilisi (41.7151, 44.8271):
 * at the June solstice noon the sun stands due south → a building's shadow
 * must grow due north by height/tan(altitude); an eastern morning sun casts
 * west; night and near-horizon suns cast nothing; extreme reach is capped.
 */
import assert from 'node:assert/strict'
import {
  convexHullLngLat,
  shadowFeature,
  shadowPolygon,
  sunLight,
  sunSky,
  mixHex,
  MAP_DEFAULT_LIGHT,
  NOMINAL_HEIGHT_M,
} from './sun-shadow'

const TBILISI = { lat: 41.7151, lng: 44.8271 }
const M_LAT = 1 / 110_540
const M_LNG = 1 / (111_320 * Math.cos(TBILISI.lat * Math.PI / 180))

/** ~24m square footprint centred on Tbilisi. */
const RING: [number, number][] = [
  [TBILISI.lng - 12 * M_LNG, TBILISI.lat - 12 * M_LAT],
  [TBILISI.lng + 12 * M_LNG, TBILISI.lat - 12 * M_LAT],
  [TBILISI.lng + 12 * M_LNG, TBILISI.lat + 12 * M_LAT],
  [TBILISI.lng - 12 * M_LNG, TBILISI.lat + 12 * M_LAT],
]

// Noon on the June solstice — sun due south, altitude ≈ 72°.
const noonPoly = shadowPolygon(RING, 30, 180, 71.7)
assert.ok(noonPoly, 'noon shadow exists')
assert.equal(noonPoly![0]![0], noonPoly![noonPoly!.length - 1]![0], 'hull is closed')
// Northward growth only: southern edge stays, reach ≈ 30/tan(71.7°) ≈ 9.9m.
const growN = (Math.max(...noonPoly!.map((p) => p[1])) - Math.max(...RING.map((p) => p[1]))) / M_LAT
assert.ok(growN > 7 && growN < 13, `noon reach ≈9.9m north, got ${growN.toFixed(1)}m`)
const growS = (Math.min(...RING.map((p) => p[1])) - Math.min(...noonPoly!.map((p) => p[1]))) / M_LAT
assert.ok(Math.abs(growS) < 0.5, `noon shadow must not grow south, got ${growS.toFixed(2)}m`)
const growLngW = (Math.min(...RING.map((p) => p[0])) - Math.min(...noonPoly!.map((p) => p[0]))) / M_LNG
assert.ok(Math.abs(growLngW) < 0.5, `noon shadow must not grow west, got ${growLngW.toFixed(2)}m`)

// Morning sun in the east (≈06:00 local, June solstice) casts west.
const morning = shadowFeature(RING, 30, TBILISI.lat, TBILISI.lng, new Date('2026-06-21T02:00:00Z'))
assert.ok(morning, 'morning shadow exists')
assert.ok(morning!.azimuth > 45 && morning!.azimuth < 105, `morning sun ≈E, got ${morning!.azimuth.toFixed(0)}°`)
const growW = (Math.min(...RING.map((p) => p[0])) - Math.min(...morning!.polygon.map((p) => p[0]))) / M_LNG
assert.ok(growW > 15, `morning shadow grows west >15m (low sun), got ${growW.toFixed(1)}m`)

// Night / near-horizon → no shadow. Tall wall at 5° sun → capped at 150m.
assert.equal(shadowPolygon(RING, 30, 180, -5), null, 'night casts nothing')
assert.equal(shadowPolygon(RING, 30, 180, 1.5), null, 'sub-MIN_ALTITUDE casts nothing')
assert.equal(shadowFeature(RING, 30, TBILISI.lat, TBILISI.lng, new Date('2026-06-21T20:00:00Z')), null, 'late evening casts nothing')
const capped = shadowPolygon(RING, 200, 180, 5)!
const capReach = (Math.max(...capped.map((p) => p[1])) - Math.max(...RING.map((p) => p[1]))) / M_LAT
assert.ok(capReach > 140 && capReach <= 151, `reach capped at 150m, got ${capReach.toFixed(0)}m`)

// Degenerate inputs must not throw or hallucinate geometry.
assert.equal(shadowPolygon([], 30, 180, 45), null)
assert.equal(shadowPolygon(RING, 0, 180, 45), null)
assert.equal(shadowPolygon(RING, NaN, 180, 45), null)

// Hull contract: interior points never survive; ring corners always do.
const hull = convexHullLngLat([[0, 0], [10, 0], [10, 10], [0, 10], [5, 5], [5, 0]])
assert.ok(!hull.some((p) => p[0] === 5 && p[1] === 5), 'interior point dropped')
for (const c of [[0, 0], [10, 0], [10, 10], [0, 10]] as [number, number][])
  assert.ok(hull.some((p) => p[0] === c[0] && p[1] === c[1]), `corner ${c} kept`)

assert.equal(NOMINAL_HEIGHT_M, 24)

// Sun light drives the map's fill-extrusion light: polar = zenith angle,
// warm + faint at dawn, white + steep at noon, faint cool cast at twilight.
const noonLight = sunLight(45, 180)
assert.deepEqual(noonLight.position, [1.5, 180, 45], 'polar = 90 − altitude, azimuth passthrough')
assert.equal(noonLight.color, '#ffffff', 'high sun is white')
assert.equal(noonLight.intensity, 0.7, 'noon intensity')
const dawnLight = sunLight(5, 90)
assert.deepEqual(dawnLight.position, [1.5, 90, 85], 'dawn light hugs the horizon in the east')
assert.equal(dawnLight.color, mixHex('#ffb562', '#ffffff', 0.2), 'dawn light is warm')
assert.ok(dawnLight.intensity > 0.3 && dawnLight.intensity < 0.4, 'dawn intensity mid-low')
assert.equal(sunLight(95, 0).position[2], 2, 'zenith clamped')
const nightLight = sunLight(-5, 270)
assert.equal(nightLight.intensity, 0.12, 'twilight stays faint')
assert.equal(nightLight.position[2], 92, 'twilight light never comes from below')
assert.equal(sunSky(0)['horizon-color'], '#ffc089', 'dawn horizon warm')
assert.equal(sunSky(25)['horizon-color'], '#ddebf7', 'high-sun horizon pale')
assert.equal(mixHex('#000000', '#ffffff', 0.5), '#808080', 'hex lerp midpoint')
assert.deepEqual(MAP_DEFAULT_LIGHT.position, [1.15, 210, 30], 'restore = style-spec default')

console.log(`sun-shadow: noon ΔN ${growN.toFixed(1)}m · morning W ${growW.toFixed(0)}m · cap ${capReach.toFixed(0)}m · light ✓`)
