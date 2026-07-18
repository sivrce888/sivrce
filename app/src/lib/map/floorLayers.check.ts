/**
 * Runnable self-check: terrain → style URL.
 * Run: npx tsx src/lib/map/floorLayers.check.ts
 */

import assert from 'node:assert/strict'
import {
  mapStyleUrl,
  STYLE_BRIGHT,
  STYLE_CLEAN,
  STYLE_DARK,
  STYLE_LIGHT,
} from './floorLayers'

assert.equal(mapStyleUrl(false, 'streets'), STYLE_LIGHT)
assert.equal(mapStyleUrl(false, 'clean'), STYLE_CLEAN)
assert.equal(mapStyleUrl(false, 'bright'), STYLE_BRIGHT)
assert.equal(mapStyleUrl(true, 'streets'), STYLE_DARK)
assert.equal(mapStyleUrl(true, 'clean'), STYLE_DARK)
assert.equal(mapStyleUrl(true, 'bright'), STYLE_DARK)
assert.equal(mapStyleUrl(false), STYLE_LIGHT)

console.log('floorLayers.check: ok')
