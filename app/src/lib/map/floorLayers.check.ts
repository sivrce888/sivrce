/**
 * Runnable self-check: terrain → style URL + satellite sentinel.
 * Run: npx tsx src/lib/map/floorLayers.check.ts
 */

import assert from 'node:assert/strict'
import {
  loadMapBasemap,
  mapStyleUrl,
  overlayHybridLabels,
  STYLE_CLEAN,
  STYLE_DARK,
  STYLE_LIGHT,
  STYLE_SATELLITE,
  satelliteStyle,
} from './floorLayers'

async function main() {
  assert.equal(mapStyleUrl(false, 'streets'), STYLE_LIGHT)
  assert.equal(mapStyleUrl(false, 'clean'), STYLE_CLEAN)
  assert.equal(mapStyleUrl(false, 'satellite'), STYLE_SATELLITE)
  assert.equal(mapStyleUrl(true, 'streets'), STYLE_DARK)
  assert.equal(mapStyleUrl(true, 'clean'), STYLE_DARK)
  assert.equal(mapStyleUrl(true, 'satellite'), STYLE_SATELLITE)
  assert.equal(mapStyleUrl(false), STYLE_LIGHT)

  const sat = satelliteStyle()
  assert.equal(sat.version, 8)
  assert.ok(sat.sources.sat)
  assert.ok(sat.sources.satRoads)
  assert.ok(sat.sources.satLabels)
  assert.equal(sat.layers?.[0]?.type, 'raster')

  const loaded = await loadMapBasemap(STYLE_SATELLITE)
  assert.equal(loaded.layers?.[0]?.id, 'sat-img')
  assert.ok(loaded.sources['sivrce-georgia-mask'])
  assert.equal(loaded.layers?.at(-1)?.id, 'sivrce-georgia-mask-fill')
  assert.equal(loaded.layers?.length, 4)
  const satSrc = loaded.sources.sat as { tiles?: string[] }
  assert.ok(satSrc.tiles?.[0]?.includes('/api/sat/img/'))

  const hybrid = await overlayHybridLabels(loaded)
  assert.ok(hybrid.glyphs)
  assert.ok(hybrid.sources.sivrce)
  for (const id of ['highway-name-minor', 'highway-name-major', 'highway-name-path']) {
    assert.ok(hybrid.layers?.some((l) => l.id === id), id)
  }
  assert.equal(hybrid.layers?.at(-1)?.id, 'sivrce-georgia-mask-fill')

  console.log('floorLayers.check: ok')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
