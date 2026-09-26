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
  mapBootCamera,
  scaleUnitForLocale,
} from './map-ui'

assert.equal(parseTerrain('streets'), 'streets')
assert.equal(parseTerrain('clean'), 'clean')
assert.equal(parseTerrain('satellite'), 'satellite')
assert.equal(parseTerrain('contrast'), 'contrast')
assert.deepEqual(parseMapUiJson({ terrain: 'contrast' }), { terrain: 'contrast' })
assert.equal(parseTerrain('bright'), 'streets')
assert.equal(parseTerrain('nope'), 'streets')

assert.deepEqual(parseMapUiJson({ terrain: 'bright', view3d: false }), {
  terrain: 'streets',
  view3d: false,
})
assert.deepEqual(parseMapUiJson({ terrain: 'satellite', deal: 'sale', kind: 'apartment' }), {
  terrain: 'satellite',
  deal: 'sale',
  kind: 'apartment',
})
assert.deepEqual(parseMapUiJson({ pois: 'metro,school' }), { pois: 'metro,school' })
assert.deepEqual(parseMapUiJson({ terrain: 'garbage' }), {})
assert.equal(mapUiHasPrefs({}), false)
assert.equal(mapUiHasPrefs({ view3d: true }), true)
assert.equal(mapUiHasPrefs({ pois: '' }), true)

const raw = serializeMapUi({ terrain: 'streets', view3d: true })
assert.deepEqual(parseMapUiRaw(raw), { terrain: 'streets', view3d: true })
assert.deepEqual(parseMapUiRaw('%7B'), {})
assert.deepEqual(parseMapUiRaw(null), {})

assert.deepEqual(mapBootCamera(true), { pitch: 58, bearing: -18, zoom: 12.8 })
assert.deepEqual(mapBootCamera(false), { pitch: 0, bearing: 0, zoom: 12.8 })

// Scale bar follows the reader's region, not the site language.
assert.equal(scaleUnitForLocale('en-US'), 'imperial')
assert.equal(scaleUnitForLocale('en-GB'), 'metric')
assert.equal(scaleUnitForLocale('ka-GE'), 'metric')
assert.equal(scaleUnitForLocale('de'), 'metric')
assert.equal(scaleUnitForLocale('my-MM'), 'imperial')
assert.equal(scaleUnitForLocale(undefined), 'metric')
assert.equal(scaleUnitForLocale('not a locale'), 'metric')

console.log('map-ui.check: ok')
