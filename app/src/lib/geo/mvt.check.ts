/**
 * Self-check: MVT layer/zoom policy (no DB).
 * Run: npx tsx src/lib/geo/mvt.check.ts
 */
import assert from 'node:assert/strict'
import { isTileLayer, layerZoomOk, parseTileXYZ, TILE_LAYERS } from './mvt'

assert.ok(isTileLayer('buildings'))
assert.ok(isTileLayer('step'))
assert.ok(!isTileLayer('fake'))
assert.deepEqual([...TILE_LAYERS.buildings], ['alkis_building'])

assert.ok(layerZoomOk('buildings', 14))
assert.ok(layerZoomOk('buildings', 17))
assert.ok(!layerZoomOk('buildings', 10))
assert.ok(layerZoomOk('step', 10))
assert.ok(!layerZoomOk('parcels', 12))
assert.ok(layerZoomOk('parcels', 17))
assert.ok(isTileLayer('bplan'))
assert.ok(layerZoomOk('bplan', 12))
assert.ok(!layerZoomOk('bplan', 9))
assert.deepEqual([...TILE_LAYERS.bplan], ['bplan_festgesetzt', 'bplan_verfahren'])

assert.deepEqual(parseTileXYZ('14', '8800', '5370'), { z: 14, x: 8800, y: 5370 })
assert.equal(parseTileXYZ('2', '5', '0'), null) // x out of range for z2
assert.equal(parseTileXYZ('a', '0', '0'), null)

console.log('mvt: layer/zoom policy ✓')
