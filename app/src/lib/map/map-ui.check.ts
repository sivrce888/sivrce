/**
 * Runnable self-check: map UI parse + cookie defaults.
 * Run: npx tsx src/lib/map/map-ui.check.ts
 */

import assert from 'node:assert/strict'
import {
  mapUiHasPrefs,
  parseMapUiJson,
  parseMapUiRaw,
  parseTerrain,
  serializeMapUi,
} from './map-ui'

assert.equal(parseTerrain('streets'), 'streets')
assert.equal(parseTerrain('clean'), 'clean')
assert.equal(parseTerrain('satellite'), 'satellite')
assert.equal(parseTerrain('bright'), 'streets')
assert.equal(parseTerrain('nope'), 'streets')

assert.deepEqual(parseMapUiJson({ terrain: 'bright', view3d: false }), {
  terrain: 'streets',
  view3d: false,
})
assert.deepEqual(parseMapUiJson({ terrain: 'satellite', deal: 'sale' }), {
  terrain: 'satellite',
  deal: 'sale',
})
assert.deepEqual(parseMapUiJson({ terrain: 'garbage' }), {})
assert.equal(mapUiHasPrefs({}), false)
assert.equal(mapUiHasPrefs({ view3d: true }), true)

const raw = serializeMapUi({ terrain: 'streets', view3d: true })
assert.deepEqual(parseMapUiRaw(raw), { terrain: 'streets', view3d: true })
assert.deepEqual(parseMapUiRaw('%7B'), {})
assert.deepEqual(parseMapUiRaw(null), {})

console.log('map-ui.check: ok')
