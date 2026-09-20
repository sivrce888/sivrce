/**
 * Shared floor-stack layers + theme-aware brand paints.
 * Used by /map (Map3D) and /buildings/[slug] (BuildingFloorsMap).
 *
 * Light = high-contrast Google-familiar streets.
 * Dark = navy brand lifts (readable, not flat black).
 */

import type {
  Map as MlMap,
  PropertyValueSpecification,
  StyleSpecification,
} from 'maplibre-gl'
import { BRAND } from '@/lib/brand'
import { EMPTY_FLOORS } from './floors'
import {
  building3dLayer,
  buildingFade,
  buildingTone,
  BUILDING_3D_FULL_ZOOM,
  loadCleanStyle,
  OSM_BUILDING_3D_ID,
} from '@/lib/map/mapChrome'
import { isLiteDevice } from '@/lib/device-budget'
import { mapProxyOrigin } from '@/lib/map/map-proxy'
import { DEFAULT_LANG, isValidLang, type Lang } from '@/lib/i18n/core'
import { applyMapLanguage } from '@/lib/map/map-language'
import { ICONIC_LAYER_ID, setIconicLandmarks3d } from '@/lib/map/iconic-landmarks'
import { paintNature, type NatureKey } from '@/lib/map/nature'

// Defaults are first-party proxy paths — browser never sees openfreemap.org.
export const STYLE_LIGHT =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL_LIGHT ?? '/api/map/styles/liberty'
export const STYLE_CLEAN =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL_CLEAN ?? '/api/map/styles/positron'
export const STYLE_DARK =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL_DARK ??
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ??
  '/api/map/styles/dark'
/** Sentinel — not a URL; loadMapBasemap builds hybrid sat style. */
export const STYLE_SATELLITE = 'satellite:hybrid'

/** streets/clean = OFM; satellite = Esri imagery + road/place labels (Apple Hybrid). */
export type MapTerrain = 'streets' | 'clean' | 'satellite'

/** @deprecated use mapStyleUrl(dark) — kept for one-off env lock */
export const STYLE_URL = STYLE_DARK

export function mapStyleUrl(
  dark: boolean,
  terrain: MapTerrain = 'streets',
  styles?: { light?: string; clean?: string; dark?: string },
): string {
  if (terrain === 'satellite') return STYLE_SATELLITE
  if (dark) return styles?.dark ?? STYLE_DARK
  if (terrain === 'clean') return styles?.clean ?? STYLE_CLEAN
  return styles?.light ?? STYLE_LIGHT
}

/**
 * Apple Hybrid photo. Vector street/place names graft in overlayHybridLabels.
 * Esri road/place rasters are GIS chrome (and empty at pin zoom) — skip them.
 */
export function satelliteStyle(): StyleSpecification {
  // ponytail: absolute tiles — MapLibre workers reject relative /api/sat
  const origin = mapProxyOrigin()
  const tile = (path: string) => (origin ? `${origin}${path}` : path)
  return {
    version: 8,
    sources: {
      sat: {
        type: 'raster',
        tiles: [tile('/api/sat/img/{z}/{y}/{x}')],
        tileSize: 256,
        attribution: '© Esri',
        maxzoom: 19,
      },
    },
    layers: [{ id: 'sat-img', type: 'raster', source: 'sat' }],
  }
}

export async function loadMapBasemap(styleKey: string): Promise<StyleSpecification> {
  // Satellite is always hybrid — Map3D/MapEmbed/SearchMapView share this path.
  // overlayHybridLabels is idempotent (skips when labels are already grafted).
  return styleKey === STYLE_SATELLITE
    ? overlayHybridLabels(satelliteStyle())
    : await loadCleanStyle(styleKey)
}

const HYBRID_NAME_IDS = [
  'highway-name-minor',
  'highway-name-major',
  'highway-name-path',
  'label_other',
] as const

/** OFM vector names on photo — language applied in applyBrandPaints. */
export async function overlayHybridLabels(
  sat: StyleSpecification,
): Promise<StyleSpecification> {
  if (sat.layers?.some((l) => l.id === 'highway-name-major')) return sat
  try {
    const ofm = await loadCleanStyle(STYLE_LIGHT)
    const sivrce = ofm.sources?.sivrce
    if (!sivrce || !ofm.glyphs) return sat
    const want = new Set<string>(HYBRID_NAME_IDS)
    const labels = (ofm.layers ?? [])
      .filter((l) => l.type === 'symbol' && want.has(l.id))
      .map((l) =>
        l.type === 'symbol'
          ? {
              ...l,
              paint: {
                ...l.paint,
                'text-color': BRAND.colors.paper,
                'text-halo-color': BRAND.colors.navy,
                'text-halo-width': 2.2,
              },
            }
          : l,
      )
    const bldg3d = (ofm.layers ?? []).find((l) => l.id === OSM_BUILDING_3D_ID)
    if (!labels.length && !bldg3d) return sat
    return {
      ...sat,
      glyphs: ofm.glyphs,
      sources: { ...sat.sources, sivrce },
      layers: [...(sat.layers ?? []), ...(bldg3d ? [bldg3d] : []), ...labels],
    }
  } catch {
    // ponytail: OFM 5s timeout → photo-only. Vector-first; Esri rasters stay unused.
    return sat
  }
}

export const FLOORS_SOURCE_ID = 'sivrce-floors'
export const FLOORS_FILL_ID = 'sivrce-floors-3d'
export const FLOORS_LINE_ID = 'sivrce-floors-hover'
export const FLOORS_LABEL_ID = 'sivrce-floors-label'

type MapTheme = 'light' | 'dark'

/** Districts are owned by the sivrce NBH layer (Georgian, 65 უბანი + ბათუმი/ქუთაისი).
 *  OFM's Latin suburb labels double-tag the same blocks (CHUGURETI + ჩუღურეთი). */
const OFM_SUBURB_LABEL_IDS = [
  'place_suburb',
  'place_neighbourhood',
  'label_other',
  'place_other',
] as const

function hideOfmSuburbLabels(map: MlMap) {
  for (const id of OFM_SUBURB_LABEL_IDS) tryLayout(map, id, 'visibility', 'none')
}

function trySet(map: MlMap, layer: string, prop: string, value: unknown) {
  if (!map.getLayer(layer)) return
  try {
    // ponytail: dynamic layer props; MapLibre 6 strict paint keys — cast at trust boundary
    map.setPaintProperty(
      layer,
      prop as Parameters<MlMap['setPaintProperty']>[1],
      value as Parameters<MlMap['setPaintProperty']>[2],
    )
  } catch {
    /* style variant may omit layer */
  }
}

function tryLayout(map: MlMap, layer: string, prop: string, value: unknown) {
  if (!map.getLayer(layer)) return
  try {
    map.setLayoutProperty(
      layer,
      prop as Parameters<MlMap['setLayoutProperty']>[1],
      value as Parameters<MlMap['setLayoutProperty']>[2],
    )
  } catch {
    /* style variant may omit layer */
  }
}

/**
 * Basemap massing paint, one place for all four looks. `lo`/`hi` are the tone
 * at a low block and at a tower; `peak` is the opacity once the fade-in lands.
 * Flat 2D `building` fill keeps the same family so the handover is invisible.
 */
export const BUILDING_PALETTE = {
  /** Streets — Google's warm neutral concrete. */
  light: { lo: '#E3E1DC', hi: '#F1EFEA', flat: '#E7E5E0', edge: '#D3D0C9', peak: 0.9 },
  /** Minimal — Apple's paper-warm massing, lighter than the land. */
  clean: { lo: '#E6E2DB', hi: '#F4F1EB', flat: '#EAE7E1', edge: '#D8D4CC', peak: 0.82 },
  /** Night — one step off the navy ground, never the electric blue slab. */
  dark: { lo: '#233152', hi: '#3A4C78', flat: '#26355A', edge: '#44598A', peak: 0.94 },
  /** Hybrid — volume over photography; the imagery must still read through. */
  satellite: { lo: '#D9D6D0', hi: '#EFEDE8', flat: '#DCD9D3', edge: '#C6C3BD', peak: 0.55 },
} as const

function paintBuildings(map: MlMap, key: keyof typeof BUILDING_PALETTE) {
  const p = BUILDING_PALETTE[key]
  trySet(map, 'building', 'fill-color', p.flat)
  trySet(map, 'building', 'fill-opacity', key === 'satellite' ? 0.45 : 1)
  trySet(map, 'building', 'fill-outline-color', p.edge)
  trySet(map, OSM_BUILDING_3D_ID, 'fill-extrusion-color', buildingTone(p.lo, p.hi, !isLiteDevice()))
  trySet(
    map,
    OSM_BUILDING_3D_ID,
    'fill-extrusion-opacity',
    // Hybrid holds the massing back until the photo stops carrying the block.
    key === 'satellite' ? buildingFade(p.peak, 15) : buildingFade(p.peak),
  )
  trySet(map, OSM_BUILDING_3D_ID, 'fill-extrusion-vertical-gradient', true)
}

/** Hide unknown extrusions. City `building-3d` stays — listings paint on top. */
export function muteBasemapExtrusions(map: MlMap, keep: ReadonlySet<string>) {
  for (const layer of map.getStyle()?.layers ?? []) {
    if (layer.type !== 'fill-extrusion') continue
    if (keep.has(layer.id) || layer.id === OSM_BUILDING_3D_ID || layer.id === ICONIC_LAYER_ID) continue
    tryLayout(map, layer.id, 'visibility', 'none')
  }
}

/** 3D on: city extrusions from z13 (boot 14.2). 2D on: footprints only. */
export function setBasemapBuildings3d(map: MlMap, on: boolean) {
  if (!map.getLayer(OSM_BUILDING_3D_ID) && map.getSource('sivrce')) {
    const before = ['sivrce-buildings-fill', 'sivrce-buildings-3d'].find((id) =>
      map.getLayer(id),
    )
    const spec = building3dLayer('sivrce')
    if (before) map.addLayer(spec, before)
    else map.addLayer(spec)
  }
  tryLayout(map, OSM_BUILDING_3D_ID, 'visibility', on ? 'visible' : 'none')
  trySet(map, OSM_BUILDING_3D_ID, 'fill-extrusion-height', [
    'case',
    ['>', ['to-number', ['get', 'render_height']], 0],
    ['get', 'render_height'],
    10,
  ])
  trySet(map, OSM_BUILDING_3D_ID, 'fill-extrusion-base', [
    'coalesce',
    ['get', 'render_min_height'],
    0,
  ])
  // getLayer guard first: after a style timeout+reload maplibre *fires* an
  // ErrorEvent (uncaught console noise) instead of throwing for missing layers.
  if (map.getLayer(OSM_BUILDING_3D_ID)) {
    map.setLayerZoomRange(OSM_BUILDING_3D_ID, on ? 13 : 14, 24)
  }
  if (map.getLayer('building')) {
    try {
      // Overlap the fade: the flat fill holds the block until the extrusion has
      // ramped to full opacity, so the city gains volume instead of popping.
      map.setLayerZoomRange('building', 0, on ? BUILDING_3D_FULL_ZOOM : 24)
    } catch {
      /* style variant may omit zoom range */
    }
  }
  setIconicLandmarks3d(map, on)
}

/**
 * Admin ink per look. Sivrce is a worldwide product — the country tier has to
 * read at globe zoom instead of inheriting whatever the basemap shipped, and
 * Liberty/Positron name their tiers `label_country_*` while Dark uses
 * `place_country_*`. Both families are written; the absent one no-ops.
 */
export const WORLD_INK = {
  light: { country: '#37414F', state: '#6B7486', halo: '#FFFFFF', line: '#5A6480', sub: '#7A8499' },
  clean: { country: '#514C45', state: '#857F74', halo: '#FFFFFF', line: '#BDB6AA', sub: '#D0C9BD' },
  dark: { country: '#E9EDFF', state: '#AFBDE0', halo: BRAND.colors.navy, line: '#4A5A80', sub: '#3A4A70' },
} as const

type WorldKey = keyof typeof WORLD_INK

/** Country borders solid, sub-national softer — the standard reference read. */
function paintBoundaries(map: MlMap, key: WorldKey) {
  const ink = WORLD_INK[key]
  const width: PropertyValueSpecification<number> = [
    'interpolate', ['linear'], ['zoom'],
    2, 0.6, 5, 1, 9, 1.7, 13, 2.4,
  ]
  for (const id of ['boundary_2', 'boundary_country_z0-4', 'boundary_country_z5-']) {
    trySet(map, id, 'line-color', ink.line)
    trySet(map, id, 'line-opacity', 1)
    trySet(map, id, 'line-width', width)
  }
  for (const id of ['boundary_3', 'boundary_state']) {
    trySet(map, id, 'line-color', ink.sub)
    trySet(map, id, 'line-opacity', 0.9)
    trySet(map, id, 'line-width', [
      'interpolate', ['linear'], ['zoom'],
      4, 0.4, 8, 1, 11, 1.6,
    ])
  }
  // Disputed borders stay dashed and unasserted — we do not take a position.
  trySet(map, 'boundary_disputed', 'line-color', ink.sub)
  trySet(map, 'boundary_disputed', 'line-opacity', 0.7)
}

function paintWorldLabels(map: MlMap, key: WorldKey) {
  const ink = WORLD_INK[key]
  for (const id of ['label_country_1', 'label_country_2', 'label_country_3',
    'place_country_major', 'place_country_minor', 'place_country_other']) {
    trySet(map, id, 'text-color', ink.country)
    trySet(map, id, 'text-halo-color', ink.halo)
    trySet(map, id, 'text-halo-width', 1.8)
    trySet(map, id, 'text-opacity', 1)
  }
  for (const id of ['label_state', 'place_state']) {
    trySet(map, id, 'text-color', ink.state)
    trySet(map, id, 'text-halo-color', ink.halo)
    trySet(map, id, 'text-halo-width', 1.5)
    trySet(map, id, 'text-opacity', 0.95)
  }
}

/**
 * Transport fabric: rail, airports, piers.
 *
 * Not polish — a fix. OFM hard-codes these layers to each style's ORIGINAL
 * background: Dark paints its apron `#000` and its piers and rail sleepers
 * `rgb(12,12,12)`, which was its own ground before we repaint it to brand navy.
 * Every airport and pier was therefore punching a black hole through the night
 * map, and Positron's cool white did the same, softer, on our warm paper.
 *
 * `hatch` is the gap between sleepers, so it reads as ground, not as ink.
 */
export const TRANSPORT_INK = {
  light: {
    rail: '#B3B8C2', hatch: '#FFFFFF', apron: '#E5E4E0', runway: '#F4F2EE',
    pier: '#EBEAE7', label: '#5F6368', halo: '#FFFFFF',
  },
  clean: {
    rail: '#C6C1B8', hatch: '#F6F4EF', apron: '#EAE7E0', runway: '#F8F6F1',
    pier: '#EDEAE4', label: '#66625B', halo: '#FFFFFF',
  },
  dark: {
    rail: '#3A4568', hatch: BRAND.colors.navySoft, apron: '#0C1633', runway: '#1A2750',
    pier: BRAND.colors.navySoft, label: '#AFBDE0', halo: BRAND.colors.navy,
  },
} as const

/** Solid track. Liberty splits by brunnel and rail class; the others do not. */
const RAIL_LINE_IDS = [
  'road_major_rail', 'road_transit_rail',
  'tunnel_major_rail', 'tunnel_transit_rail',
  'bridge_major_rail', 'bridge_transit_rail',
  'railway', 'railway_transit', 'railway_service', 'railway_minor',
] as const

/** Dashed sleeper overlay drawn on top of the track. */
const RAIL_HATCH_IDS = [
  'road_major_rail_hatching', 'road_transit_rail_hatching',
  'tunnel_major_rail_hatching', 'tunnel_transit_rail_hatching',
  'bridge_major_rail_hatching', 'bridge_transit_rail_hatching',
  'railway_dashline', 'railway_transit_dashline',
  'railway_service_dashline', 'railway_minor_dashline',
] as const

function paintTransport(map: MlMap, key: WorldKey) {
  const ink = TRANSPORT_INK[key]

  // Rail reads as infrastructure, never as a road: thin, neutral, no casing.
  // Transit proximity is a price signal on this product, so it must stay legible
  // at the zooms people actually shop at.
  for (const id of RAIL_LINE_IDS) {
    trySet(map, id, 'line-color', ink.rail)
    trySet(map, id, 'line-width', [
      'interpolate', ['exponential', 1.4], ['zoom'],
      11, 0.6, 14, 1.4, 17, 3, 20, 5,
    ])
  }
  for (const id of RAIL_HATCH_IDS) trySet(map, id, 'line-color', ink.hatch)

  for (const id of ['aeroway_fill', 'aeroway-area']) {
    trySet(map, id, 'fill-color', ink.apron)
    trySet(map, id, 'fill-opacity', 1)
  }
  for (const id of ['aeroway_runway', 'aeroway_taxiway', 'aeroway-runway', 'aeroway-taxiway']) {
    trySet(map, id, 'line-color', ink.runway)
  }
  trySet(map, 'aeroway-runway-casing', 'line-color', ink.apron)

  trySet(map, 'road_area_pier', 'fill-color', ink.pier)
  trySet(map, 'road_pier', 'line-color', ink.pier)

  trySet(map, 'airport', 'text-color', ink.label)
  trySet(map, 'airport', 'text-halo-color', ink.halo)
  trySet(map, 'airport', 'text-halo-width', 1.4)
}

/**
 * Road widths for the Positron-schema looks (clean + dark). Liberty has its own
 * hierarchy in applyLightPaints; these two shared the ids but only dark set the
 * ramp, so the minimal look was left on OFM defaults.
 */
function paintNarrowRoadWidths(map: MlMap) {
  for (const id of ['highway_minor', 'highway_path']) {
    trySet(map, id, 'line-width', [
      'interpolate', ['linear'], ['zoom'],
      11, 1.2, 14, 2.8, 17, 8,
    ])
  }
  trySet(map, 'highway_major_inner', 'line-width', [
    'interpolate', ['linear'], ['zoom'],
    10, 1.2, 14, 2.6, 17, 9,
  ])
  trySet(map, 'highway_motorway_inner', 'line-width', [
    'interpolate', ['linear'], ['zoom'],
    8, 2.2, 14, 6, 17, 16,
  ])
}

/**
 * Google Maps light palette — the look people already trust.
 * Hex here is intentional third-party basemap mimic (BRAND.md exception).
 * Refs: Maps road white / highway yellow / water #AADAFF / park #C8E6C9.
 */
function applyLightPaints(map: MlMap) {
  // Land — NE on at country zoom so mkhare/terrain read (was 0 → paper white).
  // City zoom stays bright: Google's land is a light neutral, the green belongs
  // to parks and woods, not to the whole canvas.
  trySet(map, 'background', 'background-color', '#EEF0E9')
  trySet(map, 'natural_earth', 'raster-opacity', [
    'interpolate', ['linear'], ['zoom'],
    5, 0.52, 7, 0.4, 9, 0.18, 11, 0,
  ])
  trySet(map, 'landuse_residential', 'fill-color', '#EBEAE7')
  trySet(map, 'landuse_residential', 'fill-opacity', 1)

  // Land, water, rivers and trees all live in nature.ts — one vocabulary across
  // the four looks, so this function only owns roads, labels and buildings.
  for (const id of ['water_name_point_label', 'water_name_line_label', 'waterway_line_label']) {
    trySet(map, id, 'text-color', '#4A86C8')
    trySet(map, id, 'text-halo-color', '#FFFFFF')
    trySet(map, id, 'text-halo-width', 1.2)
  }

  paintBoundaries(map, 'light')
  paintBuildings(map, 'light')

  // Local streets — white + gray casing
  for (const id of [
    'road_minor',
    'road_service_track',
    'road_link',
    'bridge_street',
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
    trySet(map, id, 'line-color', '#B0B3B8')
  }

  // Secondary — pale warm yellow (Google arterial)
  for (const id of ['road_secondary_tertiary', 'bridge_secondary_tertiary']) {
    trySet(map, id, 'line-color', '#FFF2AF')
  }
  for (const id of ['road_secondary_tertiary_casing', 'bridge_secondary_tertiary_casing']) {
    trySet(map, id, 'line-color', '#E0C56A')
  }

  // Trunk / primary — signature Google yellow
  for (const id of ['road_trunk_primary', 'bridge_trunk_primary']) {
    trySet(map, id, 'line-color', '#F6CF65')
  }
  for (const id of ['road_trunk_primary_casing', 'bridge_trunk_primary_casing']) {
    trySet(map, id, 'line-color', '#D4A017')
  }

  // Motorways — bold Google amber (the “wow” yellow)
  for (const id of [
    'road_motorway',
    'road_motorway_link',
    'bridge_motorway',
    'bridge_motorway_link',
  ]) {
    trySet(map, id, 'line-color', '#F5C518')
  }
  for (const id of [
    'road_motorway_casing',
    'road_motorway_link_casing',
    'bridge_motorway_casing',
    'bridge_motorway_link_casing',
  ]) {
    trySet(map, id, 'line-color', '#C99200')
  }

  trySet(map, 'road_path_pedestrian', 'line-color', '#DADCE0')

  // Widths — Google-ish hierarchy (fatter yellow roads)
  for (const id of ['road_minor', 'road_service_track', 'bridge_street']) {
    trySet(map, id, 'line-width', [
      'interpolate', ['linear'], ['zoom'],
      11, 1.2, 14, 2.8, 17, 10,
    ])
  }
  for (const id of [
    'road_minor_casing',
    'road_service_track_casing',
    'bridge_street_casing',
  ]) {
    trySet(map, id, 'line-width', [
      'interpolate', ['linear'], ['zoom'],
      11, 2.2, 14, 4.2, 17, 13,
    ])
  }
  for (const id of ['road_secondary_tertiary', 'bridge_secondary_tertiary']) {
    trySet(map, id, 'line-width', [
      'interpolate', ['linear'], ['zoom'],
      10, 1.6, 14, 4.2, 17, 14,
    ])
  }
  for (const id of ['road_trunk_primary', 'bridge_trunk_primary']) {
    trySet(map, id, 'line-width', [
      'interpolate', ['linear'], ['zoom'],
      9, 2, 14, 6.5, 17, 18,
    ])
  }
  for (const id of ['road_motorway', 'bridge_motorway']) {
    trySet(map, id, 'line-width', [
      'interpolate', ['linear'], ['zoom'],
      8, 2.6, 14, 8.5, 17, 24,
    ])
  }
  for (const id of ['road_motorway_casing', 'bridge_motorway_casing']) {
    trySet(map, id, 'line-width', [
      'interpolate', ['linear'], ['zoom'],
      8, 3.6, 14, 11, 17, 28,
    ])
  }

  // Labels — Google ink
  trySet(map, 'highway-name-path', 'text-color', '#80868E')
  for (const id of ['highway-name-minor', 'highway-name-major']) {
    trySet(map, id, 'text-color', '#3C4043')
    trySet(map, id, 'text-halo-color', '#FFFFFF')
    trySet(map, id, 'text-halo-width', 1.6)
  }
  // Liberty names its place tiers `label_*`; the `place_*` family is the dark
  // style's. Writing both here was a no-op half the time — keep the real ids.
  for (const id of ['label_city', 'label_city_capital', 'label_town', 'label_village']) {
    trySet(map, id, 'text-color', '#202124')
    trySet(map, id, 'text-halo-color', '#FFFFFF')
    trySet(map, id, 'text-halo-width', 2)
    trySet(map, id, 'text-opacity', 1)
  }
  trySet(map, 'label_other', 'text-color', '#5F6368')
  tryLayout(map, 'label_other', 'text-size', [
    'interpolate', ['linear'], ['zoom'],
    10, 11, 13, 13, 15, 15,
  ])
  paintWorldLabels(map, 'light')

  // Quiet POIs — Google keeps them soft so the map stays calm
  for (const id of ['poi_r20', 'poi_r7', 'poi_r1', 'poi_transit']) {
    trySet(map, id, 'text-opacity', 0.55)
    trySet(map, id, 'icon-opacity', 0.6)
  }
  paintTransport(map, 'light')
  hideOfmSuburbLabels(map)
}

/** Google Maps night — high contrast on navy; buildings/roads/labels must read. */
function applyDarkPaints(map: MlMap) {
  trySet(map, 'background', 'background-color', BRAND.colors.navy)
  trySet(map, 'landuse_residential', 'fill-color', BRAND.colors.navySoft)
  trySet(map, 'landuse_residential', 'fill-opacity', 1)

  // Water, rivers, parks, forests and trees: nature.ts (shared across looks).
  trySet(map, 'water_name', 'text-color', BRAND.colors.blueLight)
  trySet(map, 'water_name', 'text-halo-color', BRAND.colors.navy)
  trySet(map, 'water_name', 'text-halo-width', 1.4)

  // OSM city fabric — one step off the ground so blocks read without flooding
  // the frame in brand blue (pins own that hue).
  paintBuildings(map, 'dark')

  // Roads — Google-night ramp. Muted blue-gray fabric keeps brand blue for
  // pins; motorway yellow stays the only wayfinding accent (never glow blue).
  trySet(map, 'highway_path', 'line-color', '#27304B')
  trySet(map, 'highway_minor', 'line-color', '#333E5C')
  trySet(map, 'highway_major_subtle', 'line-color', '#3C4868')
  trySet(map, 'highway_motorway_subtle', 'line-color', '#6B5A28')
  trySet(map, 'highway_major_casing', 'line-color', '#152048')
  trySet(map, 'highway_motorway_casing', 'line-color', '#3D3210')
  trySet(map, 'highway_major_inner', 'line-color', '#5B688B')
  trySet(map, 'highway_motorway_inner', 'line-color', '#F9C32C')

  paintNarrowRoadWidths(map)

  for (const id of [
    'highway_name_other',
    'highway_name_motorway',
    'place_other',
    'place_suburb',
    'place_village',
    'place_town',
    'place_city',
    'place_city_large',
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

  paintBoundaries(map, 'dark')
  paintWorldLabels(map, 'dark')
  paintTransport(map, 'dark')
  hideOfmSuburbLabels(map)
}

/**
 * Minimal — the Apple Maps read: warm paper land, desaturated water, roads as
 * white ribbons on a barely-there casing. Cool grays made listing hues fight
 * the basemap; warm neutrals let brand blue/orange sit on top untouched.
 */
function applyCleanPaints(map: MlMap) {
  trySet(map, 'background', 'background-color', '#F3F1EC')
  trySet(map, 'landuse_residential', 'fill-color', '#EDEAE4')
  trySet(map, 'landuse_residential', 'fill-opacity', 1)
  // Positron ships three landcover classes and no parks, pitches or wetland.
  // nature.ts injects the rest from the same tiles and colours all of it.
  paintBoundaries(map, 'clean')
  paintBuildings(map, 'clean')

  trySet(map, 'highway_path', 'line-color', '#E0DCD4')
  trySet(map, 'highway_minor', 'line-color', '#FFFFFF')
  trySet(map, 'highway_major_casing', 'line-color', '#DCD7CE')
  trySet(map, 'highway_major_inner', 'line-color', '#FFFFFF')
  trySet(map, 'highway_major_subtle', 'line-color', '#EBE7DF')
  trySet(map, 'highway_motorway_casing', 'line-color', '#D9C9A4')
  trySet(map, 'highway_motorway_inner', 'line-color', '#F7EFD6')
  trySet(map, 'highway_motorway_subtle', 'line-color', '#EDE4C9')

  for (const id of [
    'highway-name-path',
    'highway-name-minor',
    'highway-name-major',
    'label_city',
    'label_city_capital',
    'label_town',
    'label_village',
    'label_other',
  ]) {
    trySet(map, id, 'text-color', '#66625B')
    trySet(map, id, 'text-halo-color', '#FFFFFF')
    trySet(map, id, 'text-halo-width', 1.4)
  }
  for (const id of ['water_name_point_label', 'water_name_line_label', 'waterway_line_label']) {
    trySet(map, id, 'text-color', '#6E92B4')
    trySet(map, id, 'text-halo-color', '#FFFFFF')
    trySet(map, id, 'text-halo-width', 1.1)
  }
  paintWorldLabels(map, 'clean')
  paintNarrowRoadWidths(map)
  paintTransport(map, 'clean')
  hideOfmSuburbLabels(map)
}

function langFromDom(): Lang {
  if (typeof document === 'undefined') return DEFAULT_LANG
  const raw = document.documentElement.lang.split('-')[0] ?? ''
  return isValidLang(raw) ? raw : DEFAULT_LANG
}

export function applyBrandPaints(
  map: MlMap,
  theme: MapTheme = 'dark',
  terrain: MapTerrain = 'streets',
) {
  const nature: NatureKey =
    terrain === 'satellite' ? 'satellite' : theme === 'dark' ? 'dark' : terrain === 'clean' ? 'clean' : 'light'

  if (terrain === 'satellite') {
    for (const id of HYBRID_NAME_IDS) {
      trySet(map, id, 'text-color', BRAND.colors.paper)
      trySet(map, id, 'text-halo-color', BRAND.colors.navy)
      trySet(map, id, 'text-halo-width', 2.2)
    }
    paintBuildings(map, 'satellite')
  } else if (theme === 'dark') {
    applyDarkPaints(map)
  } else if (terrain === 'clean') {
    applyCleanPaints(map)
  } else {
    applyLightPaints(map)
  }
  paintNature(map, nature, isLiteDevice())
  try {
    applyMapLanguage(map, langFromDom())
  } catch {
    /* style mid-swap */
  }
}

/** Silence OFM sprite gaps (e.g. wood-pattern) — empty 1×1, no visual change.
 *  MapLibre 6: styleimagemissing can no longer resolve; the resolver hook can. */
export function bindMissingImages(map: MlMap) {
  map.setMissingStyleImageResolver((id) => {
    if (map.hasImage(id)) return
    map.addImage(id, { width: 1, height: 1, data: new Uint8Array([0, 0, 0, 0]) })
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
      'fill-extrusion-vertical-gradient': true,
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
