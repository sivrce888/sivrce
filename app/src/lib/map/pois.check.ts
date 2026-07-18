/**
 * Runnable self-check: POI catalog + nearest metro + filter prefs.
 * Run: npx tsx src/lib/map/pois.check.ts
 */

import assert from 'node:assert/strict'
import {
  MAP_POIS,
  METRO_NEAR_M,
  METRO_STATIONS,
  POI_CATEGORIES,
  POI_DEFAULT_ON,
  formatMetroDist,
  isPoiCategory,
  metroMeters,
  nearestMetro,
  parsePoiPrefs,
  poiFilterSpec,
  poisToGeoJSON,
  serializePoiPrefs,
} from './pois'

assert.ok(MAP_POIS.length > 100, `expected POIs, got ${MAP_POIS.length}`)
assert.ok(METRO_STATIONS.length >= 20, `metro stations ${METRO_STATIONS.length}`)
assert.ok(MAP_POIS.some((p) => p.category === 'pharmacy'), 'pharmacy required')
assert.ok(MAP_POIS.some((p) => p.category === 'school'), 'school required')

for (const p of MAP_POIS) {
  assert.ok(isPoiCategory(p.category), p.category)
  assert.ok(Number.isFinite(p.lat) && Number.isFinite(p.lng), p.id)
  assert.ok(p.lat > 40.9 && p.lat < 43.7, `lat ${p.lat}`)
  assert.ok(p.lng > 39.8 && p.lng < 46.9, `lng ${p.lng}`)
  assert.ok(p.name.length > 0, p.id)
}

const rustaveli = METRO_STATIONS.find((s) => s.name.includes('რუსთაველი'))
assert.ok(rustaveli, 'rustaveli station')
const near = nearestMetro(rustaveli!.lat + 0.0003, rustaveli!.lng)
assert.ok(near, 'nearest metro near rustaveli')
assert.ok(near!.meters < 100, `expected <100m got ${near!.meters}`)
assert.ok(near!.walkMin >= 1)
assert.ok(formatMetroDist(near!).includes('m'))
assert.ok(metroMeters(rustaveli!.lat, rustaveli!.lng) <= METRO_NEAR_M)
assert.equal(nearestMetro(41.61, 41.62), null) // Batumi — no Tbilisi metro

const fc = poisToGeoJSON()
assert.equal(fc.features.length, MAP_POIS.length)
assert.equal(fc.features[0]?.geometry.type, 'Point')

assert.deepEqual(parsePoiPrefs('metro,pharmacy'), ['metro', 'pharmacy'])
assert.deepEqual(parsePoiPrefs(''), [])
assert.equal(parsePoiPrefs(undefined), undefined)
assert.equal(serializePoiPrefs(POI_DEFAULT_ON), 'metro')
assert.ok(POI_CATEGORIES.includes('metro'))

const empty = poiFilterSpec([])
assert.deepEqual(empty, ['==', ['get', 'category'], '__none__'])
const metro = poiFilterSpec(['metro'])
assert.deepEqual(metro, ['in', ['get', 'category'], ['literal', ['metro']]])

console.log(`pois.check: ok (${MAP_POIS.length} pois, ${METRO_STATIONS.length} metro)`)
