/**
 * Self-check for site ring preference (no network).
 * Run: npx tsx src/lib/map/site-lookup.check.ts
 */

import assert from 'node:assert/strict'
import { pickOsmBuildingFromElements } from './osm-building-ring'

const apt = {
  type: 'way',
  id: 99,
  tags: { building: 'apartments', 'building:levels': '12', name: 'Test Tower' },
  geometry: [
    { lon: 44.77845, lat: 41.7705 },
    { lon: 44.77907, lat: 41.7705 },
    { lon: 44.77907, lat: 41.77107 },
    { lon: 44.77845, lat: 41.77107 },
    { lon: 44.77845, lat: 41.7705 },
  ],
}

const hit = pickOsmBuildingFromElements([apt], 41.77078, 44.77876)
assert.ok(hit)
assert.equal(hit!.osmId, 99)
assert.equal(hit!.levels, 12)
assert.equal(hit!.building, 'apartments')
assert.equal(hit!.name, 'Test Tower')
assert.ok((hit!.heightM ?? 0) > 30)

// Display preference: building ring wins over parcel when both exist.
const buildingRing = hit!.ring
const parcelRing: [number, number][] = [
  [44.77, 41.77],
  [44.78, 41.77],
  [44.78, 41.772],
  [44.77, 41.772],
  [44.77, 41.77],
]
const preferred = buildingRing ?? parcelRing
const source = buildingRing ? 'osm' : 'napr'
assert.equal(source, 'osm')
assert.equal(preferred[0]![0], 44.77845)

const tasRing: [number, number][] = [
  [44.7785, 41.7706],
  [44.7789, 41.7706],
  [44.7789, 41.7709],
  [44.7785, 41.7709],
  [44.7785, 41.7706],
]
const noOsm = null as [number, number][] | null
const viaTas = noOsm ?? tasRing ?? parcelRing
assert.equal(viaTas[0]![0], 44.7785)

console.log('site-lookup.check: ok')
