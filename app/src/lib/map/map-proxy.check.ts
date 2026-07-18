/**
 * Run: npx tsx src/lib/map/map-proxy.check.ts
 */
import assert from 'node:assert/strict'
import { mapProxyPathOk, toMapProxyUrl, MAP_PROXY_PREFIX } from './map-proxy'

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

console.log('map-proxy.check: ok')
