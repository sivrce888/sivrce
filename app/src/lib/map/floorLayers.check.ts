/**
 * Runnable self-check: terrain → style URL + satellite sentinel.
 * Run: npx tsx src/lib/map/floorLayers.check.ts
 */

import assert from 'node:assert/strict'
import {
  BUILDING_PALETTE,
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
import {
  buildingFade,
  buildingTone,
  BUILDING_3D_FULL_ZOOM,
  BUILDING_3D_MIN_ZOOM,
} from './mapChrome'
import type { Map as MlMap } from 'maplibre-gl'

/** Relative luminance, good enough to prove a tone ramp lifts rather than flips. */
function luma(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16)
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255
}

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
          { id: 'sv-iconic-3d', type: 'fill-extrusion' },
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
      setFilter: () => undefined,
    } as unknown as MlMap,
    true,
  )
  assert.equal(vis['building-3d'], 'visible')
  // Flat fill overlaps the extrusion fade — a hard cut at 13 popped the city on.
  assert.deepEqual(zoomRange, [0, BUILDING_3D_FULL_ZOOM])

  // Massing tone: taller reads lighter in every daylight basemap, and darker
  // than nothing on night. A flat palette is the bug this ramp replaced.
  for (const [name, p] of Object.entries(BUILDING_PALETTE)) {
    assert.notEqual(p.lo, p.hi, `${name} massing needs a height ramp`)
    assert.ok(p.peak > 0 && p.peak <= 1, `${name} peak opacity in range`)
    const lift = luma(p.hi) - luma(p.lo)
    assert.ok(lift > 0.02 && lift < 0.25, `${name} lift is a grade, not a stripe (${lift})`)
  }
  // MapLibre rejects a ramp whose stops descend — the hybrid fade starts later
  // than the default handover zoom, so the end has to move with the start.
  for (const from of [undefined, 15, 16.5]) {
    const fade = (from == null
      ? buildingFade(BUILDING_PALETTE.light.peak)
      : buildingFade(BUILDING_PALETTE.satellite.peak, from)) as unknown[]
    assert.equal(fade[0], 'interpolate')
    const [z0, o0, z1, o1] = fade.slice(3) as number[]
    assert.equal(z0, from ?? BUILDING_3D_MIN_ZOOM)
    assert.ok(z1! > z0!, `fade stops ascend (${z0} → ${z1})`)
    assert.equal(o0, 0)
    assert.ok(o1! > 0)
  }
  assert.equal(buildingTone('#111111', '#222222', false), '#111111', 'lite devices skip the ramp')

  console.log('floorLayers.check: ok')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
