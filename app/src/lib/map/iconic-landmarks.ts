/**
 * Iconic 3D landmarks — stacked circular fill-extrusions (MapLibre native).
 * First mesh: Berliner Fernsehturm (Alexanderplatz). No glTF / Three.
 * ponytail: ~20 discs; lite drops sphere slices. Ceiling: CityGML LoD3 if a
 * second landmark ever needs non-revolution geometry.
 *
 * Dims: total 368.03 m, Kugel Ø 32 m at 203.78 m (Besuchergeschoss).
 * Materials: daytime postcard (concrete shaft, stainless Kugel, amber windows).
 * Hex is photoreal cladding — BRAND.md third-party mimic exception (same as OSM 3D).
 */

import type { ExpressionSpecification, GeoJSONSource, Map as MlMap } from 'maplibre-gl'
import { BRAND } from '@/lib/brand'
import { circleRing } from '@/lib/map/footprint-circle'
import { OSM_BUILDING_3D_ID } from '@/lib/map/mapChrome'
import { bilingualTextField } from '@/lib/map/map-language'

export const ICONIC_SOURCE_ID = 'sv-iconic'
export const ICONIC_LAYER_ID = 'sv-iconic-3d'
export const ICONIC_LABEL_ID = 'sv-iconic-label'
const ALKIS_EXTRUDE_ID = 'sv-alkis-extrude'

/** WGS84 — OSM node / Wikipedia 52°31′15″N 13°24′34″E. */
export const FERNSEHTURM = {
  lat: 52.520817,
  lng: 13.40945,
  heightM: 368,
  sphereR: 16,
  sphereCenterM: 203.78,
  shaftR: 8,
  hideR: 50,
  /** Radii only — 16 m Kugel is ~2 px at z15; height stays 368 m. */
  mapR: 1.45,
} as const

/** Photoreal cladding (daylight, Alexanderplatz). */
export const FERNSEHTURM_COLORS = {
  podium: '#C6C0B4',
  shaft: '#D2CDC4',
  steelLo: '#B7BDC6',
  steelHi: '#D5D9E0',
  window: '#C24B2A',
  mast: '#EEEDE6',
  beacon: '#C8102E',
} as const

type Disc = { base: number; top: number; r: number; color: string }

function discFeature(d: Disc, segs: number): GeoJSON.Feature {
  return {
    type: 'Feature',
    properties: {
      kind: 'mass',
      color: d.color,
      base: d.base,
      top: d.top,
      name: 'Fernsehturm',
      height: FERNSEHTURM.heightM,
    },
    geometry: { type: 'Polygon', coordinates: [circleRing(FERNSEHTURM.lat, FERNSEHTURM.lng, d.r, segs)] },
  }
}

function sphereDiscs(n: number): Disc[] {
  const { sphereR: R, sphereCenterM: H } = FERNSEHTURM
  const { steelLo, steelHi, window } = FERNSEHTURM_COLORS
  const out: Disc[] = []
  for (let i = 0; i < n; i++) {
    const z0 = -R + (2 * R * i) / n
    const z1 = -R + (2 * R * (i + 1)) / n
    const zm = (z0 + z1) / 2
    const r = Math.sqrt(Math.max(0, R * R - zm * zm)) * FERNSEHTURM.mapR
    if (r < 1.8) continue
    const color = Math.abs(zm) < 5.2 ? window : zm < 0 ? steelLo : steelHi
    out.push({ base: H + z0, top: H + z1, r, color })
  }
  return out
}

function fernsehturmDiscs(lite: boolean): Disc[] {
  const C = FERNSEHTURM_COLORS
  const sphere = sphereDiscs(lite ? 8 : 14)
  const s = FERNSEHTURM.mapR
  return [
    { base: 0, top: 14, r: 16 * s, color: C.podium },
    { base: 14, top: 187.6, r: FERNSEHTURM.shaftR * s, color: C.shaft },
    ...sphere,
    { base: 220, top: 248, r: 4.2 * s, color: C.steelLo },
    { base: 248, top: 292, r: 2.1 * s, color: C.mast },
    { base: 292, top: 308, r: 1.7 * s, color: C.beacon },
    { base: 308, top: FERNSEHTURM.heightM, r: 1.15 * s, color: C.mast },
  ]
}

export function iconicHidePolygon(): GeoJSON.Polygon {
  return {
    type: 'Polygon',
    coordinates: [circleRing(FERNSEHTURM.lat, FERNSEHTURM.lng, FERNSEHTURM.hideR, 20)],
  }
}

export function iconicLandmarksGeoJSON(lite = false): GeoJSON.FeatureCollection {
  const segs = lite ? 16 : 28
  const features = fernsehturmDiscs(lite).map((d) => discFeature(d, segs))
  features.push({
    type: 'Feature',
    properties: {
      kind: 'label',
      name: 'Fernsehturm',
      'name:en': 'TV Tower',
      'name:de': 'Fernsehturm',
      'name:ka': 'ფერნზეეტურმი',
      'name:ru': 'Телебашня',
    },
    geometry: { type: 'Point', coordinates: [FERNSEHTURM.lng, FERNSEHTURM.lat] },
  })
  return { type: 'FeatureCollection', features }
}

/**
 * Keep city massing except the tower's own OSM/ALKIS stick.
 * `distance` (not `within`): tile-clipped footprints fail `within` even when
 * the tower sits in the hole — then a 368 m grey chimney swallows the Kugel.
 */
export function iconicKeepFarFilter(extra?: unknown): unknown {
  const here = {
    type: 'Point',
    coordinates: [FERNSEHTURM.lng, FERNSEHTURM.lat],
  }
  // The GeoJSON goes in RAW, not wrapped in ['literal', …]. Distance.parse
  // reads args[1] as a plain object before any expression parsing, so a
  // ['literal', …] wrapper has no `type`/`coordinates` key and the whole filter
  // is rejected — MapLibre logs it and keeps the previous filter instead of
  // throwing, which is why the tower kept its 368 m grey chimney while
  // setFilter's try/catch stayed silent.
  const far = ['>=', ['distance', here], FERNSEHTURM.hideR]
  return extra ? ['all', extra, far] : far
}

export function punchIconicHoles(map: MlMap): void {
  // Off-Berlin maps have no tower to carve — and the `distance` filter throws
  // on non-polygon tile fragments there (console noise on every listing map).
  const c = map.getCenter?.()
  if (c && (Math.abs(c.lng - FERNSEHTURM.lng) > 0.7 || Math.abs(c.lat - FERNSEHTURM.lat) > 0.5)) return
  const osm = iconicKeepFarFilter(['!=', ['get', 'hide_3d'], true])
  try {
    if (map.getLayer(OSM_BUILDING_3D_ID)) map.setFilter(OSM_BUILDING_3D_ID, osm as never)
  } catch {
    /* style mid-swap / distance unsupported */
  }
  try {
    if (map.getLayer(ALKIS_EXTRUDE_ID)) {
      map.setFilter(ALKIS_EXTRUDE_ID, iconicKeepFarFilter() as never)
    }
  } catch {
    /* layer absent or filter rejected */
  }
}

export function setIconicLandmarks3d(map: MlMap, on: boolean): void {
  const vis = on ? 'visible' : 'none'
  for (const id of [ICONIC_LAYER_ID, ICONIC_LABEL_ID]) {
    if (!map.getLayer(id)) continue
    try {
      map.setLayoutProperty(id, 'visibility', vis)
    } catch {
      /* remount */
    }
  }
  if (on) punchIconicHoles(map)
}

export type BindIconicOpts = { lite?: boolean; beforeId?: string; visible?: boolean }

/** Idempotent. Call after style load (next to Berlin tiles). */
export function bindIconicLandmarks(map: MlMap, opts: BindIconicOpts = {}): void {
  const lite = opts.lite === true
  const fc = iconicLandmarksGeoJSON(lite)
  const src = map.getSource(ICONIC_SOURCE_ID) as GeoJSONSource | undefined
  if (!src) {
    map.addSource(ICONIC_SOURCE_ID, { type: 'geojson', data: fc })
  } else {
    src.setData(fc)
  }

  const before = opts.beforeId && map.getLayer(opts.beforeId) ? opts.beforeId : undefined
  if (!map.getLayer(ICONIC_LAYER_ID)) {
    map.addLayer(
      {
        id: ICONIC_LAYER_ID,
        type: 'fill-extrusion',
        source: ICONIC_SOURCE_ID,
        minzoom: 12,
        filter: ['==', ['get', 'kind'], 'mass'],
        paint: {
          'fill-extrusion-color': ['get', 'color'],
          'fill-extrusion-base': ['get', 'base'],
          'fill-extrusion-height': ['get', 'top'],
          'fill-extrusion-opacity': 1,
          'fill-extrusion-vertical-gradient': true,
        },
      },
      before,
    )
    map.on('mouseenter', ICONIC_LAYER_ID, () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', ICONIC_LAYER_ID, () => {
      map.getCanvas().style.cursor = ''
    })
  }
  if (!map.getLayer(ICONIC_LABEL_ID)) {
    map.addLayer({
      id: ICONIC_LABEL_ID,
      type: 'symbol',
      source: ICONIC_SOURCE_ID,
      minzoom: 13.5,
      filter: ['==', ['get', 'kind'], 'label'],
      layout: {
        'text-field': bilingualTextField(
          ['get', 'name'],
          ['get', 'name:en'],
        ) as ExpressionSpecification,
        'text-size': 12,
        'text-font': ['Noto Sans Bold'],
        'text-anchor': 'bottom',
        'text-offset': [0, -0.8],
        'text-max-width': 10,
        'text-allow-overlap': false,
        'text-padding': 4,
      },
      paint: {
        'text-color': '#FFFFFF',
        'text-halo-color': BRAND.colors.navy,
        'text-halo-width': 1.6,
      },
    })
  }
  setIconicLandmarks3d(map, opts.visible !== false)
}
