'use client'

/**
 * SIVRCE 3D map — brand paints, filters, tap a building.
 * ponytail: basemap via /api/map; Meilisearch geo when scale hits.
 */

import { useEffect, useRef, useState, useCallback, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useI18n, type DictKey } from '@/lib/i18n/context'
import { motion } from 'framer-motion'
import * as maplibregl from 'maplibre-gl'
import {
  type Map as MlMap,
  type MapLayerMouseEvent,
  type MapMouseEvent,
  type GeoJSONSource,
  type FilterSpecification,
  type ExpressionSpecification,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { DealType, Listing } from '@/data/listings'
import type { Project } from '@/data/professionals'
import TBILISI_RAIONS from '@/data/tbilisi-raions.json'
import { BRAND } from '@/lib/brand'
import {
  addPricePillImages,
  PRICE_PILL_ACTIVE,
  PRICE_PILL_IDLE,
} from '@/lib/map/price-pin'
import { CATEGORY_BRAND, DEAL_BRAND, SERVICE_BRAND, STATUS_BRAND } from '@/lib/category-brand'
import {
  MAP_CENTER,
  GEORGIA_MAX_BOUNDS,
  MAP_MIN_ZOOM,
  buildingsToGeoJSON,
  buildingsToPointsGeoJSON,
  clusterListingsToBuildings,
  filterBuildings,
  findBuildingBySlug,
  findBuildingForListing,
  findNearestBuilding,
  mergeMapBuildings,
  mergeDbBuildings,
  neighborhoodsToGeoJSON,
  projectsToConstructionBuildings,
  applyLiveProjectPins,
  type MapBuildingCluster,
  type MapDealFilter,
  type MapKindFilter,
  type MapStatusFilter,
  parseMapKind,
} from '@/lib/map/buildings'
import type { MapPlatformConfig } from '@/lib/map/platform-config'
import BuildingPanel from '@/components/map/BuildingPanel'
import {
  EMPTY_FLOORS,
  buildingShowsFloorStack,
  floorTooltipKa,
  floorsToGeoJSON,
  type FloorInfo,
} from '@/lib/map/floors'
import {
  applyBrandPaints,
  bindMissingImages,
  ensureFloorLayers,
  FLOORS_FILL_ID,
  FLOORS_LABEL_ID,
  FLOORS_SOURCE_ID,
  loadMapBasemap,
  mapStyleUrl,
  muteBasemapExtrusions,
  STYLE_SATELLITE,
  type MapTerrain,
} from '@/lib/map/floorLayers'
import {
  mapUiHasPrefs,
  parseTerrain,
  readMapUi,
  writeMapUi,
  mapBootCamera,
  type MapUiSave,
} from '@/lib/map/map-ui'
import {
  POI_CATEGORIES,
  POI_COLORS,
  POI_DEFAULT_ON,
  isPoiCategory,
  parsePoiPrefs,
  poiFilterSpec,
  poisToGeoJSON,
  serializePoiPrefs,
  type PoiCategory,
} from '@/lib/map/pois'
import { loadPoiImages, poiIconDataUrl } from '@/lib/map/poi-icons'
import {
  mapChromeOptions,
  tightenAttribution,
} from '@/lib/map/mapChrome'
import { isLiteDevice, mapRuntimeOptions } from '@/lib/device-budget'
import { bindMaplibreWorker } from '@/lib/map/maplibre-worker'
import {
  initialMapCenter,
  nearestMapCity,
  readIpDismiss,
  writeIpDismiss,
  writeSavedPlace,
  MAP_CITIES,
  type MapCity,
} from '@/lib/map/user-place'
import { formatGeocodeAddress, type GeocodeHit } from '@/lib/map/geocode'
import { ChromeSearch, type Suggestion } from '@/components/search/SearchSuggest'
// ponytail: construction photo-wrap retired — MapLibre TAS massing only.
// Restore: import { syncConstructionRenders } from '@/lib/map/construction-renders'
import {
  Layers,
  RotateCcw,
  RefreshCw,
  Plus,
  Minus,
  Moon,
  Sun,
  Maximize2,
  Minimize2,
  LocateFixed,
  X,
  Map as MapIcon,
  Circle,
  Satellite,
  SlidersHorizontal,
  Compass,
  Pill,
  School,
  GraduationCap,
  Trees,
  Store,
  Dumbbell,
  Hospital,
  type LucideIcon,
} from 'lucide-react'
import { MetroMark } from '@/lib/map/poi-icons'

const POI_ICONS: Record<PoiCategory, LucideIcon | typeof MetroMark> = {
  metro: MetroMark,
  pharmacy: Pill,
  school: School,
  university: GraduationCap,
  park: Trees,
  shop: Store,
  gym: Dumbbell,
  hospital: Hospital,
}

const SOURCE_ID = 'sivrce-buildings'
const PTS_SOURCE_ID = 'sivrce-buildings-pts'
const FILL_ID = 'sivrce-buildings-fill'
const EXTRUDE_ID = 'sivrce-buildings-3d'
const KEEP_EXTRUDE = new Set([EXTRUDE_ID, FLOORS_FILL_ID])
const LABEL_ID = 'sivrce-buildings-label'
const DOT_ID = 'sivrce-buildings-dot'
const DOT_ACTIVE_ID = 'sivrce-buildings-dot-active'
const PRICE_ID = 'sivrce-buildings-price'
const PRICE_ACTIVE_ID = 'sivrce-buildings-price-on'
const CLUSTER_ID = 'sivrce-buildings-cluster'
const CLUSTER_COUNT_ID = 'sivrce-buildings-cluster-count'
/** Defaults — admin MapPlatformConfig overrides at runtime. */
const DETAIL_ZOOM = 13.5
/** Bottom POI rail height — camera padding so chips don’t eat the map. */
const POI_RAIL_PAD = 56

/** Hide MapLibre extrusion while floor-stack is open for that building. */
function massingHideFilter(hideId: string | null): FilterSpecification | null {
  if (!hideId) return null
  return ['!=', ['get', 'id'], hideId] as FilterSpecification
}
const PRICE_MIN_ZOOM = 11.2
const CLUSTER_MAX_ZOOM = 13
/** Filter recasts — MapLibre paint ms. Radius stays instant so zoom doesn’t lag. */
const MAP_FADE = { duration: 320 } as const

type MapZoomCfg = { detailZoom: number; priceMinZoom: number; clusterMaxZoom: number }

/** Top 3 people love: streets (yellow) · hybrid · clean. */
const TERRAIN_OPTIONS_ALL: { id: MapTerrain; labelKey: DictKey; Icon: LucideIcon }[] = [
  { id: 'streets', labelKey: 'map.terrain.streets', Icon: MapIcon },
  { id: 'satellite', labelKey: 'map.terrain.satellite', Icon: Satellite },
  { id: 'clean', labelKey: 'map.terrain.clean', Icon: Circle },
]

const NBH_SOURCE_ID = 'sivrce-neighborhoods'
const NBH_LABEL_ID = 'sivrce-neighborhoods-label'
const NBH_DATA = neighborhoodsToGeoJSON()
const RAION_SOURCE_ID = 'sivrce-raions'
const RAION_FILL_ID = 'sivrce-raions-fill'
const RAION_LINE_ID = 'sivrce-raions-line'

const POI_SOURCE_ID = 'sivrce-pois'
const POI_ICON_ID = 'sivrce-pois-icon'
const POI_LABEL_LAYER_ID = 'sivrce-pois-label'
const POI_DATA = poisToGeoJSON()

async function ensureLayers(
  map: MlMap,
  buildings: MapBuildingCluster[],
  zooms: MapZoomCfg = {
    detailZoom: DETAIL_ZOOM,
    priceMinZoom: PRICE_MIN_ZOOM,
    clusterMaxZoom: CLUSTER_MAX_ZOOM,
  },
  deal: MapDealFilter = 'all',
) {
  if (map.getSource(SOURCE_ID)) return

  await loadPoiImages(map)
  addPricePillImages(map)

  map.addSource(SOURCE_ID, { type: 'geojson', data: buildingsToGeoJSON(buildings, deal) })
  // ponytail: MapLibre clusters Points only — parallel centroid source for far zoom.
  map.addSource(PTS_SOURCE_ID, {
    type: 'geojson',
    data: buildingsToPointsGeoJSON(buildings, deal),
    cluster: true,
    clusterMaxZoom: zooms.clusterMaxZoom,
    clusterRadius: 52,
    promoteId: 'id',
  })

  map.addLayer({
    id: CLUSTER_ID,
    type: 'circle',
    source: PTS_SOURCE_ID,
    maxzoom: zooms.detailZoom,
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': BRAND.colors.blue,
      'circle-radius': [
        'step',
        ['get', 'point_count'],
        16, 8, 20, 25, 26, 60, 32,
      ],
      'circle-opacity': 0.92,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#FFFFFF',
    },
  })

  map.addLayer({
    id: CLUSTER_COUNT_ID,
    type: 'symbol',
    source: PTS_SOURCE_ID,
    maxzoom: zooms.detailZoom,
    filter: ['has', 'point_count'],
    layout: {
      'text-field': ['get', 'point_count_abbreviated'],
      'text-font': ['Noto Sans Bold'],
      'text-size': 12,
      'text-allow-overlap': true,
    },
    paint: {
      'text-color': '#FFFFFF',
    },
  })

  // Far zoom — unclustered deal/status colored dots. Pills take over at priceMinZoom.
  // Construction = STATUS sky (#5B8BFF) + blue-light ring so it separates from sale blue on navy.
  map.addLayer({
    id: DOT_ID,
    type: 'circle',
    source: PTS_SOURCE_ID,
    maxzoom: zooms.priceMinZoom,
    filter: ['!', ['has', 'point_count']],
    paint: {
      // ponytail: zoom must stay top-level in MapLibre; hover/selected sizes live in DOT_ACTIVE_ID overlay
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        7,
        ['case', ['==', ['get', 'status'], 'construction'], 4.2, 3.5],
        10,
        ['case', ['==', ['get', 'status'], 'construction'], 6.4, 5.5],
        13,
        ['case', ['==', ['get', 'status'], 'construction'], 8.5, 7.5],
      ],
      'circle-color': [
        'case',
        ['==', ['get', 'status'], 'construction'],
        STATUS_BRAND.construction.hue,
        ['==', ['get', 'status'], 'completed'],
        SERVICE_BRAND.developers.hue,
        ['get', 'hue'],
      ],
      'circle-stroke-width': [
        'case',
        ['==', ['get', 'status'], 'construction'],
        2.25,
        1.5,
      ],
      'circle-stroke-color': [
        'case',
        ['==', ['get', 'status'], 'construction'],
        BRAND.colors.blueLight,
        '#FFFFFF',
      ],
      'circle-opacity': [
        'case',
        ['boolean', ['feature-state', 'seen'], false], 0.55,
        0.95,
      ],
      'circle-color-transition': MAP_FADE,
      'circle-opacity-transition': MAP_FADE,
    },
  })

  // Hover/selected dots — same source+filter as base, painted on top; radius 0 hides
  // inactive features (MapLibre forbids feature-state in filters, allows it in paint).
  map.addLayer({
    id: DOT_ACTIVE_ID,
    type: 'circle',
    source: PTS_SOURCE_ID,
    maxzoom: zooms.priceMinZoom,
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-radius': [
        'case',
        ['boolean', ['feature-state', 'selected'], false], 11,
        ['boolean', ['feature-state', 'hover'], false], 9,
        0,
      ],
      'circle-color': [
        'case',
        ['==', ['get', 'status'], 'construction'],
        STATUS_BRAND.construction.hue,
        ['==', ['get', 'status'], 'completed'],
        SERVICE_BRAND.developers.hue,
        ['get', 'hue'],
      ],
      'circle-stroke-width': [
        'case',
        ['boolean', ['feature-state', 'selected'], false], 3,
        ['boolean', ['feature-state', 'hover'], false], 1.5,
        0,
      ],
      'circle-stroke-color': [
        'case',
        ['==', ['get', 'status'], 'construction'],
        BRAND.colors.blueLight,
        '#FFFFFF',
      ],
      'circle-opacity': [
        'case',
        ['any',
          ['boolean', ['feature-state', 'selected'], false],
          ['boolean', ['feature-state', 'hover'], false]],
        ['case', ['boolean', ['feature-state', 'seen'], false], 0.55, 0.95],
        0,
      ],
    },
  })

  // Mid-zoom Airbnb capsules — stretchable white pill + ink price; hide when clustered / footprints.
  const priceFilter: FilterSpecification = [
    'all',
    ['!', ['has', 'point_count']],
    ['!=', ['get', 'priceLabel'], ''],
  ]
  map.addLayer({
    id: PRICE_ID,
    type: 'symbol',
    source: PTS_SOURCE_ID,
    minzoom: zooms.priceMinZoom,
    maxzoom: zooms.detailZoom,
    filter: priceFilter,
    layout: {
      'icon-image': PRICE_PILL_IDLE,
      'icon-text-fit': 'both',
      'icon-text-fit-padding': [5, 10, 5, 10],
      'icon-allow-overlap': false,
      'icon-padding': 4,
      'symbol-sort-key': ['*', -1, ['coalesce', ['get', 'total'], 1]],
      'text-field': ['get', 'priceLabel'],
      'text-size': 12,
      'text-font': ['Noto Sans Bold'],
      'text-anchor': 'center',
      'text-allow-overlap': false,
      'text-padding': 2,
    },
    paint: {
      'text-color': BRAND.colors.ink,
      'icon-opacity': [
        'case',
        [
          'any',
          ['boolean', ['feature-state', 'selected'], false],
          ['boolean', ['feature-state', 'hover'], false],
        ],
        0,
        ['boolean', ['feature-state', 'seen'], false],
        0.55,
        1,
      ],
      'text-opacity': [
        'case',
        [
          'any',
          ['boolean', ['feature-state', 'selected'], false],
          ['boolean', ['feature-state', 'hover'], false],
        ],
        0,
        ['boolean', ['feature-state', 'seen'], false],
        0.55,
        1,
      ],
      'icon-opacity-transition': MAP_FADE,
      'text-opacity-transition': MAP_FADE,
    },
  })
  map.addLayer({
    id: PRICE_ACTIVE_ID,
    type: 'symbol',
    source: PTS_SOURCE_ID,
    minzoom: zooms.priceMinZoom,
    maxzoom: zooms.detailZoom,
    filter: priceFilter,
    layout: {
      'icon-image': PRICE_PILL_ACTIVE,
      'icon-text-fit': 'both',
      'icon-text-fit-padding': [5, 10, 5, 10],
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'text-field': ['get', 'priceLabel'],
      'text-size': 12,
      'text-font': ['Noto Sans Bold'],
      'text-anchor': 'center',
      'text-allow-overlap': true,
      'text-ignore-placement': true,
    },
    paint: {
      'text-color': '#FFFFFF',
      'icon-opacity': [
        'case',
        [
          'any',
          ['boolean', ['feature-state', 'selected'], false],
          ['boolean', ['feature-state', 'hover'], false],
        ],
        1,
        0,
      ],
      'text-opacity': [
        'case',
        [
          'any',
          ['boolean', ['feature-state', 'selected'], false],
          ['boolean', ['feature-state', 'hover'], false],
        ],
        1,
        0,
      ],
    },
  })

  map.addLayer({
    id: FILL_ID,
    type: 'fill',
    source: SOURCE_ID,
    minzoom: zooms.detailZoom,
    paint: {
      'fill-color': ['get', 'color'],
      'fill-opacity': 0.22,
      'fill-color-transition': MAP_FADE,
      'fill-opacity-transition': MAP_FADE,
    },
  })

  map.addLayer({
    id: EXTRUDE_ID,
    type: 'fill-extrusion',
    source: SOURCE_ID,
    minzoom: zooms.detailZoom,
    paint: {
      // ponytail: MapLibre 5 — fill-extrusion-opacity is constant-only; alpha lives in `color`.
      'fill-extrusion-color': ['get', 'color'],
      'fill-extrusion-height': ['get', 'height'],
      'fill-extrusion-base': 0,
      'fill-extrusion-opacity': 1,
      'fill-extrusion-vertical-gradient': true,
      'fill-extrusion-color-transition': MAP_FADE,
    },
  })

  map.addLayer({
    id: LABEL_ID,
    type: 'symbol',
    source: SOURCE_ID,
    minzoom: zooms.detailZoom,
    layout: {
      // Human project names first (Axis Towers, ქინგ დევიდ…); code only if label empty.
      'text-field': [
        'case',
        ['!=', ['get', 'label'], ''],
        ['get', 'label'],
        [
          'case',
          ['!=', ['get', 'code'], ''],
          ['get', 'code'],
          ['to-string', ['get', 'total']],
        ],
      ],
      'text-size': 12,
      'text-font': ['Noto Sans Bold'],
      'text-max-width': 9,
      'text-allow-overlap': false,
      'text-padding': 2,
    },
    paint: {
      'text-color': '#FFFFFF',
      'text-halo-color': BRAND.colors.navy,
      'text-halo-width': 1.6,
    },
  })

  // ——— floor stack for the selected building ———
  ensureFloorLayers(map)

  // ——— 10 Tbilisi raion borders (Nominatim, simplified) ———
  map.addSource(RAION_SOURCE_ID, {
    type: 'geojson',
    data: TBILISI_RAIONS as GeoJSON.FeatureCollection,
  })
  map.addLayer({
    id: RAION_FILL_ID,
    type: 'fill',
    source: RAION_SOURCE_ID,
    minzoom: 9,
    maxzoom: 14,
    paint: {
      'fill-color': BRAND.colors.blue,
      'fill-opacity': 0.06,
    },
  })
  map.addLayer({
    id: RAION_LINE_ID,
    type: 'line',
    source: RAION_SOURCE_ID,
    minzoom: 9,
    maxzoom: 14.5,
    paint: {
      'line-color': BRAND.colors.blue,
      'line-width': 1.2,
      'line-opacity': 0.45,
    },
  })

  // ——— district names always on (Google suburb read) ———
  map.addSource(NBH_SOURCE_ID, { type: 'geojson', data: NBH_DATA })
  map.addLayer({
    id: NBH_LABEL_ID,
    type: 'symbol',
    source: NBH_SOURCE_ID,
    minzoom: 9,
    maxzoom: 15,
    layout: {
      'text-field': ['get', 'name'],
      'text-size': [
        'interpolate', ['linear'], ['zoom'],
        9, 10, 11, 11, 12, 12, 14, 14,
      ],
      'text-font': ['Noto Sans Bold'],
      'text-anchor': 'center',
      'text-justify': 'center',
      'text-max-width': 7,
      'text-padding': 2,
      'text-allow-overlap': false,
      // ponytail: denser ubani sheet — nudge on collision
      'text-variable-anchor': ['center', 'top', 'bottom', 'left', 'right'],
      'text-radial-offset': 0.2,
    },
    paint: {
      'text-color': '#3C4043',
      'text-halo-color': '#FFFFFF',
      'text-halo-width': 2,
      'text-opacity': 0.92,
    },
  })

  // ——— amenity POIs (OSM static) — Lucide sprites on badges ———
  map.addSource(POI_SOURCE_ID, { type: 'geojson', data: POI_DATA })
  map.addLayer({
    id: POI_ICON_ID,
    type: 'symbol',
    source: POI_SOURCE_ID,
    minzoom: 11,
    filter: poiFilterSpec(POI_DEFAULT_ON),
    layout: {
      // sv-poi-{category} — see loadPoiImages
      'icon-image': ['concat', 'sv-poi-', ['get', 'category']] as ExpressionSpecification,
      'icon-size': [
        'interpolate', ['linear'], ['zoom'],
        11, 0.55, 14, 0.72, 16, 0.9,
      ] as ExpressionSpecification,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
    },
  })
  map.addLayer({
    id: POI_LABEL_LAYER_ID,
    type: 'symbol',
    source: POI_SOURCE_ID,
    minzoom: 14.5,
    filter: poiFilterSpec(POI_DEFAULT_ON),
    layout: {
      'text-field': ['get', 'name'],
      'text-size': 11,
      'text-font': ['Noto Sans Bold'],
      'text-offset': [0, 1.35],
      'text-anchor': 'top',
      'text-max-width': 10,
      'text-padding': 2,
      'text-optional': true,
    },
    paint: {
      'text-color': BRAND.colors.ink,
      'text-halo-color': '#FFFFFF',
      'text-halo-width': 1.4,
    },
  })
}

function applyPoiLabelTheme(map: MlMap, dark: boolean) {
  if (!map.getLayer(POI_LABEL_LAYER_ID)) return
  // Dark flips from brand lock: ink→#E9EDFF, halo navy-tint (not pure black).
  map.setPaintProperty(POI_LABEL_LAYER_ID, 'text-color', dark ? '#E9EDFF' : BRAND.colors.ink)
  map.setPaintProperty(POI_LABEL_LAYER_ID, 'text-halo-color', dark ? '#0A1440' : '#FFFFFF')
}

const DEAL_FILTERS: { id: MapDealFilter; labelKey: DictKey; color: string }[] = [
  { id: 'all', labelKey: 'search.all', color: BRAND.colors.blue },
  { id: 'sale', labelKey: 'search.sale', color: DEAL_BRAND.sale },
  { id: 'rent', labelKey: 'search.rent', color: DEAL_BRAND.rent },
  { id: 'daily', labelKey: 'nav.daily', color: DEAL_BRAND.daily },
  { id: 'pledge', labelKey: 'map.pledge', color: DEAL_BRAND.pledge },
]

const KIND_FILTERS: { id: MapKindFilter; labelKey: DictKey; color: string }[] = [
  { id: 'all', labelKey: 'search.all', color: BRAND.colors.blue },
  { id: 'apartment', labelKey: 'prop.apartment', color: CATEGORY_BRAND.apartments.hue },
  { id: 'house', labelKey: 'prop.houseShort', color: CATEGORY_BRAND.houses.hue },
  { id: 'construction', labelKey: 'map.status.construction', color: STATUS_BRAND.construction.hue },
  { id: 'commercial', labelKey: 'prop.commercial', color: CATEGORY_BRAND.commercial.hue },
  { id: 'land', labelKey: 'prop.land', color: CATEGORY_BRAND.land.hue },
  { id: 'hotel', labelKey: 'prop.hotel', color: CATEGORY_BRAND.hotels.hue },
]

function MapFilterPills<T extends string>({
  items,
  value,
  onChange,
  layoutId,
  muted,
  groupLabel,
  size = 'compact',
}: {
  items: { id: T; label: string; color: string; title?: string }[]
  value: T
  onChange: (id: T) => void
  layoutId: string
  muted: string
  groupLabel: string
  size?: 'compact' | 'sheet'
}) {
  const pad = size === 'sheet' ? 'min-h-10 px-3.5 text-[13px]' : 'min-h-8 px-2.5 text-[12px]'
  return (
    <div
      className={`flex gap-0.5 ${size === 'sheet' ? 'flex-wrap' : 'shrink-0'}`}
      role="radiogroup"
      aria-label={groupLabel}
    >
      {items.map((f) => {
        const on = value === f.id
        return (
          <button
            key={f.id}
            type="button"
            role="radio"
            aria-checked={on}
            title={f.title}
            onClick={() => onChange(f.id)}
            className={`relative ${pad} whitespace-nowrap rounded-full font-extrabold tracking-tight transition-colors duration-200 ease-[cubic-bezier(0.21,0.65,0.2,1)] active:scale-[0.97] ${
              on ? 'text-white' : muted
            }`}
          >
            {on && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full shadow-soft"
                style={{ background: f.color }}
                transition={{ type: 'spring', bounce: 0.18, duration: 0.45 }}
              />
            )}
            <span className="relative z-10">{f.label}</span>
          </button>
        )
      })}
    </div>
  )
}

const BUILDING_HIT_LAYERS = [
  EXTRUDE_ID,
  FILL_ID,
  DOT_ID,
  DOT_ACTIVE_ID,
  LABEL_ID,
  PRICE_ID,
  FLOORS_FILL_ID,
] as const

/** Apple-like tap slop around small footprints. */
const HIT_PAD_PX = 18

function Map3DInner({
  dbBuildings = [],
  listings,
  projects = [],
  initialUi,
  platform,
}: {
  dbBuildings?: MapBuildingCluster[]
  listings?: Listing[]
  /** Live directory projects (korter coords). */
  projects?: Project[]
  /** Server-read cookie — avoids first-paint default before document.cookie. */
  initialUi?: MapUiSave
  /** Admin OSM / map knobs from SystemConfig. */
  platform?: MapPlatformConfig
}) {
  const { t } = useI18n()
  const tRef = useRef(t)
  useEffect(() => {
    tRef.current = t
  })
  const searchParams = useSearchParams()
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MlMap | null>(null)
  const visibleRef = useRef<MapBuildingCluster[]>([])
  const allRef = useRef<MapBuildingCluster[]>([])
  const selectRef = useRef<(b: MapBuildingCluster | null) => void>(() => {})
  const deepLinked = useRef(false)

  const centerDefault = platform?.center ?? MAP_CENTER
  const minZoom = platform?.minZoom ?? MAP_MIN_ZOOM
  const floorStacksOn = platform?.floorStacksEnabled ?? false
  const styleUrls = platform
    ? {
        light: platform.styleUrlLight,
        clean: platform.styleUrlClean,
        dark: platform.styleUrlDark,
      }
    : undefined
  const zooms: MapZoomCfg = {
    detailZoom: platform?.detailZoom ?? DETAIL_ZOOM,
    priceMinZoom: platform?.priceMinZoom ?? PRICE_MIN_ZOOM,
    clusterMaxZoom: platform?.clusterMaxZoom ?? CLUSTER_MAX_ZOOM,
  }
  const terrainOptions = TERRAIN_OPTIONS_ALL.filter(
    (o) => o.id !== 'satellite' || (platform?.satelliteEnabled ?? true),
  )

  // ponytail: cookie from SSR when present; else document.cookie / LS migrate.
  const [savedUi] = useState<MapUiSave>(() =>
    initialUi && mapUiHasPrefs(initialUi) ? initialUi : readMapUi(),
  )

  const [liveListings, setLiveListings] = useState<Listing[] | undefined>(listings)
  const [liveDbBuildings, setLiveDbBuildings] = useState(dbBuildings)
  const [selected, setSelected] = useState<MapBuildingCluster | null>(null)
  const [tab, setTab] = useState<DealType | 'all'>('all')
  const [dealFilter, setDealFilter] = useState<MapDealFilter>(() => {
    const q = searchParams.get('deal')
    return DEAL_FILTERS.some((f) => f.id === q) ? (q as MapDealFilter) : 'all'
  })
  const [kindFilter, setKindFilter] = useState<MapKindFilter>(() => {
    const q = searchParams.get('kind')
    const fromUrl = parseMapKind(q)
    if (q && fromUrl !== 'all') return fromUrl
    return searchParams.get('status') === 'construction' ? 'construction' : 'all'
  })
  const [statusFilter, setStatusFilter] = useState<MapStatusFilter>(() =>
    searchParams.get('status') === 'construction' || searchParams.get('kind') === 'construction'
      ? 'construction'
      : 'all',
  )
  const [poiOn, setPoiOn] = useState<PoiCategory[]>(() => {
    const parsed = parsePoiPrefs(savedUi.pois)
    return parsed ?? [...POI_DEFAULT_ON]
  })
  const [floorFilter, setFloorFilter] = useState<number | null>(null)
  const [view3d, setView3d] = useState(() =>
    savedUi.view3d != null
      ? savedUi.view3d
      : isLiteDevice()
        ? false
        : (platform?.defaultView3d ?? true),
  )
  const [terrain, setTerrain] = useState<MapTerrain>(() => {
    if (savedUi.terrain) return parseTerrain(savedUi.terrain)
    return parseTerrain(platform?.defaultTerrain)
  })
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [layersOpen, setLayersOpen] = useState(false)
  const [bearing, setBearing] = useState(() =>
    mapBootCamera(
      savedUi.view3d != null
        ? savedUi.view3d
        : isLiteDevice()
          ? false
          : (platform?.defaultView3d ?? true),
    ).bearing,
  )
  const [fullscreen, setFullscreen] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ipSuggest, setIpSuggest] = useState<MapCity | null>(null)
  const [locating, setLocating] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshNote, setRefreshNote] = useState<string | null>(null)
  const { resolvedTheme, setTheme } = useTheme()
  // ponytail: light-first (ThemeProvider default); avoid flash before hydration.
  const isDark = resolvedTheme === 'dark'
  const themeReady = resolvedTheme != null

  const shellRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<MapBuildingCluster | null>(null)
  const view3dRef = useRef(view3d)
  const dealRef = useRef<MapDealFilter>(dealFilter)
  const floorRef = useRef<(n: number) => void>(() => {})
  const popupRef = useRef<maplibregl.Popup | null>(null)
  const userDotRef = useRef<maplibregl.Marker | null>(null)
  const selFsRef = useRef<string | null>(null)
  const hoverFsRef = useRef<string | null>(null)
  const darkRef = useRef(isDark)
  const terrainRef = useRef<MapTerrain>(terrain)
  const poiOnRef = useRef(poiOn)
  const styleGenRef = useRef(0)
  const styleUrlRef = useRef<string | null>(null)
  const remountRef = useRef<(() => void) | null>(null)
  const refreshNoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => { darkRef.current = isDark }, [isDark])
  useEffect(() => { terrainRef.current = terrain }, [terrain])
  useEffect(() => { view3dRef.current = view3d }, [view3d])
  useEffect(() => { poiOnRef.current = poiOn }, [poiOn])
  useEffect(() => {
    writeMapUi({
      terrain,
      view3d,
      pois: serializePoiPrefs(poiOn),
    })
  }, [terrain, view3d, poiOn])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.getLayer(POI_ICON_ID)) return
    const apply = () => {
      const filter = poiFilterSpec(poiOn, map.getZoom())
      map.setFilter(POI_ICON_ID, filter)
      if (map.getLayer(POI_LABEL_LAYER_ID)) map.setFilter(POI_LABEL_LAYER_ID, filter)
    }
    apply()
    map.on('zoom', apply)
    return () => {
      map.off('zoom', apply)
    }
  }, [poiOn])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    applyPoiLabelTheme(map, isDark)
  }, [isDark])

  const togglePoi = useCallback((id: PoiCategory) => {
    setPoiOn((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    )
  }, [])

  useEffect(() => {
    const onFs = () => {
      setFullscreen(Boolean(document.fullscreenElement))
      // MapLibre needs a resize after browser chrome goes away.
      requestAnimationFrame(() => mapRef.current?.resize())
    }
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  useEffect(() => () => {
    if (refreshNoteTimer.current) clearTimeout(refreshNoteTimer.current)
  }, [])

  const toggleFullscreen = () => {
    const el = shellRef.current
    if (!el) return
    if (document.fullscreenElement) void document.exitFullscreen()
    else void el.requestFullscreen()
  }

  const pickTerrain = useCallback((id: MapTerrain) => {
    setTerrain(id)
    // Google street colors only on light; hybrid works in night too.
    if (id === 'streets' || id === 'clean') {
      if (resolvedTheme === 'dark') setTheme('light')
    }
  }, [resolvedTheme, setTheme])

  const flashRefreshNote = useCallback((msg: string) => {
    if (refreshNoteTimer.current) clearTimeout(refreshNoteTimer.current)
    setRefreshNote(msg)
    refreshNoteTimer.current = setTimeout(() => setRefreshNote(null), 2800)
  }, [])

  const refreshMapData = useCallback(async () => {
    if (refreshing) return
    setRefreshing(true)
    try {
      const res = await fetch('/api/map-data', { cache: 'no-store' })
      if (!res.ok) throw new Error(`map-data ${res.status}`)
      const data = (await res.json()) as {
        listings: Listing[]
        buildings: MapBuildingCluster[]
      }
      const prevIds = new Set((liveListings ?? []).map((l) => l.id))
      const added = data.listings.filter((l) => !prevIds.has(l.id)).length
      setLiveListings(data.listings)
      setLiveDbBuildings(data.buildings)
      flashRefreshNote(
        added > 0 ? tRef.current('map.refreshAdded', { n: added }) : tRef.current('map.refreshed'),
      )
    } catch (err) {
      console.error('[Map3D] refresh', err)
      flashRefreshNote(tRef.current('map.refreshFail'))
    } finally {
      setRefreshing(false)
    }
  }, [refreshing, liveListings, flashRefreshNote])

  // ponytail: SSR getMapListings can be a stale empty cache; live /api/map-data fills pins.
  useEffect(() => {
    if ((listings?.length ?? 0) > 0) return
    let cancelled = false
    fetch('/api/map-data', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { listings?: Listing[]; buildings?: MapBuildingCluster[] } | null) => {
        if (cancelled || !data?.listings?.length) return
        setLiveListings(data.listings)
        if (data.buildings) setLiveDbBuildings(data.buildings)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [listings])

  // Live DB listings when present (incl. empty).
  const sourceListings = liveListings ?? []
  const dbProjectSlugs = useMemo(() => {
    const s = new Set<string>()
    for (const b of liveDbBuildings ?? []) if (b.projectSlug) s.add(b.projectSlug)
    return s
  }, [liveDbBuildings])
  const baseBuildings = useMemo(() => {
    const forGhosts = projects.filter((p) => !dbProjectSlugs.has(p.slug))
    return mergeMapBuildings(
      clusterListingsToBuildings(sourceListings),
      projectsToConstructionBuildings(forGhosts),
    )
  }, [sourceListings, projects, dbProjectSlugs])
  const allBuildings = useMemo(
    () =>
      applyLiveProjectPins(mergeDbBuildings(baseBuildings, liveDbBuildings), projects),
    [baseBuildings, liveDbBuildings, projects],
  )
  useEffect(() => { allRef.current = allBuildings }, [allBuildings])

  // Keep open panel in sync with live data + the active deal/kind slice.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync selection after live data swap
    setSelected((cur) => {
      if (!cur) return cur
      return allBuildings.find((b) => b.id === cur.id) ?? null
    })
  }, [allBuildings])

  const visible = useMemo(
    () => filterBuildings(allBuildings, dealFilter, statusFilter, kindFilter),
    [allBuildings, dealFilter, statusFilter, kindFilter],
  )
  const matchListings = useMemo(() => {
    let n = 0
    for (const b of visible) n += b.listings.length
    return n
  }, [visible])
  useEffect(() => { visibleRef.current = visible }, [visible])
  useEffect(() => { selectedRef.current = selected }, [selected])
  useEffect(() => { dealRef.current = dealFilter }, [dealFilter])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- panel listings follow deal/kind slice
    setSelected((cur) => {
      if (!cur) return cur
      return visible.find((b) => b.id === cur.id) ?? null
    })
  }, [visible])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- panel tab follows map deal chip
    setTab(dealFilter === 'all' ? 'all' : dealFilter)
  }, [dealFilter])

  const selectBuilding = useCallback((b: MapBuildingCluster | null) => {
    setSelected(b)
    setTab(dealFilter === 'all' ? 'all' : dealFilter)
    setFloorFilter(null)
  }, [dealFilter, setSelected, setTab, setFloorFilter])

  const patchFilterUrl = useCallback(
    (deal: MapDealFilter, kind: MapKindFilter) => {
      const next = new URLSearchParams(searchParams.toString())
      if (deal === 'all') next.delete('deal')
      else next.set('deal', deal)
      if (kind === 'all') next.delete('kind')
      else next.set('kind', kind)
      if (kind === 'construction') next.set('status', 'construction')
      else next.delete('status')
      const qs = next.toString()
      router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false })
    },
    [router, searchParams],
  )
  const pickDeal = useCallback(
    (deal: MapDealFilter) => {
      setDealFilter(deal)
      patchFilterUrl(deal, kindFilter)
    },
    [kindFilter, patchFilterUrl],
  )
  const pickKind = useCallback(
    (kind: MapKindFilter) => {
      setKindFilter(kind)
      setStatusFilter(kind === 'construction' ? 'construction' : 'all')
      patchFilterUrl(dealFilter, kind)
    },
    [dealFilter, patchFilterUrl],
  )
  useEffect(() => { selectRef.current = selectBuilding }, [selectBuilding])
  const toggleFloor = useCallback((n: number) => setFloorFilter((cur) => (cur === n ? null : n)), [setFloorFilter])
  useEffect(() => { floorRef.current = toggleFloor }, [toggleFloor])

  // Selected / seen pins — feature-state (no GeoJSON rewrite).
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const prev = selFsRef.current
    const next = selected?.id ?? null
    if (prev && prev !== next) {
      try {
        map.setFeatureState({ source: PTS_SOURCE_ID, id: prev }, { selected: false })
      } catch { /* source may remount */ }
    }
    if (next) {
      try {
        map.setFeatureState(
          { source: PTS_SOURCE_ID, id: next },
          { selected: true, seen: true },
        )
      } catch { /* source may remount */ }
    }
    selFsRef.current = next
  }, [selected, ready])

  // Vague pin (district-only) → reverse Nominatim for street + house №. No map server.
  useEffect(() => {
    if (!selected) return
    if (/\d/.test(selected.address)) return
    const id = selected.id
    const { lat, lng } = selected
    const ac = new AbortController()
    fetch(`/api/geocode?lat=${lat}&lng=${lng}`, { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: (GeocodeHit & { ok?: boolean }) | null) => {
        if (!d?.ok) return
        const line = formatGeocodeAddress(d)
        if (!line) return
        setSelected((cur) => {
          if (!cur || cur.id !== id) return cur
          if (/\d/.test(cur.address) && !/\d/.test(line)) return cur
          if (cur.address === line) return cur
          return {
            ...cur,
            address: line,
            buildingNumber: d.houseNo || cur.buildingNumber,
            district: d.district || cur.district,
            city: d.city || cur.city,
          }
        })
      })
      .catch(() => {})
    return () => ac.abort()
    // ponytail: id-only — don't re-fetch after we fill address
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [selected?.id])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const src = map.getSource(SOURCE_ID) as GeoJSONSource | undefined
    src?.setData(buildingsToGeoJSON(visible, dealFilter))
    const pts = map.getSource(PTS_SOURCE_ID) as GeoJSONSource | undefined
    pts?.setData(buildingsToPointsGeoJSON(visible, dealFilter))
    let cancelled = false
    // ponytail: geometric MapLibre massing only (no photo-wrap sync).
    const runMassing = () => {
      if (cancelled || !mapRef.current) return
      const showFloors = Boolean(selected && buildingShowsFloorStack(selected, floorStacksOn))
      const hideId = showFloors && selected ? selected.id : null
      const hide = massingHideFilter(hideId)
      for (const layer of [EXTRUDE_ID, FILL_ID]) {
        if (!map.getLayer(layer)) continue
        map.setFilter(layer, hide)
      }
    }
    const ric = window.requestIdleCallback?.(runMassing, { timeout: 900 })
    const tid = ric == null ? window.setTimeout(runMassing, 0) : 0
    if (selected && !visible.some((b) => b.id === selected.id)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- deselect when filters hide it
      selectBuilding(null)
    }
    return () => {
      cancelled = true
      if (ric != null) window.cancelIdleCallback?.(ric)
      if (tid) window.clearTimeout(tid)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [visible, ready, selected, selectBuilding, floorStacksOn])

  // Floor stack only for developments with stock — else keep solid extrusion.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const showFloors = Boolean(selected && buildingShowsFloorStack(selected, floorStacksOn))
    const src = map.getSource(FLOORS_SOURCE_ID) as GeoJSONSource | undefined
    src?.setData(
      showFloors && selected ? floorsToGeoJSON(selected, dealFilter) : EMPTY_FLOORS,
    )
    if (!showFloors) popupRef.current?.remove()
    const hideId = showFloors && selected ? selected.id : null
    const hide = massingHideFilter(hideId)
    for (const layer of [EXTRUDE_ID, FILL_ID]) {
      if (!map.getLayer(layer)) continue
      map.setFilter(layer, hide)
    }
    // Labels stay; only hide label for floor-stack building
    if (map.getLayer(LABEL_ID)) {
      map.setFilter(
        LABEL_ID,
        (hideId ? ['!=', ['get', 'id'], hideId] : null) as FilterSpecification | null,
      )
    }
    if (map.getLayer(DOT_ID)) {
      map.setFilter(
        DOT_ID,
        (hideId
          ? ['all', ['!', ['has', 'point_count']], ['!=', ['get', 'id'], hideId]]
          : ['!', ['has', 'point_count']]) as FilterSpecification,
      )
    }
    if (map.getLayer(DOT_ACTIVE_ID)) {
      map.setFilter(
        DOT_ACTIVE_ID,
        (hideId
          ? ['all', ['!', ['has', 'point_count']], ['!=', ['get', 'id'], hideId]]
          : ['!', ['has', 'point_count']]) as FilterSpecification,
      )
    }
    if (map.getLayer(PRICE_ID) || map.getLayer(PRICE_ACTIVE_ID)) {
      const priceHide = (
        hideId
          ? [
              'all',
              ['!', ['has', 'point_count']],
              ['!=', ['get', 'priceLabel'], ''],
              ['!=', ['get', 'id'], hideId],
            ]
          : [
              'all',
              ['!', ['has', 'point_count']],
              ['!=', ['get', 'priceLabel'], ''],
            ]
      ) as FilterSpecification
      if (map.getLayer(PRICE_ID)) map.setFilter(PRICE_ID, priceHide)
      if (map.getLayer(PRICE_ACTIVE_ID)) map.setFilter(PRICE_ACTIVE_ID, priceHide)
    }
  }, [selected, dealFilter, ready, floorStacksOn])

  // Deep-link ?deal= ?kind= ?status=construction
  useEffect(() => {
    if (!ready) return
    const dealQ = searchParams.get('deal')
    if (DEAL_FILTERS.some((f) => f.id === dealQ)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- URL is the shareable source of truth
      setDealFilter(dealQ as MapDealFilter)
    }
    const kindQ = searchParams.get('kind')
    const kind = parseMapKind(kindQ)
    const status = searchParams.get('status')
    if (kindQ && kind !== 'all') {
      setKindFilter(kind)
      setStatusFilter(kind === 'construction' ? 'construction' : 'all')
    } else if (status === 'construction') {
      setKindFilter('construction')
      setStatusFilter('construction')
    }
  }, [ready, searchParams])

  useEffect(() => {
    if (!ready || deepLinked.current) return
    const slug = searchParams.get('building')
    const listingId = searchParams.get('listing')
    const lat = Number(searchParams.get('lat'))
    const lng = Number(searchParams.get('lng'))
    const zoomQ = Number(searchParams.get('zoom'))
    const pitchQ = Number(searchParams.get('pitch'))
    const floorQ = Number(searchParams.get('floor'))
    const dealQ = searchParams.get('deal')
    const dealOk: DealType | null =
      dealQ === 'sale' || dealQ === 'rent' || dealQ === 'daily' || dealQ === 'pledge'
        ? dealQ
        : null
    const hasLink = Boolean(
      slug || listingId || (Number.isFinite(lat) && Number.isFinite(lng)),
    )
    if (!hasLink) return

    let b = slug ? findBuildingBySlug(slug, allBuildings) : null
    if (!b && listingId) b = findBuildingForListing(listingId, allBuildings)
    if (!b && Number.isFinite(lat) && Number.isFinite(lng)) {
      b = findNearestBuilding(lat, lng, allBuildings, 250)
    }
    const flyLat = b?.lat ?? (Number.isFinite(lat) ? lat : null)
    const flyLng = b?.lng ?? (Number.isFinite(lng) ? lng : null)
    if (flyLat == null || flyLng == null) return

    deepLinked.current = true
    if (b) {
      // ponytail: skip selectBuilding — it resets tab/floor before listing deep-link applies.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot deep-link from URL param
      setSelected(b)
      setTab(dealOk ?? 'all')
      setFloorFilter(Number.isFinite(floorQ) && floorQ > 0 ? floorQ : null)
      if (dealOk) setDealFilter(dealOk)
    }
    mapRef.current?.easeTo({
      center: [flyLng, flyLat],
      zoom: Number.isFinite(zoomQ) && zoomQ >= minZoom ? zoomQ : 16,
      pitch: Number.isFinite(pitchQ) ? pitchQ : view3dRef.current ? 62 : 0,
      bearing: view3dRef.current ? -18 : 0,
      duration: 900,
      essential: true,
    })
  }, [ready, searchParams, allBuildings])

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !themeReady) return

    let cancelled = false
    let ro: ResizeObserver | null = null
    let watchdog: ReturnType<typeof setTimeout> | undefined
    const initialStyle = mapStyleUrl(darkRef.current, terrainRef.current, styleUrls)
    styleUrlRef.current = initialStyle
    const container = containerRef.current

    ;(async () => {
      let style
      try {
        style = await loadMapBasemap(initialStyle)
      } catch (err) {
        console.error('[Map3D] style', err)
        try {
          style = await loadMapBasemap(STYLE_SATELLITE)
        } catch {
          if (!cancelled) setError(tRef.current('map.error'))
          return
        }
      }
      if (cancelled || mapRef.current) return

      const bootCam = mapBootCamera(view3dRef.current)
      const boot = initialMapCenter()
      bindMaplibreWorker(maplibregl)
      const map = new maplibregl.Map({
        container,
        style,
        center: [boot.lng, boot.lat],
        zoom: 13.2,
        pitch: bootCam.pitch,
        bearing: bootCam.bearing,
        maxPitch: 70,
        minZoom,
        maxBounds: GEORGIA_MAX_BOUNDS,
        renderWorldCopies: false,
        fadeDuration: 0,
        ...mapRuntimeOptions(),
        ...mapChromeOptions(),
      })
      mapRef.current = map

      bindMissingImages(map)

      const flyTo = (b: MapBuildingCluster) => {
        const three = view3dRef.current
        map.easeTo({
          center: [b.lng, b.lat],
          zoom: Math.max(map.getZoom(), 15.5),
          pitch: three ? 62 : 0,
          bearing: three ? map.getBearing() : 0,
          duration: 700,
          essential: true,
        })
      }

      const pickById = (id: string) => {
        const b =
          visibleRef.current.find((x) => x.id === id) ?? allRef.current.find((x) => x.id === id)
        if (!b) return
        selectRef.current(b)
        flyTo(b)
      }

      const onFeatureClick = (e: MapLayerMouseEvent) => {
        e.originalEvent.stopPropagation()
        const id = e.features?.[0]?.properties?.id as string | undefined
        if (id) pickById(id)
      }

      const onMapClick = (e: MapMouseEvent) => {
        const liveLayers = [
          ...BUILDING_HIT_LAYERS,
          CLUSTER_ID,
          POI_ICON_ID,
          POI_LABEL_LAYER_ID,
          NBH_LABEL_ID,
        ].filter((id) => map.getLayer(id))
        const hits = map.queryRenderedFeatures(e.point, { layers: liveLayers })
        if (hits.length > 0) return
        const pad = HIT_PAD_PX
        const near = map.queryRenderedFeatures(
          [
            [e.point.x - pad, e.point.y - pad],
            [e.point.x + pad, e.point.y + pad],
          ],
          { layers: BUILDING_HIT_LAYERS.filter((id) => map.getLayer(id)) },
        )
        const id = near[0]?.properties?.id as string | undefined
        if (id) {
          pickById(id)
          return
        }
        selectRef.current(null)
      }

      const popup = new maplibregl.Popup({
        className: 'sivrce-floor-pop',
        closeButton: false,
        closeOnClick: false,
        offset: 12,
        maxWidth: '260px',
      })
      popupRef.current = popup

      let hoveredFloor: number | null = null
      const clearFloorHover = () => {
        if (hoveredFloor != null) {
          map.setFeatureState({ source: FLOORS_SOURCE_ID, id: hoveredFloor }, { hover: false })
          hoveredFloor = null
        }
        popup.remove()
        map.getCanvas().style.cursor = ''
      }

      const onFloorMove = (e: MapLayerMouseEvent) => {
        const f = e.features?.[0]
        if (!f) return
        const p = f.properties ?? {}
        const n = Number(p.floor)
        if (!Number.isFinite(n)) return
        if (hoveredFloor !== n) {
          if (hoveredFloor != null) {
            map.setFeatureState({ source: FLOORS_SOURCE_ID, id: hoveredFloor }, { hover: false })
          }
          hoveredFloor = n
          map.setFeatureState({ source: FLOORS_SOURCE_ID, id: n }, { hover: true })
        }
        map.getCanvas().style.cursor = 'pointer'
        const b = selectedRef.current
        const info: FloorInfo = {
          n,
          available: Number(p.available) || 0,
          minPriceGEL: Number(p.minPrice) || null,
        }
        const tip = floorTooltipKa(info, {
          ghost: Boolean(p.ghost),
          progress: b?.progress,
          showPrice: dealRef.current !== 'all',
        })
        const root = document.createElement('div')
        const title = document.createElement('div')
        title.className = 'sivrce-floor-pop-title'
        title.textContent = tip.title
        root.appendChild(title)
        for (const line of tip.lines) {
          const div = document.createElement('div')
          div.className = 'sivrce-floor-pop-line'
          div.textContent = line
          root.appendChild(div)
        }
        popup.setLngLat(e.lngLat).setDOMContent(root).addTo(map)
      }

      const onFloorClick = (e: MapLayerMouseEvent) => {
        e.originalEvent.stopPropagation()
        const n = Number(e.features?.[0]?.properties?.floor)
        if (
          Number.isFinite(n) &&
          n > 0 &&
          (selectedRef.current?.listings.length ?? 0) > 0
        ) {
          floorRef.current(n)
        }
      }

      const nbhPopup = new maplibregl.Popup({
        className: 'sivrce-nbh-pop',
        closeButton: true,
        closeOnClick: true,
        offset: 18,
        maxWidth: '260px',
      })

      const onNeighborhoodClick = (e: MapLayerMouseEvent) => {
        e.originalEvent.stopPropagation()
        const f = e.features?.[0]
        if (!f) return
        const p = f.properties ?? {}
        const hasGuide = p.hasGuide === true || p.hasGuide === 'true'
        const scoreRow = (label: string, v: number) => {
          const row = document.createElement('div')
          row.className = 'sivrce-nbh-pop-row'
          const lab = document.createElement('span')
          lab.textContent = label
          const val = document.createElement('span')
          val.textContent = String(v)
          row.appendChild(lab)
          row.appendChild(val)
          return row
        }
        const root = document.createElement('div')
        root.className = 'sivrce-nbh-pop'
        const title = document.createElement('div')
        title.className = 'sivrce-nbh-pop-title'
        title.textContent = String(p.name)
        root.appendChild(title)
        const city = document.createElement('div')
        city.className = 'sivrce-nbh-pop-city'
        city.textContent = String(p.city)
        root.appendChild(city)
        if (hasGuide) {
          const price = document.createElement('div')
          price.className = 'sivrce-nbh-pop-price'
          price.textContent = `~$${Number(p.avgPriceM2USD).toLocaleString('en-US')}/m²`
          root.appendChild(price)
          root.appendChild(scoreRow('ტრანსპორტი', Number(p.transport)))
          root.appendChild(scoreRow('სკოლები', Number(p.schools)))
          root.appendChild(scoreRow('მწვანე', Number(p.green)))
          root.appendChild(scoreRow('უსაფრთხოება', Number(p.safety)))
          root.appendChild(scoreRow('ღამის ცხოვრება', Number(p.nightlife)))
        }
        nbhPopup.setLngLat(e.lngLat).setDOMContent(root).addTo(map)
      }

      const onNeighborhoodEnter = () => {
        map.getCanvas().style.cursor = 'pointer'
      }
      const onNeighborhoodLeave = () => {
        map.getCanvas().style.cursor = ''
      }

      const poiPopup = new maplibregl.Popup({
        className: 'sivrce-nbh-pop',
        closeButton: true,
        closeOnClick: true,
        offset: 14,
        maxWidth: '220px',
      })

      const onPoiClick = (e: MapLayerMouseEvent) => {
        e.originalEvent.stopPropagation()
        const f = e.features?.[0]
        if (!f) return
        const p = f.properties ?? {}
        const cat = String(p.category ?? '') as PoiCategory
        const root = document.createElement('div')
        root.className = 'sivrce-nbh-pop'
        root.style.display = 'flex'
        root.style.gap = '10px'
        root.style.alignItems = 'flex-start'
        if (isPoiCategory(cat)) {
          const img = document.createElement('img')
          img.src = poiIconDataUrl(cat)
          img.width = 32
          img.height = 32
          img.alt = ''
          img.style.flexShrink = '0'
          img.style.borderRadius = '999px'
          root.appendChild(img)
        }
        const text = document.createElement('div')
        const kind = document.createElement('div')
        kind.className = 'sivrce-nbh-pop-city'
        const key = `map.poi.${cat}` as DictKey
        kind.textContent = isPoiCategory(cat)
          ? tRef.current(key)
          : String(p.label ?? '')
        text.appendChild(kind)
        const title = document.createElement('div')
        title.className = 'sivrce-nbh-pop-title'
        title.textContent = String(p.name ?? '')
        text.appendChild(title)
        root.appendChild(text)
        const coords = (f.geometry as GeoJSON.Point).coordinates
        poiPopup.setLngLat([coords[0]!, coords[1]!]).setDOMContent(root).addTo(map)
      }

      const onPoiEnter = () => {
        map.getCanvas().style.cursor = 'pointer'
      }
      const onPoiLeave = () => {
        map.getCanvas().style.cursor = ''
      }

      const mountOverlays = () => {
        void (async () => {
          applyBrandPaints(map, darkRef.current ? 'dark' : 'light', terrainRef.current)
          await ensureLayers(map, visibleRef.current, zooms, dealRef.current)
          muteBasemapExtrusions(map, KEEP_EXTRUDE)
          const poiFilter = poiFilterSpec(poiOnRef.current, map.getZoom())
          if (map.getLayer(POI_ICON_ID)) map.setFilter(POI_ICON_ID, poiFilter)
          if (map.getLayer(POI_LABEL_LAYER_ID)) map.setFilter(POI_LABEL_LAYER_ID, poiFilter)
          applyPoiLabelTheme(map, darkRef.current)
          tightenAttribution(map)
          const showFloors = Boolean(
            selectedRef.current && buildingShowsFloorStack(selectedRef.current, floorStacksOn),
          )
          const floorsSrc = map.getSource(FLOORS_SOURCE_ID) as GeoJSONSource | undefined
          floorsSrc?.setData(
            showFloors && selectedRef.current
              ? floorsToGeoJSON(selectedRef.current, dealRef.current)
              : EMPTY_FLOORS,
          )
          const hideId =
            showFloors && selectedRef.current ? selectedRef.current.id : null
          for (const layer of [EXTRUDE_ID, FILL_ID, LABEL_ID]) {
            if (!map.getLayer(layer)) continue
            map.setFilter(
              layer,
              (hideId ? ['!=', ['get', 'id'], hideId] : null) as FilterSpecification | null,
            )
          }
          if (map.getLayer(DOT_ID)) {
            map.setFilter(
              DOT_ID,
              (hideId
                ? ['all', ['!', ['has', 'point_count']], ['!=', ['get', 'id'], hideId]]
                : ['!', ['has', 'point_count']]) as FilterSpecification,
            )
          }
          const dark = darkRef.current
          // District + building labels — Google night readable
          if (map.getLayer(NBH_LABEL_ID)) {
            try {
              map.setPaintProperty(NBH_LABEL_ID, 'text-color', dark ? '#E9EDFF' : '#3C4043')
              map.setPaintProperty(
                NBH_LABEL_ID,
                'text-halo-color',
                dark ? BRAND.colors.navy : '#FFFFFF',
              )
              map.setPaintProperty(NBH_LABEL_ID, 'text-halo-width', dark ? 2.2 : 2)
            } catch {
              /* paint may differ */
            }
          }
          if (map.getLayer(RAION_FILL_ID)) {
            try {
              map.setPaintProperty(RAION_FILL_ID, 'fill-opacity', dark ? 0.1 : 0.06)
            } catch {
              /* paint may differ */
            }
          }
          if (map.getLayer(RAION_LINE_ID)) {
            try {
              map.setPaintProperty(
                RAION_LINE_ID,
                'line-color',
                dark ? BRAND.colors.blueLight : BRAND.colors.blue,
              )
              map.setPaintProperty(RAION_LINE_ID, 'line-opacity', dark ? 0.55 : 0.45)
            } catch {
              /* paint may differ */
            }
          }
          if (map.getLayer(POI_LABEL_LAYER_ID)) {
            try {
              map.setPaintProperty(
                POI_LABEL_LAYER_ID,
                'text-color',
                dark ? '#E9EDFF' : BRAND.colors.ink,
              )
              map.setPaintProperty(
                POI_LABEL_LAYER_ID,
                'text-halo-color',
                dark ? BRAND.colors.navy : '#FFFFFF',
              )
            } catch {
              /* paint may differ */
            }
          }
          if (map.getLayer(DOT_ID)) {
            try {
              // Keep construction sky stroke — never flatten to white/blueLight for all.
              map.setPaintProperty(DOT_ID, 'circle-stroke-color', [
                'case',
                ['==', ['get', 'status'], 'construction'],
                BRAND.colors.blueLight,
                dark ? BRAND.colors.blueLight : '#FFFFFF',
              ])
              map.setPaintProperty(DOT_ID, 'circle-stroke-width', [
                'case',
                ['==', ['get', 'status'], 'construction'],
                2.25,
                dark ? 2 : 1.5,
              ])
              map.setPaintProperty(DOT_ID, 'circle-opacity', 1)
            } catch {
              /* paint may differ */
            }
          }
          if (map.getLayer(PRICE_ID)) {
            try {
              map.setPaintProperty(PRICE_ID, 'text-color', BRAND.colors.ink)
            } catch {
              /* paint may differ */
            }
          }
          if (map.getLayer(CLUSTER_ID)) {
            try {
              map.setPaintProperty(
                CLUSTER_ID,
                'circle-stroke-color',
                dark ? BRAND.colors.blueLight : '#FFFFFF',
              )
            } catch {
              /* paint may differ */
            }
          }
          if (map.getLayer(FILL_ID)) {
            try {
              map.setPaintProperty(FILL_ID, 'fill-opacity', dark ? 0.38 : 0.22)
            } catch {
              /* paint may differ */
            }
          }
          const labelColor = dark ? '#FFFFFF' : BRAND.colors.ink
          const labelHalo = dark ? BRAND.colors.navy : '#FFFFFF'
          for (const layer of [LABEL_ID, FLOORS_LABEL_ID]) {
            if (!map.getLayer(layer)) continue
            try {
              map.setPaintProperty(layer, 'text-color', labelColor)
              map.setPaintProperty(layer, 'text-halo-color', labelHalo)
              map.setPaintProperty(layer, 'text-halo-width', dark ? 2 : 1.6)
            } catch {
              /* layer paint may differ */
            }
          }
          muteBasemapExtrusions(map, KEEP_EXTRUDE)
          // Re-apply 2D/3D fill after style remount
          if (!view3dRef.current && map.getLayer(EXTRUDE_ID)) {
            map.setLayoutProperty(EXTRUDE_ID, 'visibility', 'none')
            if (map.getLayer(FILL_ID)) {
              map.setPaintProperty(FILL_ID, 'fill-opacity', dark ? 0.72 : 0.5)
            }
          }
        })()
      }

      let booted = false
      const reveal = () => {
        if (cancelled || booted) return
        booted = true
        if (watchdog) clearTimeout(watchdog)
        map.resize()
        mountOverlays()
        setReady(true)
      }
      // ponytail: mask geojson used to block `load` forever; style.load is sync on inline JSON so we miss it. Watchdog + load.
      map.on('load', reveal)
      if (map.loaded()) reveal()
      watchdog = window.setTimeout(reveal, 1600)

      ro = new ResizeObserver(() => map.resize())
      ro.observe(container)

      map.on('error', (e) => {
        // Tile blips during setStyle must not kill the UI — only log.
        console.error('[Map3D]', e.error ?? e)
      })

      map.on('mouseenter', EXTRUDE_ID, () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', EXTRUDE_ID, () => {
        map.getCanvas().style.cursor = ''
      })
      map.on('mouseenter', DOT_ID, () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mousemove', DOT_ID, (e: MapLayerMouseEvent) => {
        const id = e.features?.[0]?.properties?.id as string | undefined
        if (!id || hoverFsRef.current === id) return
        if (hoverFsRef.current) {
          try {
            map.setFeatureState(
              { source: PTS_SOURCE_ID, id: hoverFsRef.current },
              { hover: false },
            )
          } catch { /* remount */ }
        }
        hoverFsRef.current = id
        try {
          map.setFeatureState({ source: PTS_SOURCE_ID, id }, { hover: true })
        } catch { /* remount */ }
      })
      map.on('mouseleave', DOT_ID, () => {
        map.getCanvas().style.cursor = ''
        if (hoverFsRef.current) {
          try {
            map.setFeatureState(
              { source: PTS_SOURCE_ID, id: hoverFsRef.current },
              { hover: false },
            )
          } catch { /* remount */ }
          hoverFsRef.current = null
        }
      })
      map.on('mouseenter', CLUSTER_ID, () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', CLUSTER_ID, () => {
        map.getCanvas().style.cursor = ''
      })
      map.on('click', EXTRUDE_ID, onFeatureClick)
      map.on('click', FILL_ID, onFeatureClick)
      map.on('click', DOT_ID, onFeatureClick)
      map.on('click', LABEL_ID, onFeatureClick)
      map.on('click', PRICE_ID, onFeatureClick)
      map.on('click', CLUSTER_ID, (e: MapLayerMouseEvent) => {
        e.originalEvent.stopPropagation()
        const f = e.features?.[0]
        if (!f || f.geometry.type !== 'Point') return
        const clusterId = f.properties?.cluster_id as number | undefined
        if (clusterId == null) return
        const src = map.getSource(PTS_SOURCE_ID) as GeoJSONSource
        const [lng, lat] = f.geometry.coordinates
        void src.getClusterExpansionZoom(clusterId).then((zoom) => {
          map.easeTo({ center: [lng, lat], zoom, duration: 450 })
        })
      })
      map.on('mousemove', FLOORS_FILL_ID, onFloorMove)
      map.on('mouseleave', FLOORS_FILL_ID, clearFloorHover)
      map.on('click', FLOORS_FILL_ID, onFloorClick)
      map.on('click', NBH_LABEL_ID, onNeighborhoodClick)
      map.on('mouseenter', NBH_LABEL_ID, onNeighborhoodEnter)
      map.on('mouseleave', NBH_LABEL_ID, onNeighborhoodLeave)
      map.on('click', POI_ICON_ID, onPoiClick)
      map.on('click', POI_LABEL_LAYER_ID, onPoiClick)
      map.on('mouseenter', POI_ICON_ID, onPoiEnter)
      map.on('mouseleave', POI_ICON_ID, onPoiLeave)
      map.on('rotate', () => setBearing(map.getBearing()))
      map.on('click', onMapClick)

      remountRef.current = mountOverlays
    })()

    return () => {
      cancelled = true
      if (watchdog) clearTimeout(watchdog)
      remountRef.current = null
      ro?.disconnect()
      userDotRef.current?.remove()
      userDotRef.current = null
      mapRef.current?.remove()
      mapRef.current = null
    }
    // Mount-once builder: closes over boot-time config (zooms/floorStacksOn/
    // styleUrls); theme/style changes are handled by the remount + style-swap
    // effects below instead of re-running this initializer.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-once closures
  }, [themeReady])

  // Soft IP city chip — never auto-fly; skip deep-links and dismissed / same city.
  useEffect(() => {
    if (!ready || deepLinked.current) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/geo')
        if (!res.ok || cancelled) return
        const data = (await res.json()) as
          | { ok: true; slug: string; ka: string; lat: number; lng: number }
          | { ok: false }
        if (!data.ok || cancelled) return
        const here = nearestMapCity(
          mapRef.current?.getCenter().lat ?? MAP_CENTER.lat,
          mapRef.current?.getCenter().lng ?? MAP_CENTER.lng,
        )
        if (here?.slug === data.slug) return
        if (readIpDismiss() === data.slug) return
        setIpSuggest({ slug: data.slug, ka: data.ka, lat: data.lat, lng: data.lng })
      } catch {
        /* offline / local — keep quiet */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [ready])

  const flyToPlace = useCallback((lat: number, lng: number, zoom = 13.2) => {
    const map = mapRef.current
    if (!map) return
    const cam = mapBootCamera(view3dRef.current)
    map.easeTo({
      center: [lng, lat],
      zoom,
      pitch: cam.pitch,
      bearing: view3dRef.current ? map.getBearing() : 0,
      duration: 900,
      essential: true,
    })
  }, [])

  const flyToQuery = useCallback(async (q: string, s?: Suggestion) => {
    const needle = (s?.ka ?? q).trim()
    if (!needle) return
    const known = MAP_CITIES.find((c) => c.ka === needle)
    if (known) {
      flyToPlace(known.lat, known.lng, 12)
      return
    }
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(needle)}`)
      const json = (await res.json()) as { ok?: boolean; lat?: number; lng?: number }
      if (json.ok && json.lat != null && json.lng != null) {
        flyToPlace(json.lat, json.lng, s?.kind === 'street' ? 16 : 14)
      }
    } catch {
      /* offline — map stays put */
    }
  }, [flyToPlace])

  const acceptIpSuggest = () => {
    if (!ipSuggest) return
    writeSavedPlace({ slug: ipSuggest.slug, lat: ipSuggest.lat, lng: ipSuggest.lng })
    flyToPlace(ipSuggest.lat, ipSuggest.lng)
    setIpSuggest(null)
  }

  const dismissIpSuggest = () => {
    if (ipSuggest) writeIpDismiss(ipSuggest.slug)
    setIpSuggest(null)
  }

  const locateMe = () => {
    if (!navigator.geolocation || locating) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        const { latitude: lat, longitude: lng } = pos.coords
        const map = mapRef.current
        if (!map) return
        const city = nearestMapCity(lat, lng, 120)
        if (city) writeSavedPlace({ slug: city.slug, lat: city.lat, lng: city.lng })
        flyToPlace(lat, lng, 15.2)
        setIpSuggest(null)
        if (userDotRef.current) {
          userDotRef.current.setLngLat([lng, lat])
        } else {
          const d = document.createElement('div')
          d.className =
            'h-3.5 w-3.5 rounded-full bg-sv-blue shadow-glow-blue-sm ring-[3px] ring-white'
          d.setAttribute('aria-hidden', 'true')
          userDotRef.current = new maplibregl.Marker({ element: d, anchor: 'center' })
            .setLngLat([lng, lat])
            .addTo(map)
        }
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    )
  }

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const desktop = window.matchMedia('(min-width: 768px)').matches
    map.easeTo({
      padding: {
        top: 0,
        left: 0,
        right: selected && desktop ? 400 : 0,
        bottom:
          selected && !desktop ? Math.round(window.innerHeight * 0.42) : POI_RAIL_PAD,
      },
      duration: 280,
    })
  }, [selected, ready])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return
      if (e.key === 'Escape') {
        if (filtersOpen) setFiltersOpen(false)
        else if (layersOpen) setLayersOpen(false)
        else if (selected) selectBuilding(null)
        return
      }
      if (e.key === '+' || e.key === '=') mapRef.current?.zoomIn({ duration: 220 })
      if (e.key === '-' || e.key === '_') mapRef.current?.zoomOut({ duration: 220 })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [filtersOpen, layersOpen, selected, selectBuilding])

  // Theme / terrain → swap basemap + rebuild overlays (camera preserved).
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || !themeReady) return
    const next = mapStyleUrl(isDark, terrain, styleUrls)
    if (styleUrlRef.current === next) return
    styleUrlRef.current = next
    const gen = ++styleGenRef.current
    let cancelled = false
    ;(async () => {
      try {
        const style = await loadMapBasemap(next)
        if (cancelled || gen !== styleGenRef.current) return
        map.once('style.load', () => {
          if (gen !== styleGenRef.current) return
          remountRef.current?.()
        })
        map.setStyle(style)
      } catch (err) {
        console.error('[Map3D] theme style', err)
        // Fall back to streets if sat/proxy fails
        if (terrain === 'satellite') {
          styleUrlRef.current = null
          setTerrain('streets')
        }
      }
    })()
    return () => {
      cancelled = true
    }
    // styleUrlRef guard already no-ops when the built URL is unchanged;
    // styleUrls is a stable module constant and zooms a per-render object.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- styleUrlRef guard covers staleness
  }, [isDark, terrain, ready, themeReady])

  const applyViewMode = useCallback((mode3d: boolean) => {
    const map = mapRef.current
    if (!map) return
    const cam = mapBootCamera(mode3d)
    map.easeTo({
      pitch: cam.pitch,
      bearing: cam.bearing,
      duration: 550,
    })
    muteBasemapExtrusions(map, KEEP_EXTRUDE)
    if (map.getLayer(EXTRUDE_ID)) {
      map.setLayoutProperty(EXTRUDE_ID, 'visibility', mode3d ? 'visible' : 'none')
    }
    if (map.getLayer(FILL_ID)) {
      const dark = darkRef.current
      map.setPaintProperty(
        FILL_ID,
        'fill-opacity',
        mode3d ? (dark ? 0.38 : 0.22) : dark ? 0.72 : 0.5,
      )
    }
  }, [])

  const toggleView3d = () => {
    setView3d((v) => {
      const next = !v
      view3dRef.current = next
      applyViewMode(next)
      return next
    })
  }

  const resetView = () => {
    const cam = mapBootCamera(view3dRef.current)
    mapRef.current?.easeTo({
      center: [centerDefault.lng, centerDefault.lat],
      zoom: 13.2,
      pitch: cam.pitch,
      bearing: cam.bearing,
      duration: 800,
    })
    selectBuilding(null)
  }

  const resetFiltersAndView = () => {
    setDealFilter('all')
    setKindFilter('all')
    setStatusFilter('all')
    patchFilterUrl('all', 'all')
    resetView()
  }

  const resetNorth = () => {
    const map = mapRef.current
    if (!map) return
    map.easeTo({ bearing: 0, duration: 450 })
  }

  const constructionCount = allBuildings.filter((b) => b.status === 'construction').length
  const filtersActive = dealFilter !== 'all' || kindFilter !== 'all'
  const showCompass = Math.abs(bearing) > 2.5

  const chip = isDark
    ? 'border-white/10 bg-sv-navy/90 text-white shadow-soft backdrop-blur-xl'
    : 'border-sv-ink/[0.06] bg-sv-surface/92 text-sv-ink shadow-soft backdrop-blur-xl'
  const chipMuted = isDark ? 'text-white/45 hover:text-white' : 'text-sv-ink/40 hover:text-sv-ink'
  const shellBg = isDark ? 'bg-sv-navy' : 'bg-sv-cloud'
  const hair = isDark ? 'border-white/10' : 'border-sv-ink/[0.06]'
  // Apple-quiet press — never paint zoom/theme as “selected” blue
  const railHover = isDark ? 'hover:bg-white/10 active:bg-white/15' : 'hover:bg-sv-ink/[0.04] active:bg-sv-ink/[0.07]'
  const railSep = `border-t ${hair}`
  const segOn = 'bg-sv-blue text-white shadow-glow-blue-sm'

  return (
    <div
      ref={shellRef}
      className={`relative flex w-full overflow-hidden ${fullscreen ? 'h-dvh' : 'h-full min-h-0'} ${shellBg}`}
    >
      <div className="relative min-w-0 flex-1">
        {/* ponytail: MapLibre forces position:relative — absolute on the map node collapses to h=0. */}
        <div className="absolute inset-0">
          <div ref={containerRef} className="h-full w-full" />
        </div>

        {!ready && !error && (
          <div
            className={`absolute inset-0 z-10 grid place-items-center ${isDark ? 'bg-sv-navy/80' : 'bg-sv-cloud/85'}`}
            role="status"
            aria-live="polite"
          >
            <div className="flex flex-col items-center gap-3">
              <span className={`sv-spinner ${isDark ? 'sv-spinner-light' : ''}`} aria-hidden />
              <p className={`text-[14px] font-bold ${isDark ? 'text-white/70' : 'text-sv-ink/55'}`}>
                {t('map.loading')}
              </p>
            </div>
          </div>
        )}
        {error && (
          <div className={`absolute inset-0 z-10 grid place-items-center px-6 text-center text-[14px] font-bold ${isDark ? 'bg-sv-navy/90 text-white/80' : 'bg-sv-cloud/90 text-sv-ink/70'}`}>
            {error}
          </div>
        )}

        {/* Top chrome — search full width; chips scroll on their own rail. */}
        <div className="absolute left-3 right-16 top-[max(0.75rem,env(safe-area-inset-top))] z-20 md:left-4 md:right-[4.25rem] md:top-4">
          <div className="flex flex-col gap-2">
            <ChromeSearch
              variant={isDark ? 'dark' : 'light'}
              className="w-full"
              onPlace={(q, s) => void flyToQuery(q, s)}
            />
            <div className={`hidden items-center gap-2 overflow-x-auto rounded-tile border p-1.5 scrollbar-hide md:flex ${chip}`}>
              <div className="flex shrink-0 items-center gap-1.5 px-1">
                <Layers className={`h-3.5 w-3.5 ${isDark ? 'text-sv-blue-light' : 'text-sv-blue'}`} strokeWidth={2} />
                <p className="whitespace-nowrap text-[12px] font-extrabold tabular-nums tracking-tight">
                  {matchListings}
                </p>
              </div>
              <span className={`h-6 w-px shrink-0 ${isDark ? 'bg-white/10' : 'bg-sv-ink/10'}`} aria-hidden />
              <MapFilterPills
                items={DEAL_FILTERS.map((f) => ({ id: f.id, label: t(f.labelKey), color: f.color }))}
                value={dealFilter}
                onChange={pickDeal}
                layoutId="map-deal-bar"
                muted={chipMuted}
                groupLabel={t('map.deal')}
              />
              <span className={`h-6 w-px shrink-0 ${isDark ? 'bg-white/10' : 'bg-sv-ink/10'}`} aria-hidden />
              <MapFilterPills
                items={KIND_FILTERS.map((f) => ({
                  id: f.id,
                  label: t(f.labelKey),
                  color: f.color,
                  title:
                    f.id === 'construction'
                      ? `${t(f.labelKey)} (${constructionCount})`
                      : t(f.labelKey),
                }))}
                value={kindFilter}
                onChange={pickKind}
                layoutId="map-kind-bar"
                muted={chipMuted}
                groupLabel={t('map.kind')}
              />
              <button
                type="button"
                onClick={resetFiltersAndView}
                className={`ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-full transition ${railHover}`}
                aria-label={t('map.reset')}
              >
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>
            {visible.length === 0 && ready && (
              <p className={`px-1 text-[11px] font-bold ${isDark ? 'text-white/55' : 'text-sv-ink/45'}`}>
                {t('search.emptyTitle')}
              </p>
            )}
            {refreshNote && (
              <p className={`px-1 text-[11px] font-bold ${isDark ? 'text-sv-blue-light' : 'text-sv-blue'}`}>
                {refreshNote}
              </p>
            )}
            <div className="flex items-center gap-2 md:hidden">
              <p className={`min-w-0 flex-1 truncate rounded-tile border px-3 py-2.5 text-[12px] font-extrabold tabular-nums ${chip}`}>
                {matchListings}
              </p>
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-tile border transition ${chip} ${
                  filtersActive ? segOn : railHover
                }`}
                aria-label={t('search.filters')}
              >
                <SlidersHorizontal className="h-4 w-4" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={resetFiltersAndView}
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-tile border transition ${railHover} ${chip}`}
                aria-label={t('map.reset')}
              >
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>
            {ipSuggest && (
              <div
                className={`flex flex-wrap items-center gap-2 rounded-tile border px-3 py-2 ${chip}`}
                role="status"
              >
                <p className="text-[12px] font-extrabold tracking-tight">
                  {t('map.ipHere', { city: ipSuggest.ka })}
                </p>
                <button
                  type="button"
                  onClick={acceptIpSuggest}
                  className="min-h-8 rounded-full bg-sv-blue px-3.5 text-[12px] font-extrabold text-white transition hover:bg-sv-blue-deep"
                >
                  {t('map.ipYes')}
                </button>
                <button
                  type="button"
                  onClick={dismissIpSuggest}
                  className={`grid h-8 w-8 place-items-center rounded-full transition ${railHover} ${chipMuted}`}
                  aria-label={t('map.close')}
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile filter sheet */}
        {filtersOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-sv-navy/45 backdrop-blur-[2px]"
              aria-label={t('map.close')}
              onClick={() => setFiltersOpen(false)}
            />
            <div
              className={`absolute inset-x-0 bottom-0 max-h-[75dvh] overflow-y-auto rounded-t-card border-t px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 ${chip}`}
              role="dialog"
              aria-label={t('search.filters')}
            >
              <div className={`mx-auto mb-3 h-1 w-10 rounded-full ${isDark ? 'bg-white/20' : 'bg-sv-ink/15'}`} />
              <p className="mb-3 text-[13px] font-extrabold tracking-tight">{t('search.filters')}</p>
              <p className={`mb-2 text-[11px] font-bold ${chipMuted}`}>{t('map.deal')}</p>
              <div className="mb-4">
                <MapFilterPills
                  items={DEAL_FILTERS.map((f) => ({ id: f.id, label: t(f.labelKey), color: f.color }))}
                  value={dealFilter}
                  onChange={pickDeal}
                  layoutId="map-deal-sheet"
                  muted={chipMuted}
                  groupLabel={t('map.deal')}
                  size="sheet"
                />
              </div>
              <p className={`mb-2 text-[11px] font-bold ${chipMuted}`}>{t('map.kind')}</p>
              <div className="mb-4">
                <MapFilterPills
                  items={KIND_FILTERS.map((f) => ({
                    id: f.id,
                    label:
                      f.id === 'construction'
                        ? `${t(f.labelKey)} (${constructionCount})`
                        : t(f.labelKey),
                    color: f.color,
                  }))}
                  value={kindFilter}
                  onChange={pickKind}
                  layoutId="map-kind-sheet"
                  muted={chipMuted}
                  groupLabel={t('map.kind')}
                  size="sheet"
                />
              </div>
              <p className={`mb-2 text-[11px] font-bold ${chipMuted}`}>{t('map.terrain')}</p>
              <div className="mb-5 flex flex-wrap gap-1.5" role="group" aria-label={t('map.terrain')}>
                {terrainOptions.map((opt) => {
                  const active = terrain === opt.id
                  const Icon = opt.Icon
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => pickTerrain(opt.id)}
                      className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-extrabold transition ${
                        active ? 'text-white' : chipMuted
                      }`}
                      style={active ? { background: BRAND.colors.blue } : undefined}
                    >
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
                      {t(opt.labelKey)}
                    </button>
                  )
                })}
              </div>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="flex h-12 w-full items-center justify-center rounded-full bg-sv-blue text-[14px] font-extrabold text-white transition hover:bg-sv-blue-deep"
              >
                {t('map.done')}
              </button>
            </div>
          </div>
        )}

        {/* Apple Maps–quiet 44px control column */}
        {layersOpen && (
          <button
            type="button"
            className="absolute inset-0 z-[19] hidden md:block"
            aria-label={t('map.close')}
            onClick={() => setLayersOpen(false)}
          />
        )}
        {layersOpen && (
          <div
            className={`absolute right-16 top-[max(0.75rem,env(safe-area-inset-top))] z-20 hidden w-[min(18rem,calc(100%-5.5rem))] flex-col gap-3 rounded-tile border p-3 md:flex md:right-[4.25rem] md:top-4 ${chip}`}
            role="dialog"
            aria-label={t('map.layers')}
          >
            <p className="text-[12px] font-extrabold tracking-tight">{t('map.terrain')}</p>
            <div className="flex gap-1" role="group" aria-label={t('map.terrain')}>
              {terrainOptions.map((opt) => {
                const active = terrain === opt.id
                const Icon = opt.Icon
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => pickTerrain(opt.id)}
                    className={`inline-flex min-h-10 flex-1 items-center justify-center gap-1 rounded-full px-2 text-[11px] font-extrabold transition ${
                      active ? 'text-white' : chipMuted
                    }`}
                    style={active ? { background: BRAND.colors.blue } : undefined}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
                    {t(opt.labelKey)}
                  </button>
                )
              })}
            </div>
          </div>
        )}
        <div
          className={`absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-20 flex w-11 flex-col overflow-hidden rounded-tile border md:right-4 md:top-4 ${chip}`}
          role="toolbar"
          aria-label={t('map.controls')}
        >
          <button
            type="button"
            aria-label={t('map.zoomIn')}
            onClick={() => mapRef.current?.zoomIn({ duration: 280 })}
            className={`grid h-11 w-full place-items-center transition ${railHover}`}
          >
            <Plus className="h-4 w-4" strokeWidth={2.25} />
          </button>
          <button
            type="button"
            aria-label={t('map.zoomOut')}
            onClick={() => mapRef.current?.zoomOut({ duration: 280 })}
            className={`grid h-11 w-full place-items-center transition ${railSep} ${railHover}`}
          >
            <Minus className="h-4 w-4" strokeWidth={2.25} />
          </button>

          <div className={`flex ${railSep}`} role="group" aria-label={t('map.view')}>
            <button
              type="button"
              aria-label="2D"
              aria-pressed={!view3d}
              onClick={() => {
                if (view3d) toggleView3d()
              }}
              className={`h-10 flex-1 text-[10px] font-extrabold tracking-wide transition ${
                !view3d ? segOn : railHover
              }`}
            >
              2D
            </button>
            <button
              type="button"
              aria-label="3D"
              aria-pressed={view3d}
              onClick={() => {
                if (!view3d) toggleView3d()
              }}
              className={`h-10 flex-1 border-l text-[10px] font-extrabold tracking-wide transition ${hair} ${
                view3d ? segOn : railHover
              }`}
            >
              3D
            </button>
          </div>

          {showCompass && (
            <button
              type="button"
              aria-label={t('map.compass')}
              onClick={resetNorth}
              className={`grid h-11 w-full place-items-center transition ${railSep} ${railHover}`}
            >
              <Compass
                className="h-4 w-4"
                strokeWidth={2}
                style={{ transform: `rotate(${-bearing}deg)` }}
              />
            </button>
          )}

          <button
            type="button"
            aria-label={t('map.layers')}
            aria-pressed={layersOpen}
            onClick={() => setLayersOpen((v) => !v)}
            className={`hidden h-11 w-full place-items-center transition md:grid ${railSep} ${
              layersOpen ? segOn : railHover
            }`}
          >
            <Layers className="h-4 w-4" strokeWidth={2} />
          </button>

          <button
            type="button"
            aria-label={t('map.locate')}
            aria-busy={locating}
            disabled={locating}
            onClick={locateMe}
            className={`grid h-11 w-full place-items-center transition ${railSep} ${railHover} disabled:opacity-45`}
          >
            <LocateFixed className={`h-4 w-4 ${locating ? 'animate-pulse' : ''}`} strokeWidth={2} />
          </button>

          <button
            type="button"
            aria-label={isDark ? t('map.day') : t('map.night')}
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`grid h-11 w-full place-items-center transition ${railSep} ${railHover}`}
          >
            {isDark ? <Sun className="h-4 w-4" strokeWidth={2} /> : <Moon className="h-4 w-4" strokeWidth={2} />}
          </button>

          <button
            type="button"
            aria-label={t('map.refresh')}
            aria-busy={refreshing}
            disabled={refreshing}
            onClick={() => void refreshMapData()}
            className={`grid h-11 w-full place-items-center transition ${railSep} ${railHover} disabled:opacity-45`}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} strokeWidth={2} />
          </button>

          <button
            type="button"
            aria-label={fullscreen ? t('map.fullscreenOff') : t('map.fullscreenOn')}
            aria-pressed={fullscreen}
            onClick={toggleFullscreen}
            className={`grid h-11 w-full place-items-center transition ${railSep} ${railHover}`}
          >
            {fullscreen ? (
              <Minimize2 className="h-4 w-4" strokeWidth={2} />
            ) : (
              <Maximize2 className="h-4 w-4" strokeWidth={2} />
            )}
          </button>
        </div>

        {/* ponytail: one row, no title card — Apple Maps / 2GIS amenity chips. */}
        <div
          className={`absolute inset-x-3 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-20 md:inset-x-4 md:bottom-4 ${
            selected ? 'max-md:hidden' : ''
          } ${filtersOpen ? 'hidden' : ''}`}
        >
          <div
            className={`flex w-full max-w-full gap-1 overflow-x-auto overscroll-x-contain rounded-full border p-1 scrollbar-hide md:mx-auto md:w-fit ${chip}`}
            role="group"
            aria-label={t('map.poi.group')}
          >
            {POI_CATEGORIES.map((id) => {
              const active = poiOn.includes(id)
              const Icon = POI_ICONS[id]
              const label = t(`map.poi.${id}` as DictKey)
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => togglePoi(id)}
                  aria-pressed={active}
                  className={`inline-flex h-11 shrink-0 touch-manipulation items-center gap-1.5 rounded-full px-3 text-[12px] font-extrabold tracking-tight transition ${
                    active ? 'text-white' : `${chipMuted} ${railHover}`
                  }`}
                  style={active ? { background: POI_COLORS[id] } : undefined}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {selected && (
        <div className="absolute inset-x-0 bottom-0 z-30 max-h-[48%] overflow-hidden rounded-t-card border-t border-sv-ink/8 md:static md:max-h-none md:rounded-none md:border-t-0">
          <BuildingPanel
            building={selected}
            tab={tab}
            onTab={setTab}
            floor={floorFilter}
            highlightId={searchParams.get('listing')}
            onFloorClear={() => setFloorFilter(null)}
            onClose={() => selectBuilding(null)}
          />
        </div>
      )}
    </div>
  )
}

export default function Map3D({
  dbBuildings,
  listings,
  projects,
  initialUi,
  platform,
}: {
  dbBuildings?: MapBuildingCluster[]
  listings?: Listing[]
  projects?: Project[]
  initialUi?: MapUiSave
  platform?: MapPlatformConfig
}) {
  return (
    <div className="h-full">
      <Suspense
        fallback={
          <div className="grid h-full place-items-center bg-sv-navy text-[14px] font-bold text-white/70">
            …
          </div>
        }
      >
        <Map3DInner
          dbBuildings={dbBuildings}
          listings={listings}
          projects={projects}
          initialUi={initialUi}
          platform={platform}
        />
      </Suspense>
    </div>
  )
}
