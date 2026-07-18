/**
 * Shared MapLibre floor-stack layers + theme-aware brand paints.
 * Used by /map (Map3D) and /buildings/[slug] (BuildingFloorsMap).
 *
 * Light = OFM liberty retuned to high-contrast Google-familiar streets.
 * Dark = OFM dark + navy brand lifts (readable, not flat black).
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

function tryLayout(map: MlMap, layer: string, prop: string, value: unknown) {
  if (!map.getLayer(layer)) return
  try {
    map.setLayoutProperty(layer, prop, value)
  } catch {
    /* style variant may omit layer */
  }
}

/**
 * High-contrast Google Maps–familiar light basemap.
 * Saturated water/parks, crisp roads, readable place labels.
 */
function applyLightPaints(map: MlMap) {
  trySet(map, 'background', 'background-color', '#F0F1F3')
  trySet(map, 'natural_earth', 'raster-opacity', 0)

  // Water — classic Google cyan, punchier than liberty default
  trySet(map, 'water', 'fill-color', '#7CB8F0')
  trySet(map, 'waterway_river', 'line-color', '#7CB8F0')
  trySet(map, 'waterway_other', 'line-color', '#90C4F2')

  // Parks / green — vivid but not neon
  trySet(map, 'park', 'fill-color', '#A8D99A')
  trySet(map, 'park', 'fill-opacity', 0.95)
  trySet(map, 'park_outline', 'line-color', '#7CB86E')
  trySet(map, 'landcover_grass', 'fill-color', '#C5E6A8')
  trySet(map, 'landcover_wood', 'fill-color', '#8FBF7A')
  trySet(map, 'landuse_residential', 'fill-color', '#E8E9EC')
  trySet(map, 'landuse_cemetery', 'fill-color', '#C8DDB8')
  trySet(map, 'landuse_hospital', 'fill-color', '#F8C8CC')
  trySet(map, 'landuse_school', 'fill-color', '#FFE08A')
  trySet(map, 'landuse_pitch', 'fill-color', '#9FD48A')

  trySet(map, 'building', 'fill-color', '#D5D8DE')
  trySet(map, 'building', 'fill-opacity', 0.95)
  trySet(map, 'building', 'fill-outline-color', '#A8ADB6')
  trySet(map, 'building-3d', 'fill-extrusion-color', '#C2C6CE')
  trySet(map, 'building-3d', 'fill-extrusion-opacity', 0.55)

  // Roads — white fill, stronger casing contrast
  for (const id of [
    'road_minor',
    'road_service_track',
    'road_link',
    'road_secondary_tertiary',
    'road_trunk_primary',
    'bridge_street',
    'bridge_secondary_tertiary',
    'bridge_trunk_primary',
    'bridge_link',
  ]) {
    trySet(map, id, 'line-color', '#FFFFFF')
  }
  for (const id of [
    'road_minor_casing',
    'road_service_track_casing',
    'road_link_casing',
    'bridge_street_casing',
    'bridge_link_casing',
  ]) {
    trySet(map, id, 'line-color', '#B8BCC4')
  }
  for (const id of ['road_secondary_tertiary_casing', 'bridge_secondary_tertiary_casing']) {
    trySet(map, id, 'line-color', '#9AA0A8')
  }
  for (const id of ['road_trunk_primary_casing', 'bridge_trunk_primary_casing']) {
    trySet(map, id, 'line-color', '#80868E')
  }

  // Motorways — Google amber (high wow at city scale)
  for (const id of [
    'road_motorway',
    'road_motorway_link',
    'bridge_motorway',
    'bridge_motorway_link',
  ]) {
    trySet(map, id, 'line-color', '#F9C32C')
  }
  for (const id of [
    'road_motorway_casing',
    'road_motorway_link_casing',
    'bridge_motorway_casing',
    'bridge_motorway_link_casing',
  ]) {
    trySet(map, id, 'line-color', '#D4920A')
  }

  trySet(map, 'road_path_pedestrian', 'line-color', '#D0D3D8')

  for (const id of ['road_minor', 'road_service_track', 'bridge_street']) {
    trySet(map, id, 'line-width', [
      'interpolate', ['linear'], ['zoom'],
      11, 1.4, 14, 3, 17, 9,
    ])
  }
  for (const id of ['road_secondary_tertiary', 'bridge_secondary_tertiary']) {
    trySet(map, id, 'line-width', [
      'interpolate', ['linear'], ['zoom'],
      10, 1.8, 14, 4.5, 17, 13,
    ])
  }
  for (const id of ['road_trunk_primary', 'bridge_trunk_primary']) {
    trySet(map, id, 'line-width', [
      'interpolate', ['linear'], ['zoom'],
      9, 2.2, 14, 6, 17, 17,
    ])
  }
  for (const id of ['road_motorway', 'bridge_motorway']) {
    trySet(map, id, 'line-width', [
      'interpolate', ['linear'], ['zoom'],
      8, 2.8, 14, 8, 17, 22,
    ])
  }

  trySet(map, 'highway-name-path', 'text-color', '#80868E')
  for (const id of ['highway-name-minor', 'highway-name-major']) {
    trySet(map, id, 'text-color', '#3C4043')
    trySet(map, id, 'text-halo-color', '#FFFFFF')
    trySet(map, id, 'text-halo-width', 1.5)
  }
  // Cities / towns / suburbs — Google gray, strong halo so districts read from afar
  for (const id of [
    'label_city',
    'label_city_capital',
    'label_town',
    'label_village',
    'label_other',
    'place_city',
    'place_town',
    'place_village',
    'place_suburb',
    'place_neighbourhood',
    'place_hamlet',
  ]) {
    trySet(map, id, 'text-color', '#202124')
    trySet(map, id, 'text-halo-color', '#FFFFFF')
    trySet(map, id, 'text-halo-width', 1.8)
    trySet(map, id, 'text-opacity', 0.95)
  }
  for (const id of ['place_suburb', 'place_neighbourhood', 'label_other']) {
    tryLayout(map, id, 'text-size', [
      'interpolate', ['linear'], ['zoom'],
      10, 11, 13, 14, 15, 15,
    ])
  }

  // Keep POI readable for metro/landmarks; mute the rest slightly
  for (const id of ['poi_r20', 'poi_r7', 'poi_r1']) {
    trySet(map, id, 'text-opacity', 0.7)
    trySet(map, id, 'icon-opacity', 0.75)
  }
}

/** Google Maps night — high contrast on navy; buildings/roads/labels must read. */
function applyDarkPaints(map: MlMap) {
  trySet(map, 'background', 'background-color', BRAND.colors.navy)
  trySet(map, 'landuse_residential', 'fill-color', BRAND.colors.navySoft)
  trySet(map, 'landuse_residential', 'fill-opacity', 1)

  trySet(map, 'water', 'fill-color', '#1B4F8A')
  trySet(map, 'waterway', 'line-color', BRAND.colors.blue)
  trySet(map, 'water_name', 'text-color', BRAND.colors.blueLight)
  trySet(map, 'water_name', 'text-halo-color', BRAND.colors.navy)
  trySet(map, 'water_name', 'text-halo-width', 1.4)

  trySet(map, 'landuse_park', 'fill-color', '#143D28')
  trySet(map, 'landuse_park', 'fill-opacity', 0.95)
  trySet(map, 'landcover_wood', 'fill-color', '#0F3220')
  trySet(map, 'landcover_glacier', 'fill-color', '#2A3A55')
  trySet(map, 'landcover_ice_shelf', 'fill-color', '#243450')

  // OSM city fabric — lighter than land so blocks read
  trySet(map, 'building', 'fill-color', '#3A5080')
  trySet(map, 'building', 'fill-opacity', 0.92)
  trySet(map, 'building', 'fill-outline-color', '#5A6F9A')

  trySet(map, 'highway_path', 'line-color', '#2A3A5C')
  trySet(map, 'highway_minor', 'line-color', '#4A5F8C')
  trySet(map, 'highway_major_subtle', 'line-color', '#5A6F9A')
  trySet(map, 'highway_motorway_subtle', 'line-color', '#6B5A28')
  trySet(map, 'highway_major_casing', 'line-color', '#152048')
  trySet(map, 'highway_motorway_casing', 'line-color', '#3D3210')
  trySet(map, 'highway_major_inner', 'line-color', BRAND.colors.blueLight)
  trySet(map, 'highway_motorway_inner', 'line-color', '#F9C32C')

  for (const id of ['highway_minor', 'highway_path']) {
    trySet(map, id, 'line-width', [
      'interpolate', ['linear'], ['zoom'],
      11, 1.2, 14, 2.8, 17, 8,
    ])
  }
  trySet(map, 'highway_major_inner', 'line-width', [
    'interpolate', ['linear'], ['zoom'],
    10, 1.6, 14, 4, 17, 12,
  ])
  trySet(map, 'highway_motorway_inner', 'line-width', [
    'interpolate', ['linear'], ['zoom'],
    8, 2.2, 14, 6, 17, 16,
  ])

  for (const id of [
    'highway_name_other',
    'highway_name_motorway',
    'place_other',
    'place_suburb',
    'place_village',
    'place_town',
    'place_city',
    'place_city_large',
    'place_state',
    'place_country_other',
    'place_country_minor',
    'place_country_major',
  ]) {
    trySet(map, id, 'text-color', '#E9EDFF')
    trySet(map, id, 'text-halo-color', BRAND.colors.navy)
    trySet(map, id, 'text-halo-width', 1.8)
    trySet(map, id, 'text-opacity', 0.95)
  }
  for (const id of ['place_suburb', 'place_other']) {
    tryLayout(map, id, 'text-size', [
      'interpolate', ['linear'], ['zoom'],
      10, 11, 13, 14, 15, 15,
    ])
  }

  trySet(map, 'boundary_state', 'line-color', '#3A4A70')
  trySet(map, 'boundary_country_z0-4', 'line-color', '#4A5A80')
  trySet(map, 'boundary_country_z5-', 'line-color', '#4A5A80')
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
