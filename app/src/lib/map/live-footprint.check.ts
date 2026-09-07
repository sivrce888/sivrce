/**
 * Runnable check: npx tsx src/lib/map/live-footprint.check.ts
 * Live full-building mark — basemap-tile ring rescue + FC patching.
 */
import assert from 'node:assert/strict'
import type { Map as MlMap } from 'maplibre-gl'
import { applyLiveFixes, resolveBasemapRing, type LiveFix } from './live-footprint'
import { hasResolvedFootprint, type MapBuildingCluster } from './buildings'

function cluster(patch: Partial<MapBuildingCluster> = {}): MapBuildingCluster {
  return {
    id: 'b-addr:test-68',
    lat: 41.77075,
    lng: 44.77883,
    label: 'აკაკი ბელიაშვილის ქუჩა 68',
    address: 'აკაკი ბელიაშვილის ქუჩა 68',
    buildingNumber: '68',
    district: 'digomis-masivi',
    city: 'tbilisi',
    listings: [],
    counts: { sale: 0, rent: 0, daily: 0, pledge: 0 },
    dominant: 'sale',
    color: '#2F6BFF',
    heightM: 79,
    status: 'active',
    ...patch,
  }
}

/** ~60×40 m slab around the pin, closed. */
function ringAround(lat: number, lng: number): [number, number][] {
  const dLat = 20 / 111_320
  const dLng = 30 / (111_320 * Math.cos((lat * Math.PI) / 180))
  return [
    [lng - dLng, lat - dLat],
    [lng + dLng, lat - dLat],
    [lng + dLng, lat + dLat],
    [lng - dLng, lat + dLat],
    [lng - dLng, lat - dLat],
  ]
}

type FakeOpts = {
  /** Per resolveBasemapRing point: features returned for that probe query. */
  hits?: (GeoJSON.Feature[] | null)[]
}

function fakeMap(features: GeoJSON.Feature[] | null, opts: FakeOpts = {}): MlMap {
  let queries = 0
  let probeLayerPresent = false
  return {
    getSource: (id: string) => (id === 'sivrce' ? {} : null),
    addLayer: () => {
      probeLayerPresent = true
    },
    removeLayer: () => {
      probeLayerPresent = false
    },
    project: () => ({ x: 100, y: 100 }),
    queryRenderedFeatures: () => {
      const f = opts.hits ? opts.hits[queries] ?? null : features
      queries++
      return f ?? []
    },
    get __probePresent() {
      return probeLayerPresent
    },
  } as unknown as MlMap & { __probePresent: boolean }
}

function main() {
  // hasResolvedFootprint — usable b.ring wins; naked cluster falls back to live rescue.
  const real = cluster({ ring: ringAround(41.77075, 44.77883) })
  assert.equal(hasResolvedFootprint(real), true, 'usable DB ring counts as resolved')
  assert.equal(
    hasResolvedFootprint(cluster({ ring: ringAround(41.7721, 44.77883) })),
    false,
    'ring glued to a neighbour block is not resolved',
  )
  assert.equal(hasResolvedFootprint(cluster()), false, 'no ring → live rescue')

  // resolveBasemapRing — probe layer lifecycle + first-hit-point wins.
  const osmRing = ringAround(41.77076, 44.77884)
  const feat: GeoJSON.Feature = {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [osmRing] },
  }
  const map = fakeMap([feat])
  const hit = resolveBasemapRing(map, [{ lat: 41.77075, lng: 44.77883 }])
  assert.ok(hit, 'probe hit resolves the ring')
  assert.equal(hit![0]![0], osmRing[0]![0])
  const asAny = map as unknown as { __probePresent: boolean }
  assert.equal(asAny.__probePresent, false, 'probe layer is always dropped')

  // Miss on the listing pin, hit on the cluster average — candidate order honored.
  const map2 = fakeMap(null, { hits: [[], [feat]] })
  const hit2 = resolveBasemapRing(map2, [
    { lat: 41.77075, lng: 44.7745 },
    { lat: 41.77075, lng: 44.77883 },
  ])
  assert.ok(hit2, 'second candidate resolves when the first misses')

  const miss = resolveBasemapRing(fakeMap(null), [{ lat: 41.77075, lng: 44.77883 }])
  assert.equal(miss, null, 'no building → null, synthetic stays')

  // applyLiveFixes — polygon + point patch keyed by feature id; identity otherwise.
  const fix: LiveFix = { ring: osmRing, lat: 41.77076, lng: 44.77884 }
  const fc: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: 'b-addr:test-68',
        properties: { id: 'b-addr:test-68' },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [44.77, 41.77],
              [44.78, 41.77],
              [44.78, 41.771],
              [44.77, 41.77],
            ],
          ],
        },
      },
      {
        type: 'Feature',
        id: 'b-addr:test-68',
        properties: { id: 'b-addr:test-68' },
        geometry: { type: 'Point', coordinates: [44.77, 41.77] },
      },
    ],
  }
  const fixes = new Map([['b-addr:test-68', fix]])
  const patched = applyLiveFixes(fc, fixes)
  assert.notEqual(patched, fc, 'patched FC is a new object')
  assert.equal(
    (patched.features[0]!.geometry as GeoJSON.Polygon).coordinates[0]![0]![0],
    fix.ring[0]![0],
  )
  assert.equal(
    (patched.features[1]!.geometry as GeoJSON.Point).coordinates[0],
    fix.lng,
    'point pin snaps onto the walls',
  )
  assert.equal(applyLiveFixes(fc, new Map()), fc, 'no fixes → same FC (zero alloc)')
  const untouched = applyLiveFixes(fc, new Map([['unknown-id', fix]]))
  assert.equal(untouched, fc, 'unrelated fix → same FC')

  console.log('live-footprint.check: all green')
}

main()
