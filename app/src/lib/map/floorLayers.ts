/**
 * Shared MapLibre floor-stack layers + brand paints.
 * Used by /map (Map3D) and /buildings/[slug] (BuildingFloorsMap).
 */

import type { Map as MlMap } from 'maplibre-gl'
import { BRAND } from '@/lib/brand'
import { EMPTY_FLOORS } from './floors'

export const STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? 'https://tiles.openfreemap.org/styles/dark'

export const FLOORS_SOURCE_ID = 'sivrce-floors'
export const FLOORS_FILL_ID = 'sivrce-floors-3d'
export const FLOORS_LINE_ID = 'sivrce-floors-hover'
export const FLOORS_LABEL_ID = 'sivrce-floors-label'

export function applyBrandPaints(map: MlMap) {
  const trySet = (layer: string, prop: string, value: unknown) => {
    if (!map.getLayer(layer)) return
    try {
      map.setPaintProperty(layer, prop, value)
    } catch {
      /* style variant may omit layer */
    }
  }
  trySet('background', 'background-color', BRAND.colors.navy)
  trySet('water', 'fill-color', '#0A1440')
  trySet('waterway', 'line-color', BRAND.colors.blueDeep)
  trySet('park', 'fill-color', '#0A1830')
  trySet('building', 'fill-color', '#1A274F')
  trySet('building', 'fill-opacity', 0.55)
  trySet('building-3d', 'fill-extrusion-color', '#1A274F')
  trySet('building-3d', 'fill-extrusion-opacity', 0.45)
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
      'fill-extrusion-color': ['get', 'color'],
      'fill-extrusion-base': ['get', 'base'],
      'fill-extrusion-height': ['get', 'top'],
      'fill-extrusion-opacity': [
        'case',
        [
          'any',
          ['boolean', ['feature-state', 'hover'], false],
          ['boolean', ['feature-state', 'selected'], false],
        ],
        1,
        ['==', ['get', 'available'], 0],
        ['case', ['get', 'ghost'], 0.45, 0.3],
        0.92,
      ],
    },
  })

  map.addLayer({
    id: FLOORS_LINE_ID,
    type: 'line',
    source: FLOORS_SOURCE_ID,
    filter: [
      'any',
      ['boolean', ['feature-state', 'hover'], false],
      ['boolean', ['feature-state', 'selected'], false],
    ],
    paint: { 'line-color': '#FFFFFF', 'line-width': 2, 'line-opacity': 0.9 },
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
