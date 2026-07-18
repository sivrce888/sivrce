/**
 * Shared MapLibre floor-stack layers + theme-aware brand paints.
 * Used by /map (Map3D) and /buildings/[slug] (BuildingFloorsMap).
 *
 * Light = OFM liberty (Google-like streets). Dark = OFM dark + navy brand lifts.
 */

import type { Map as MlMap } from 'maplibre-gl'
import { BRAND } from '@/lib/brand'
import { EMPTY_FLOORS } from './floors'

export const STYLE_LIGHT =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL_LIGHT ??
  'https://tiles.openfreemap.org/styles/liberty'
export const STYLE_DARK =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL_DARK ??
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ??
  'https://tiles.openfreemap.org/styles/dark'

/** @deprecated use mapStyleUrl(dark) — kept for one-off env lock */
export const STYLE_URL = STYLE_DARK

export function mapStyleUrl(dark: boolean): string {
  return dark ? STYLE_DARK : STYLE_LIGHT
}

export const FLOORS_SOURCE_ID = 'sivrce-floors'
export const FLOORS_FILL_ID = 'sivrce-floors-3d'
export const FLOORS_LINE_ID = 'sivrce-floors-hover'
export const FLOORS_LABEL_ID = 'sivrce-floors-label'

type MapTheme = 'light' | 'dark'

function trySet(map: MlMap, layer: string, prop: string, value: unknown) {
  if (!map.getLayer(layer)) return
  try {
    map.setPaintProperty(layer, prop, value)
  } catch {
    /* style variant may omit layer */
  }
}

/** Subtle brand tint on liberty — keep Google-readable streets/labels. */
function applyLightPaints(map: MlMap) {
  trySet(map, 'background', 'background-color', '#F2F4F8')
  trySet(map, 'water', 'fill-color', '#C5D8F5')
  trySet(map, 'waterway', 'line-color', BRAND.colors.blueLight)
  trySet(map, 'park', 'fill-color', '#D8EBD8')
  trySet(map, 'building', 'fill-color', '#D4DAE8')
  trySet(map, 'building', 'fill-opacity', 0.7)
  trySet(map, 'building-3d', 'fill-extrusion-color', '#C8D0E4')
  trySet(map, 'building-3d', 'fill-extrusion-opacity', 0.55)
  for (const id of ['highway_path', 'highway_minor', 'highway_major_subtle', 'highway_motorway_subtle']) {
    trySet(map, id, 'line-color', '#B8C0D4')
  }
  for (const id of ['highway_major_inner', 'highway_motorway_inner']) {
    trySet(map, id, 'line-color', '#FFFFFF')
  }
  for (const id of ['highway_major_casing', 'highway_motorway_casing']) {
    trySet(map, id, 'line-color', '#A8B4CC')
  }
  for (const id of [
    'highway_name_other',
    'highway_name_motorway',
    'place_suburb',
    'place_city',
    'place_town',
  ]) {
    trySet(map, id, 'text-color', BRAND.colors.ink)
    trySet(map, id, 'text-halo-color', '#FFFFFF')
  }
}

/** Navy brand lifts on OFM dark — streets readable, not flat black. */
function applyDarkPaints(map: MlMap) {
  trySet(map, 'background', 'background-color', BRAND.colors.navy)
  trySet(map, 'water', 'fill-color', '#0A1440')
  trySet(map, 'waterway', 'line-color', BRAND.colors.blueDeep)
  trySet(map, 'park', 'fill-color', '#0A1830')
  trySet(map, 'building', 'fill-color', '#1A274F')
  trySet(map, 'building', 'fill-opacity', 0.55)
  trySet(map, 'building-3d', 'fill-extrusion-color', '#1A274F')
  trySet(map, 'building-3d', 'fill-extrusion-opacity', 0.45)
  for (const id of ['highway_path', 'highway_minor', 'highway_major_subtle', 'highway_motorway_subtle']) {
    trySet(map, id, 'line-color', '#4A5A88')
  }
  for (const id of ['highway_major_inner', 'highway_motorway_inner']) {
    trySet(map, id, 'line-color', BRAND.colors.blueLight)
  }
  for (const id of ['highway_major_casing', 'highway_motorway_casing']) {
    trySet(map, id, 'line-color', '#152048')
  }
  for (const id of [
    'highway_name_other',
    'highway_name_motorway',
    'place_suburb',
    'place_city',
    'place_town',
  ]) {
    trySet(map, id, 'text-color', '#C8D4F0')
    trySet(map, id, 'text-halo-color', BRAND.colors.navy)
  }
}

export function applyBrandPaints(map: MlMap, theme: MapTheme = 'dark') {
  if (theme === 'light') applyLightPaints(map)
  else applyDarkPaints(map)
}

/** Silence OFM sprite gaps (e.g. wood-pattern) — empty 1×1, no visual change. */
export function bindMissingImages(map: MlMap) {
  map.on('styleimagemissing', (e) => {
    if (map.hasImage(e.id)) return
    const data = new Uint8Array([0, 0, 0, 0])
    map.addImage(e.id, { width: 1, height: 1, data })
  })
}

/** Adds the floor source + fill/line/label layers once. Ids are fixed; call on every map. */
export function ensureFloorLayers(map: MlMap, minzoom = 14.5) {
  if (map.getSource(FLOORS_SOURCE_ID)) return

  map.addSource(FLOORS_SOURCE_ID, { type: 'geojson', data: EMPTY_FLOORS })

  map.addLayer({
    id: FLOORS_FILL_ID,
    type: 'fill-extrusion',
    source: FLOORS_SOURCE_ID,
    paint: {
      // ponytail: MapLibre 5 — opacity constant-only; per-floor alpha baked into `color`.
      'fill-extrusion-color': ['get', 'color'],
      'fill-extrusion-base': ['get', 'base'],
      'fill-extrusion-height': ['get', 'top'],
      'fill-extrusion-opacity': 1,
    },
  })

  map.addLayer({
    id: FLOORS_LINE_ID,
    type: 'line',
    source: FLOORS_SOURCE_ID,
    // ponytail: feature-state illegal in filters — drive visibility via paint instead.
    paint: {
      'line-color': '#FFFFFF',
      'line-width': 2,
      'line-opacity': [
        'case',
        [
          'any',
          ['boolean', ['feature-state', 'hover'], false],
          ['boolean', ['feature-state', 'selected'], false],
        ],
        0.9,
        0,
      ],
    },
  })

  map.addLayer({
    id: FLOORS_LABEL_ID,
    type: 'symbol',
    source: FLOORS_SOURCE_ID,
    minzoom,
    layout: {
      'text-field': ['get', 'label'],
      'text-size': 10,
      'text-font': ['Noto Sans Bold'],
      'text-allow-overlap': true,
    },
    paint: {
      'text-color': '#FFFFFF',
      'text-halo-color': BRAND.colors.navy,
      'text-halo-width': 1.2,
    },
  })
}
