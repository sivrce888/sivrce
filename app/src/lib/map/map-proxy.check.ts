/**
 * Run: npx tsx src/lib/map/map-proxy.check.ts
 */
import assert from 'node:assert/strict'
import {
  mapProxyPathOk,
  toMapProxyUrl,
  scrubMapJson,
  MAP_PROXY_PREFIX,
  MAP_JSON_CACHE_VER,
  OFM_ORIGIN,
} from './map-proxy'

assert.equal(mapProxyPathOk('styles/liberty'), true)
assert.equal(mapProxyPathOk('sprites/ofm_f384/ofm.json'), true)
assert.equal(mapProxyPathOk('planet'), true)
assert.equal(mapProxyPathOk('natural_earth/ne2sr/1/2/3.png'), true)
assert.equal(mapProxyPathOk(''), false)
assert.equal(mapProxyPathOk('evil'), false)
assert.equal(toMapProxyUrl('https://tiles.openfreemap.org/planet'), `${MAP_PROXY_PREFIX}/planet`)
assert.equal(
  toMapProxyUrl('https://tiles.openfreemap.org/planet/1/2/3.pbf'),
  `${MAP_PROXY_PREFIX}/planet/1/2/3.pbf`,
)

// Critical: OSM/OMT HTML attribution must not break JSON (prod bug 2026-07-18).
const dirty = JSON.stringify({
  tilejson: '3.0.0',
  tiles: [`${OFM_ORIGIN}/planet/x/{z}/{x}/{y}.pbf`],
  attribution:
    '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> <a href="https://www.openmaptiles.org/" target="_blank">&copy; OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
  name: 'OpenFreeMap',
})
const clean = scrubMapJson(dirty, 'https://sivrce.ge')
const parsed = JSON.parse(clean) as {
  tiles: string[]
  attribution: string
  name: string
}
assert.equal(parsed.tiles[0], 'https://sivrce.ge/api/map/planet/x/{z}/{x}/{y}.pbf')
assert.equal(parsed.attribution, '')
assert.equal(parsed.name, '')
assert.ok(!/openfreemap\.org/i.test(clean))

// Style source id must survive (old regex wiped "openmaptiles" → broken MapLibre).
const styleDirty = JSON.stringify({
  version: 8,
  sources: {
    openmaptiles: { type: 'vector', url: `${OFM_ORIGIN}/planet` },
    ne2_shaded: {
      type: 'raster',
      tiles: [`${OFM_ORIGIN}/natural_earth/ne2sr/{z}/{x}/{y}.png`],
    },
  },
  layers: [{ id: 'water', type: 'fill', source: 'openmaptiles', 'source-layer': 'water' }],
})
const styleClean = scrubMapJson(styleDirty, 'https://sivrce.ge')
const styleParsed = JSON.parse(styleClean) as {
  sources: Record<string, unknown>
  layers: { source?: string }[]
}
assert.ok(styleParsed.sources.openmaptiles, 'openmaptiles source key preserved')
assert.equal(styleParsed.sources[''], undefined, 'must not create empty source key')
assert.equal(styleParsed.layers[0]?.source, 'openmaptiles')
const omt = styleParsed.sources.openmaptiles as { url: string }
assert.equal(omt.url, `https://sivrce.ge/api/map/planet?v=${MAP_JSON_CACHE_VER}`)

console.log('map-proxy.check: ok')
