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
  POI_MIN_ZOOM,
  keepUniversityPoi,
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
assert.ok(MAP_POIS.some((p) => p.category === 'university'), 'university required')
assert.ok(MAP_POIS.some((p) => p.category === 'park'), 'park required')
assert.ok(POI_CATEGORIES.includes('university'))
assert.ok(POI_MIN_ZOOM.pharmacy > POI_MIN_ZOOM.metro)
assert.ok(POI_MIN_ZOOM.school > POI_MIN_ZOOM.university)

const unis = MAP_POIS.filter((p) => p.category === 'university')
assert.ok(unis.length >= 20, `expected Tbilisi universities, got ${unis.length}`)
assert.ok(unis.every((p) => keepUniversityPoi(p.name)), 'university noise leaked')
assert.ok(!unis.some((p) => /ფაკულტეტ/i.test(p.name) && !/უნივერსიტეტ|university|აკადემი/i.test(p.name)))

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
assert.ok(
  fc.features.every(
    (f) => typeof f.properties?.icon === 'string' && String(f.properties.icon).startsWith('sv-poi-'),
  ),
)

assert.deepEqual(parsePoiPrefs('metro,pharmacy'), ['metro', 'pharmacy'])
assert.deepEqual(parsePoiPrefs(''), [])
assert.equal(parsePoiPrefs(undefined), undefined)
assert.equal(serializePoiPrefs(POI_DEFAULT_ON), 'metro')

const empty = poiFilterSpec([])
assert.deepEqual(empty, ['==', ['get', 'category'], '__none__'])
const metro = poiFilterSpec(['metro'], 12)
assert.deepEqual(metro, ['in', ['get', 'category'], ['literal', ['metro']]])
// pharmacy gated until 13.5
assert.deepEqual(poiFilterSpec(['metro', 'pharmacy'], 12), [
  'in',
  ['get', 'category'],
  ['literal', ['metro']],
])
assert.deepEqual(poiFilterSpec(['metro', 'pharmacy'], 14), [
  'in',
  ['get', 'category'],
  ['literal', ['metro', 'pharmacy']],
])

assert.equal(keepUniversityPoi('თსუ'), true)
assert.equal(keepUniversityPoi('ეკონომიკის საერთაშორისო სკოლა'), false)
assert.equal(keepUniversityPoi('აგრარული მეცნიერებების ფაკულტეტი'), false)

console.log(`pois.check: ok (${MAP_POIS.length} pois, ${METRO_STATIONS.length} metro, ${unis.length} uni)`)
