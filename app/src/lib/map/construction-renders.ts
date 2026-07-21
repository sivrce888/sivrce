/**
 * Construction project renders draped on footprint bbox (MapLibre image source).
 * ponytail: bbox quad ≠ true facade UV; upgrade → textured 3D / Cesium when needed.
 */

import type { Map as MlMap } from 'maplibre-gl'
import {
  clusterGeometry,
  type MapBuildingCluster,
} from '@/lib/map/buildings'
import { ringToImageCoords } from '@/lib/map/pick-building'

const SRC_PREFIX = 'sv-cr-'
const LAYER_SUFFIX = '-raster'
/** Cap overlays — MapLibre image sources are heavy. */
const MAX_RENDERS = 48

function srcId(buildingId: string) {
  return `${SRC_PREFIX}${buildingId}`
}

function layerId(buildingId: string) {
  return `${srcId(buildingId)}${LAYER_SUFFIX}`
}

function absoluteImg(url: string): string {
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url
  if (typeof window === 'undefined') return url
  return new URL(url, window.location.origin).href
}

type ImageSrc = {
  setCoordinates: (
    c: [[number, number], [number, number], [number, number], [number, number]],
  ) => void
}

export function syncConstructionRenders(
  map: MlMap,
  buildings: MapBuildingCluster[],
  opts?: { minZoom?: number; beforeId?: string },
) {
  const minZoom = opts?.minZoom ?? 15
  const want = new Set<string>()
  let n = 0

  for (const b of buildings) {
    if (n >= MAX_RENDERS) break
    if (b.status !== 'construction' || b.listings.length > 0 || !b.img) continue
    const ring = clusterGeometry(b).coordinates[0] as [number, number][] | undefined
    if (!ring || ring.length < 4) continue

    const sid = srcId(b.id)
    const lid = layerId(b.id)
    want.add(sid)
    n++
    const coords = ringToImageCoords(ring)
    const url = absoluteImg(b.img)

    const existing = map.getSource(sid) as ImageSrc | undefined
    if (existing && typeof existing.setCoordinates === 'function') {
      try {
        existing.setCoordinates(coords)
      } catch {
        /* style mid-swap */
      }
      continue
    }

    try {
      if (map.getLayer(lid)) map.removeLayer(lid)
      if (map.getSource(sid)) map.removeSource(sid)
      map.addSource(sid, { type: 'image', url, coordinates: coords })
      map.addLayer(
        {
          id: lid,
          type: 'raster',
          source: sid,
          minzoom: minZoom,
          paint: {
            'raster-opacity': 0.78,
            'raster-fade-duration': 0,
          },
        },
        opts?.beforeId && map.getLayer(opts.beforeId) ? opts.beforeId : undefined,
      )
    } catch (err) {
      console.warn('[construction-renders]', b.id, err)
    }
  }

  const sources = map.getStyle()?.sources
  if (!sources) return
  for (const id of Object.keys(sources)) {
    if (!id.startsWith(SRC_PREFIX) || want.has(id)) continue
    const bid = id.slice(SRC_PREFIX.length)
    const lid = layerId(bid)
    try {
      if (map.getLayer(lid)) map.removeLayer(lid)
      if (map.getSource(id)) map.removeSource(id)
    } catch {
      /* gone */
    }
  }
}
