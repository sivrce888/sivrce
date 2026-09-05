/**
 * Runnable self-check: terrain → style URL + satellite sentinel.
 * Run: npx tsx src/lib/map/floorLayers.check.ts
 */

import assert from 'node:assert/strict'
import {
  loadMapBasemap,
  mapStyleUrl,
  muteBasemapExtrusions,
  overlayHybridLabels,
  setBasemapBuildings3d,
  STYLE_CLEAN,
  STYLE_DARK,
  STYLE_LIGHT,
  STYLE_SATELLITE,
  satelliteStyle,
} from './floorLayers'
import type { Map as MlMap } from 'maplibre-gl'

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
  assert.equal(sat.sources.satRoads, undefined)
  assert.equal(sat.sources.satLabels, undefined)
  assert.equal(sat.layers?.length, 1)
  assert.equal(sat.layers?.[0]?.type, 'raster')

  const loaded = await loadMapBasemap(STYLE_SATELLITE)
  assert.equal(loaded.layers?.[0]?.id, 'sat-img')
  assert.equal(loaded.sources['sivrce-georgia-mask'], undefined)
  // Satellite always ships hybrid labels — loadMapBasemap grafts them centrally.
  assert.ok(
    loaded.layers?.some((l) => l.id === 'highway-name-major'),
    'hybrid street names grafted',
  )
  const satSrc = loaded.sources.sat as { tiles?: string[] }
  assert.ok(satSrc.tiles?.[0]?.includes('/api/sat/img/'))

  const hybrid = await overlayHybridLabels(loaded)
  assert.ok(hybrid.glyphs)
  assert.ok(hybrid.sources.sivrce)
  for (const id of ['highway-name-minor', 'highway-name-major', 'highway-name-path', 'label_other']) {
    assert.ok(hybrid.layers?.some((l) => l.id === id), id)
  }
  assert.ok((hybrid.layers?.length ?? 0) >= 5)
  const twice = await overlayHybridLabels(hybrid)
  assert.equal(twice.layers?.length, hybrid.layers?.length)

  const hidden: string[] = []
  muteBasemapExtrusions(
    {
      getStyle: () => ({
        layers: [
          { id: 'building-3d', type: 'fill-extrusion' },
          { id: 'other-3d', type: 'fill-extrusion' },
          { id: 'sivrce-buildings-3d', type: 'fill-extrusion' },
          { id: 'road', type: 'line' },
        ],
      }),
      getLayer: (id: string) => ({ id }),
      setLayoutProperty: (id: string, _p: string, v: unknown) => {
        if (v === 'none') hidden.push(id)
      },
    } as unknown as MlMap,
    new Set(['sivrce-buildings-3d']),
  )
  assert.deepEqual(hidden, ['other-3d'])

  assert.ok(
    loaded.layers?.some((l) => l.id === 'building-3d'),
    'hybrid grafts OSM 3D buildings',
  )

  const vis: Record<string, string> = {}
  let zoomRange: [number, number] | null = null
  setBasemapBuildings3d(
    {
      getLayer: (id: string) => (id === 'building-3d' || id === 'building' ? { id } : undefined),
      getSource: (id: string) => (id === 'sivrce' ? {} : undefined),
      addLayer: () => undefined,
      setLayoutProperty: (id: string, _p: string, v: unknown) => {
        vis[id] = String(v)
      },
      setPaintProperty: () => undefined,
      setLayerZoomRange: (_id: string, min: number, max: number) => {
        zoomRange = [min, max]
      },
    } as unknown as MlMap,
    true,
  )
  assert.equal(vis['building-3d'], 'visible')
  assert.deepEqual(zoomRange, [0, 13])

  console.log('floorLayers.check: ok')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
