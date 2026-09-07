/**
 * Live full-building mark — clusters without a curated footprint rescue the
 * real OSM ring from the basemap vector tiles the map already downloaded
 * (source `sivrce`, source-layer `building`). Zero network: the mark is cut
 * from the same geometry the gray massing renders, so it aligns exactly.
 *
 * The invisible PROBE layer must be added at boot (ensureLayers) — tile
 * buckets are built per layer at load time, so a layer added later queries
 * empty. ponytail: MapLibre 6.6 querySourceFeatures silently returns [] on
 * this build, hence the rendered-features query. A ring clipped at a tile
 * border ships as its largest piece; Overpass fetch is the upgrade path if
 * split towers show up in the field.
 */

import type { Map as MlMap, StyleSpecification } from 'maplibre-gl'
import { geometryRing, pickNearestBuildingGeometry } from './pick-building'

export type LiveFix = { ring: [number, number][]; lat: number; lng: number }

/** Session store of rescued rings — one fix per cluster id, re-applied on every setData. */
export const liveFixes = new Map<string, LiveFix>()

export const LIVE_PROBE_LAYER_ID = 'sivrce-live-probe'
/** ~55 m box at detail zoom — pick logic still enforces the 90 m pin rule. */
const RING_QUERY_PAD_PX = 32

const LIVE_PROBE_LAYER_SPEC = {
  id: LIVE_PROBE_LAYER_ID,
  type: 'fill' as const,
  source: 'sivrce',
  'source-layer': 'building',
  paint: { 'fill-color': '#000000', 'fill-opacity': 0 },
}

/**
 * Append the invisible query handle to the style BEFORE map creation — tile
 * buckets are built per layer at load time, so a layer added later queries
 * empty. Skipped when the basemap is photo-only (no `sivrce` vector source —
 * a dangling layer ref kills the whole style); live rescue is simply off.
 */
export function withLiveProbe(style: StyleSpecification): StyleSpecification {
  if (!style.sources?.sivrce) return style
  if (style.layers?.some((l) => l.id === LIVE_PROBE_LAYER_ID)) return style
  style.layers = [...(style.layers ?? []), LIVE_PROBE_LAYER_SPEC]
  return style
}

/** Ring of the building that owns the first candidate hit — null on any miss. */
export function resolveBasemapRing(
  map: MlMap,
  pts: ReadonlyArray<{ lat: number; lng: number }>,
): [number, number][] | null {
  try {
    if (!map.getLayer(LIVE_PROBE_LAYER_ID)) return null
    for (const p of pts) {
      const pt = map.project([p.lng, p.lat])
      const feats = map.queryRenderedFeatures(
        [
          [pt.x - RING_QUERY_PAD_PX, pt.y - RING_QUERY_PAD_PX],
          [pt.x + RING_QUERY_PAD_PX, pt.y + RING_QUERY_PAD_PX],
        ],
        { layers: [LIVE_PROBE_LAYER_ID] },
      )
      const ring = geometryRing(
        pickNearestBuildingGeometry(feats.map((f) => f.geometry), p.lat, p.lng),
      )
      if (ring) return ring
    }
  } catch {
    return null
  }
  return null
}

/** Patch fixed clusters' polygon geometry + point pin — pure; same FC when nothing to do. */
export function applyLiveFixes(
  fc: GeoJSON.FeatureCollection,
  fixes: Map<string, LiveFix>,
): GeoJSON.FeatureCollection {
  if (fixes.size === 0) return fc
  let changed = false
  const features = fc.features.map((f) => {
    const fix = fixes.get(String(f.id ?? ''))
    if (!fix) return f
    if (f.geometry.type === 'Polygon') {
      changed = true
      return { ...f, geometry: { type: 'Polygon' as const, coordinates: [fix.ring] } }
    }
    if (f.geometry.type === 'Point') {
      changed = true
      return { ...f, geometry: { type: 'Point' as const, coordinates: [fix.lng, fix.lat] } }
    }
    return f
  })
  return changed ? { ...fc, features } : fc
}
