/**
 * Bind Berlin official vector tiles onto a MapLibre map (DE market).
 * Progressive detail by zoom — never loads Germany-wide GeoJSON into React.
 * ponytail: MapLibre vector source only; LoD2 CityGML later for roof geometry.
 */

import type { LayerSpecification, Map as MlMap } from 'maplibre-gl'
import { BRAND } from '@/lib/brand'

const C = BRAND.colors
const SRC_STEP = 'sv-berlin-step'
const SRC_BLD = 'sv-berlin-buildings'
const SRC_PARCEL = 'sv-berlin-parcels'

/** MapLibre source bounds — keep in sync with BERLIN_BBOX (13.08/52.32/13.77/52.68). */
export const BERLIN_TILE_BOUNDS: [number, number, number, number] = [13.08, 52.32, 13.77, 52.68]

function tileUrl(layer: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/api/tiles/${layer}/{z}/{x}/{y}`
}

function addBelow(map: MlMap, layer: LayerSpecification, beforeId?: string): void {
  if (map.getLayer(layer.id)) return
  const before = beforeId && map.getLayer(beforeId) ? beforeId : undefined
  map.addLayer(layer, before)
}

export type BindBerlinOpts = {
  /** Lite skips ALKIS extrusion + parcel lines (tile cache / GPU). StEP stays. */
  lite?: boolean
  /** Insert official layers under listing massing. */
  beforeId?: string
}

/** Idempotent: add sources + layers once. Call after style load. */
export function bindBerlinGeoTiles(map: MlMap, opts: BindBerlinOpts = {}): void {
  const lite = opts.lite === true
  const beforeId = opts.beforeId

  if (!map.getSource(SRC_STEP)) {
    map.addSource(SRC_STEP, {
      type: 'vector',
      tiles: [tileUrl('step')],
      minzoom: 9,
      maxzoom: 16,
      bounds: BERLIN_TILE_BOUNDS,
      attribution: '© SenStadtWo Berlin (dl-de-zero-2.0) · StEP Wohnen 2040',
    })
  }
  if (!lite && !map.getSource(SRC_BLD)) {
    map.addSource(SRC_BLD, {
      type: 'vector',
      tiles: [tileUrl('buildings')],
      minzoom: 14,
      maxzoom: 18,
      bounds: BERLIN_TILE_BOUNDS,
      attribution: '© SenStadtWo Berlin (dl-de-zero-2.0) · ALKIS',
    })
  }
  if (!lite && !map.getSource(SRC_PARCEL)) {
    map.addSource(SRC_PARCEL, {
      type: 'vector',
      tiles: [tileUrl('parcels')],
      minzoom: 16,
      maxzoom: 19,
      bounds: BERLIN_TILE_BOUNDS,
      attribution: '© SenStadtWo Berlin (dl-de-zero-2.0) · ALKIS Flurstücke',
    })
  }

  addBelow(map, {
    id: 'sv-step-priority-fill',
    type: 'fill',
    source: SRC_STEP,
    'source-layer': 'features',
    minzoom: 9,
    maxzoom: 14,
    filter: ['==', ['get', 'kind'], 'step_priority'],
    paint: {
      'fill-color': C.blue,
      'fill-opacity': 0.12,
    },
  }, beforeId)

  addBelow(map, {
    id: 'sv-step-quartier-fill',
    type: 'fill',
    source: SRC_STEP,
    'source-layer': 'features',
    minzoom: 10,
    filter: ['==', ['get', 'kind'], 'step_quartier'],
    paint: {
      'fill-color': C.blueLight,
      'fill-opacity': 0.22,
    },
  }, beforeId)

  addBelow(map, {
    id: 'sv-step-potential-circle',
    type: 'circle',
    source: SRC_STEP,
    'source-layer': 'features',
    minzoom: 11,
    filter: ['in', ['get', 'kind'], ['literal', ['step_potential', 'step_gemeinwohl']]],
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 4, 15, 9],
      'circle-color': C.orange,
      'circle-stroke-width': 1.5,
      'circle-stroke-color': C.paper,
      'circle-opacity': 0.92,
    },
  }, beforeId)

  if (!lite && map.getSource(SRC_BLD)) {
    addBelow(map, {
      id: 'sv-alkis-extrude',
      type: 'fill-extrusion',
      source: SRC_BLD,
      'source-layer': 'features',
      minzoom: 14,
      paint: {
        'fill-extrusion-color': C.blueLight,
        'fill-extrusion-height': ['coalesce', ['to-number', ['get', 'height']], 12],
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.55,
        'fill-extrusion-vertical-gradient': true,
      },
    }, beforeId)
  }

  if (!lite && map.getSource(SRC_PARCEL)) {
    addBelow(map, {
      id: 'sv-parcel-line',
      type: 'line',
      source: SRC_PARCEL,
      'source-layer': 'features',
      minzoom: 16,
      paint: {
        'line-color': C.blueDeep,
        'line-width': 1,
        'line-opacity': 0.55,
      },
    }, beforeId)
  }
}

export const BERLIN_TILE_LAYER_IDS = [
  'sv-step-priority-fill',
  'sv-step-quartier-fill',
  'sv-step-potential-circle',
  'sv-alkis-extrude',
  'sv-parcel-line',
] as const

export type BerlinPick =
  | {
      kind: string
      id: string
      name: string | null
      status: string | null
      weKat: string | null
      height: number | null
      floors: number | null
      areaM2: number | null
      heightSource: string | null
      source: 'alkis' | 'step'
    }
  | null

/** Map click → StEP/ALKIS feature props (vector tile attributes only). */
export function pickBerlinFeature(
  map: MlMap,
  point: { x: number; y: number },
): BerlinPick {
  const layers = BERLIN_TILE_LAYER_IDS.filter((id) => map.getLayer(id))
  if (!layers.length) return null
  const hits = map.queryRenderedFeatures([point.x, point.y], { layers: [...layers] })
  const f = hits[0]
  if (!f?.properties) return null
  const p = f.properties
  const kind = String(p.kind ?? '')
  const source = kind.startsWith('alkis') ? 'alkis' : 'step'
  const numOrNull = (v: unknown): number | null => {
    const n = typeof v === 'number' ? v : v != null ? Number(v) : NaN
    return Number.isFinite(n) && n > 0 ? n : null
  }
  return {
    kind,
    id: String(p.id ?? ''),
    name: p.name != null ? String(p.name) : null,
    status: p.status != null ? String(p.status) : null,
    weKat: p.we_kat != null ? String(p.we_kat) : null,
    height: numOrNull(p.height),
    floors: numOrNull(p.floors),
    areaM2: numOrNull(p.area_m2),
    heightSource: p.height_source != null && String(p.height_source) ? String(p.height_source) : null,
    source,
  }
}
