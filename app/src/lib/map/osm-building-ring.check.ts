/**
 * Self-check for Overpass ring pick (no network).
 * Run: npx tsx src/lib/map/osm-building-ring.check.ts
 */

import assert from 'node:assert/strict'
import { pickOsmBuildingRingFromElements } from './osm-building-ring'

const shed = {
  type: 'way',
  geometry: [
    { lon: 44.7794, lat: 41.7704 },
    { lon: 44.77952, lat: 41.7704 },
    { lon: 44.77952, lat: 41.77053 },
    { lon: 44.7794, lat: 41.77053 },
    { lon: 44.7794, lat: 41.7704 },
  ],
}

const aptWay = {
  type: 'way',
  geometry: [
    { lon: 44.77845, lat: 41.7705 },
    { lon: 44.77907, lat: 41.7705 },
    { lon: 44.77907, lat: 41.77107 },
    { lon: 44.77845, lat: 41.77107 },
    { lon: 44.77845, lat: 41.7705 },
  ],
}

// Multipolygon: inner courtyard ignored; outer used
const mp = {
  type: 'relation',
  members: [
    {
      type: 'way',
      role: 'outer',
      geometry: [
        { lon: 44.778, lat: 41.77 },
        { lon: 44.7792, lat: 41.77 },
        { lon: 44.7792, lat: 41.7712 },
        { lon: 44.778, lat: 41.7712 },
        { lon: 44.778, lat: 41.77 },
      ],
    },
    {
      type: 'way',
      role: 'inner',
      geometry: [
        { lon: 44.7784, lat: 41.7704 },
        { lon: 44.7788, lat: 41.7704 },
        { lon: 44.7788, lat: 41.7708 },
        { lon: 44.7784, lat: 41.7708 },
        { lon: 44.7784, lat: 41.7704 },
      ],
    },
  ],
}

const inside = { lat: 41.77078, lng: 44.77876 }
const ring = pickOsmBuildingRingFromElements([shed, aptWay], inside.lat, inside.lng)
assert.ok(ring)
assert.equal(ring![0]![0], 44.77845)

const mpRing = pickOsmBuildingRingFromElements([mp], 41.7706, 44.7786)
assert.ok(mpRing)
assert.equal(mpRing!.length, 5)
assert.equal(mpRing![0]![0], 44.778)

console.log('osm-building-ring.check: ok')
