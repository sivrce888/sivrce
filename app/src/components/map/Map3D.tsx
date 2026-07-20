'use client'

/**
 * SIVRCE 3D map — brand paints, filters, click-anywhere.
 * ponytail: basemap via /api/map; Meilisearch geo when scale hits.
 */

import { useEffect, useRef, useState, useCallback, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useI18n, type DictKey } from '@/lib/i18n/context'
import maplibregl, {
  type Map as MlMap,
  type MapLayerMouseEvent,
  type MapMouseEvent,
  type GeoJSONSource,
  type FilterSpecification,
  type ExpressionSpecification,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { LISTINGS, type DealType, type Listing } from '@/data/listings'
import { PROJECTS, type Project } from '@/data/professionals'
import TBILISI_RAIONS from '@/data/tbilisi-raions.json'
import { BRAND } from '@/lib/brand'
import { DEAL_BRAND, SERVICE_BRAND, STATUS_BRAND } from '@/lib/category-brand'
import {
  MAP_CENTER,
  GEORGIA_MAX_BOUNDS,
  MAP_MIN_ZOOM,
  buildingsToGeoJSON,
  buildingsToPointsGeoJSON,
  clusterListingsToBuildings,
  filterBuildings,
  findBuildingBySlug,
  findNearestBuilding,
  mergeMapBuildings,
  mergeDbBuildings,
  neighborhoodsToGeoJSON,
  projectsToConstructionBuildings,
  applyLiveProjectPins,
  type MapBuildingCluster,
  type MapDealFilter,
  type MapStatusFilter,
} from '@/lib/map/buildings'
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
  type MapTerrain,
} from '@/lib/map/floorLayers'
import {
  mapUiHasPrefs,
  parseTerrain,
  readMapUi,
  writeMapUi,
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
import {
  initialMapCenter,
  nearestMapCity,
  readIpDismiss,
  writeIpDismiss,
  writeSavedPlace,
  type MapCity,
} from '@/lib/map/user-place'
import { formatGeocodeAddress, type GeocodeHit } from '@/lib/map/geocode'
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
const LABEL_ID = 'sivrce-buildings-label'
const DOT_ID = 'sivrce-buildings-dot'
const DOT_ACTIVE_ID = 'sivrce-buildings-dot-active'
const PRICE_ID = 'sivrce-buildings-price'
const CLUSTER_ID = 'sivrce-buildings-cluster'
const CLUSTER_COUNT_ID = 'sivrce-buildings-cluster-count'
/** Below this zoom: clustered dots; at/above: footprints + names. */
const DETAIL_ZOOM = 13.5
/** Price pills appear once clusters start breaking apart. */
const PRICE_MIN_ZOOM = 11.2
/** MapLibre clusterMaxZoom is exclusive-ish — stop clustering just under detail. */
const CLUSTER_MAX_ZOOM = 13

/** Top 3 people love: streets (yellow) · hybrid · clean. */
const TERRAIN_OPTIONS: { id: MapTerrain; label: string; Icon: LucideIcon }[] = [
  { id: 'streets', label: 'ქუჩები', Icon: MapIcon },
  { id: 'satellite', label: 'ჰიბრიდი', Icon: Satellite },
  { id: 'clean', label: 'მინიმალი', Icon: Circle },
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

const STATIC_BUILDINGS = mergeMapBuildings(
  clusterListingsToBuildings(LISTINGS),
  projectsToConstructionBuildings(PROJECTS),
)

async function ensureLayers(map: MlMap, buildings: MapBuildingCluster[]) {
  if (map.getSource(SOURCE_ID)) return

  await loadPoiImages(map)

  map.addSource(SOURCE_ID, { type: 'geojson', data: buildingsToGeoJSON(buildings) })
  // ponytail: MapLibre clusters Points only — parallel centroid source for far zoom.
  map.addSource(PTS_SOURCE_ID, {
    type: 'geojson',
    data: buildingsToPointsGeoJSON(buildings),
    cluster: true,
    clusterMaxZoom: CLUSTER_MAX_ZOOM,
    clusterRadius: 52,
    promoteId: 'id',
  })

  map.addLayer({
    id: CLUSTER_ID,
    type: 'circle',
    source: PTS_SOURCE_ID,
    maxzoom: DETAIL_ZOOM,
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
    maxzoom: DETAIL_ZOOM,
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

  // Far zoom — unclustered deal/status colored dots
  map.addLayer({
    id: DOT_ID,
    type: 'circle',
    source: PTS_SOURCE_ID,
    maxzoom: DETAIL_ZOOM,
    filter: ['!', ['has', 'point_count']],
    paint: {
      // ponytail: zoom must stay top-level in MapLibre; hover/selected sizes live in DOT_ACTIVE_ID overlay
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 7, 3.5, 10, 5.5, 13, 7.5],
      'circle-color': ['get', 'hue'],
      'circle-stroke-width': 1.5,
      'circle-stroke-color': '#FFFFFF',
      'circle-opacity': [
        'case',
        ['boolean', ['feature-state', 'seen'], false], 0.55,
        0.95,
      ],
    },
  })

  // Hover/selected dots — same source+filter as base, painted on top; radius 0 hides
  // inactive features (MapLibre forbids feature-state in filters, allows it in paint).
  map.addLayer({
    id: DOT_ACTIVE_ID,
    type: 'circle',
    source: PTS_SOURCE_ID,
    maxzoom: DETAIL_ZOOM,
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-radius': [
        'case',
        ['boolean', ['feature-state', 'selected'], false], 11,
        ['boolean', ['feature-state', 'hover'], false], 9,
        0,
      ],
      'circle-color': ['get', 'hue'],
      'circle-stroke-width': [
        'case',
        ['boolean', ['feature-state', 'selected'], false], 3,
        ['boolean', ['feature-state', 'hover'], false], 1.5,
        0,
      ],
      'circle-stroke-color': '#FFFFFF',
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

  // Mid-zoom price pills — compact GEL; hide when empty / clustered / detail footprints.
  map.addLayer({
    id: PRICE_ID,
    type: 'symbol',
    source: PTS_SOURCE_ID,
    minzoom: PRICE_MIN_ZOOM,
    maxzoom: DETAIL_ZOOM,
    filter: [
      'all',
      ['!', ['has', 'point_count']],
      ['!=', ['get', 'priceLabel'], ''],
    ],
    layout: {
      'text-field': ['get', 'priceLabel'],
      'text-size': 11,
      'text-font': ['Noto Sans Bold'],
      'text-offset': [0, -1.35],
      'text-anchor': 'bottom',
      'text-allow-overlap': false,
      'text-padding': 2,
    },
    paint: {
      'text-color': ['get', 'hue'],
      'text-halo-color': '#FFFFFF',
      'text-halo-width': 1.6,
    },
  })

  map.addLayer({
    id: FILL_ID,
    type: 'fill',
    source: SOURCE_ID,
    minzoom: DETAIL_ZOOM,
    paint: {
      'fill-color': ['get', 'color'],
      'fill-opacity': 0.22,
    },
  })

  map.addLayer({
    id: EXTRUDE_ID,
    type: 'fill-extrusion',
    source: SOURCE_ID,
    minzoom: DETAIL_ZOOM,
    paint: {
      // ponytail: MapLibre 5 — fill-extrusion-opacity is constant-only; alpha lives in `color`.
      'fill-extrusion-color': ['get', 'color'],
      'fill-extrusion-height': ['get', 'height'],
      'fill-extrusion-base': 0,
      'fill-extrusion-opacity': 1,
    },
  })

  map.addLayer({
    id: LABEL_ID,
    type: 'symbol',
    source: SOURCE_ID,
    minzoom: DETAIL_ZOOM,
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

const DEAL_FILTERS: { id: MapDealFilter; label: string; color: string }[] = [
  { id: 'all', label: 'ყველა', color: BRAND.colors.blue },
  { id: 'sale', label: 'იყიდება', color: DEAL_BRAND.sale },
  { id: 'rent', label: 'ქირავდება', color: DEAL_BRAND.rent },
  { id: 'daily', label: 'დღიურად', color: DEAL_BRAND.daily },
  { id: 'pledge', label: 'გირავდება', color: DEAL_BRAND.pledge },
]

const STATUS_FILTERS: { id: MapStatusFilter; label: string }[] = [
  { id: 'all', label: 'ყველა' },
  { id: 'active', label: 'აქტიური' },
  { id: 'construction', label: 'მშენებარე' },
  { id: 'completed', label: 'დასრულებული' },
]

function Map3DInner({
  dbBuildings = [],
  listings,
  projects = PROJECTS,
  initialUi,
}: {
  dbBuildings?: MapBuildingCluster[]
  listings?: Listing[]
  /** Live directory projects (korter coords) — falls back to static catalog. */
  projects?: Project[]
  /** Server-read cookie — avoids first-paint default before document.cookie. */
  initialUi?: MapUiSave
}) {
  const { t } = useI18n()
  const tRef = useRef(t)
  useEffect(() => {
    tRef.current = t
  })
  const searchParams = useSearchParams()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MlMap | null>(null)
  const visibleRef = useRef<MapBuildingCluster[]>(STATIC_BUILDINGS)
  const allRef = useRef<MapBuildingCluster[]>(STATIC_BUILDINGS)
  const selectRef = useRef<(b: MapBuildingCluster | null) => void>(() => {})
  const deepLinked = useRef(false)

  // ponytail: cookie from SSR when present; else document.cookie / LS migrate.
  const [savedUi] = useState<MapUiSave>(() =>
    initialUi && mapUiHasPrefs(initialUi) ? initialUi : readMapUi(),
  )

  const [liveListings, setLiveListings] = useState<Listing[] | undefined>(listings)
  const [liveDbBuildings, setLiveDbBuildings] = useState(dbBuildings)
  const [selected, setSelected] = useState<MapBuildingCluster | null>(null)
  const [tab, setTab] = useState<DealType | 'all'>('all')
  const [dealFilter, setDealFilter] = useState<MapDealFilter>(() => {
    const d = savedUi.deal
    return DEAL_FILTERS.some((f) => f.id === d) ? (d as MapDealFilter) : 'all'
  })
  const [statusFilter, setStatusFilter] = useState<MapStatusFilter>(() => {
    const s = savedUi.status
    return STATUS_FILTERS.some((f) => f.id === s) ? (s as MapStatusFilter) : 'all'
  })
  const [poiOn, setPoiOn] = useState<PoiCategory[]>(() => {
    const parsed = parsePoiPrefs(savedUi.pois)
    return parsed ?? [...POI_DEFAULT_ON]
  })
  const [floorFilter, setFloorFilter] = useState<number | null>(null)
  const [view3d, setView3d] = useState(() => savedUi.view3d !== false)
  const [terrain, setTerrain] = useState<MapTerrain>(() => parseTerrain(savedUi.terrain))
  const [filtersOpen, setFiltersOpen] = useState(false)
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
  const dealRef = useRef<MapDealFilter>('all')
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
      deal: dealFilter,
      status: statusFilter,
      pois: serializePoiPrefs(poiOn),
    })
  }, [terrain, view3d, dealFilter, statusFilter, poiOn])

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
        added > 0 ? `+${added} ახალი განცხადება` : 'რუკა განახლებულია',
      )
    } catch (err) {
      console.error('[Map3D] refresh', err)
      flashRefreshNote('განახლება ვერ მოხერხდა')
    } finally {
      setRefreshing(false)
    }
  }, [refreshing, liveListings, flashRefreshNote])

  // Live DB listings when present (incl. empty); demo LISTINGS only if prop omitted.
  const sourceListings = liveListings ?? LISTINGS
  const listingCount = sourceListings.length
  const dbProjectSlugs = useMemo(() => {
    const s = new Set<string>()
    for (const b of liveDbBuildings ?? []) if (b.projectSlug) s.add(b.projectSlug)
    return s
  }, [liveDbBuildings])
  const baseBuildings = useMemo(() => {
    const forGhosts = projects.filter((p) => !dbProjectSlugs.has(p.slug))
    return applyLiveProjectPins(
      mergeMapBuildings(
        clusterListingsToBuildings(sourceListings),
        projectsToConstructionBuildings(forGhosts),
      ),
      projects,
    )
  }, [sourceListings, projects, dbProjectSlugs])
  const allBuildings = useMemo(
    () => mergeDbBuildings(baseBuildings, liveDbBuildings),
    [baseBuildings, liveDbBuildings],
  )
  useEffect(() => { allRef.current = allBuildings }, [allBuildings])

  // Keep open panel in sync when refresh swaps listing clusters.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync selection after live data swap
    setSelected((cur) => {
      if (!cur) return cur
      return allBuildings.find((b) => b.id === cur.id) ?? null
    })
  }, [allBuildings])

  const visible = useMemo(
    () => filterBuildings(allBuildings, dealFilter, statusFilter),
    [allBuildings, dealFilter, statusFilter],
  )
  useEffect(() => { visibleRef.current = visible }, [visible])
  useEffect(() => { selectedRef.current = selected }, [selected])
  useEffect(() => { dealRef.current = dealFilter }, [dealFilter])

  const selectBuilding = useCallback((b: MapBuildingCluster | null) => {
    setSelected(b)
    setTab('all')
    setFloorFilter(null)
  }, [])
  useEffect(() => { selectRef.current = selectBuilding }, [selectBuilding])
  useEffect(() => { floorRef.current = (n) => setFloorFilter((cur) => (cur === n ? null : n)) }, [])

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
    src?.setData(buildingsToGeoJSON(visible))
    const pts = map.getSource(PTS_SOURCE_ID) as GeoJSONSource | undefined
    pts?.setData(buildingsToPointsGeoJSON(visible))
    if (selected && !visible.some((b) => b.id === selected.id)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- deselect when filters hide it
      selectBuilding(null)
    }
  }, [visible, ready, selected, selectBuilding])

  // Floor stack only for developments with stock — else keep solid extrusion.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const showFloors = Boolean(selected && buildingShowsFloorStack(selected))
    const src = map.getSource(FLOORS_SOURCE_ID) as GeoJSONSource | undefined
    src?.setData(
      showFloors && selected ? floorsToGeoJSON(selected, dealFilter) : EMPTY_FLOORS,
    )
    if (!showFloors) popupRef.current?.remove()
    const hideId = showFloors && selected ? selected.id : null
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
    if (map.getLayer(DOT_ACTIVE_ID)) {
      map.setFilter(
        DOT_ACTIVE_ID,
        (hideId
          ? ['all', ['!', ['has', 'point_count']], ['!=', ['get', 'id'], hideId]]
          : ['!', ['has', 'point_count']]) as FilterSpecification,
      )
    }
    if (map.getLayer(PRICE_ID)) {
      map.setFilter(
        PRICE_ID,
        (hideId
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
            ]) as FilterSpecification,
      )
    }
  }, [selected, dealFilter, ready])

  // Deep-link ?status=construction|completed|active
  useEffect(() => {
    if (!ready) return
    const status = searchParams.get('status')
    if (status === 'construction' || status === 'completed' || status === 'active') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot deep-link from URL param
      setStatusFilter(status)
    }
  }, [ready, searchParams])

  useEffect(() => {
    if (!ready || deepLinked.current) return
    const slug = searchParams.get('building')
    if (!slug) return
    const b = findBuildingBySlug(slug, allBuildings)
    if (!b) return
    deepLinked.current = true
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot deep-link from URL param
    selectBuilding(b)
    mapRef.current?.easeTo({
      center: [b.lng, b.lat],
      zoom: 16,
      pitch: view3dRef.current ? 62 : 0,
      bearing: view3dRef.current ? -18 : 0,
      duration: 900,
      essential: true,
    })
  }, [ready, searchParams, selectBuilding, allBuildings])

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !themeReady) return

    let cancelled = false
    let ro: ResizeObserver | null = null
    const initialStyle = mapStyleUrl(darkRef.current, terrainRef.current)
    styleUrlRef.current = initialStyle
    const container = containerRef.current

    ;(async () => {
      let style
      try {
        style = await loadMapBasemap(initialStyle)
      } catch (err) {
        console.error('[Map3D] style', err)
        if (!cancelled) setError('რუკის ჩატვირთვა ვერ მოხერხდა. სცადე განახლება.')
        return
      }
      if (cancelled || mapRef.current) return

      // ponytail: last city from localStorage; IP only suggests via soft chip.
      const boot = initialMapCenter()
      const map = new maplibregl.Map({
        container,
        style,
        center: [boot.lng, boot.lat],
        zoom: 13.2,
        pitch: 58,
        bearing: -18,
        maxPitch: 70,
        minZoom: MAP_MIN_ZOOM,
        maxBounds: GEORGIA_MAX_BOUNDS,
        renderWorldCopies: false,
        fadeDuration: 0,
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
        const hits = map.queryRenderedFeatures(e.point, {
          layers: [
            EXTRUDE_ID,
            FILL_ID,
            DOT_ID,
            CLUSTER_ID,
            FLOORS_FILL_ID,
            POI_ICON_ID,
            POI_LABEL_LAYER_ID,
            NBH_LABEL_ID,
          ].filter((id) => map.getLayer(id)),
        })
        if (hits.length > 0) return
        const nearest = findNearestBuilding(e.lngLat.lat, e.lngLat.lng, visibleRef.current)
        selectRef.current(nearest)
        if (nearest) flyTo(nearest)
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
          await ensureLayers(map, visibleRef.current)
          const poiFilter = poiFilterSpec(poiOnRef.current, map.getZoom())
          if (map.getLayer(POI_ICON_ID)) map.setFilter(POI_ICON_ID, poiFilter)
          if (map.getLayer(POI_LABEL_LAYER_ID)) map.setFilter(POI_LABEL_LAYER_ID, poiFilter)
          applyPoiLabelTheme(map, darkRef.current)
          tightenAttribution(map)
          const showFloors = Boolean(
            selectedRef.current && buildingShowsFloorStack(selectedRef.current),
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
              map.setPaintProperty(DOT_ID, 'circle-stroke-color', dark ? BRAND.colors.blueLight : '#FFFFFF')
              map.setPaintProperty(DOT_ID, 'circle-stroke-width', dark ? 2 : 1.5)
              map.setPaintProperty(DOT_ID, 'circle-opacity', 1)
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
          // Re-apply 2D/3D fill after style remount
          if (!view3dRef.current && map.getLayer(EXTRUDE_ID)) {
            map.setLayoutProperty(EXTRUDE_ID, 'visibility', 'none')
            if (map.getLayer(FILL_ID)) {
              map.setPaintProperty(FILL_ID, 'fill-opacity', dark ? 0.72 : 0.5)
            }
          }
        })()
      }

      map.on('load', () => {
        if (cancelled) return
        map.resize()
        mountOverlays()
        setReady(true)
      })

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
      map.on('click', onMapClick)

      remountRef.current = mountOverlays
    })()

    return () => {
      cancelled = true
      remountRef.current = null
      ro?.disconnect()
      userDotRef.current?.remove()
      userDotRef.current = null
      mapRef.current?.remove()
      mapRef.current = null
    }
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
    const three = view3dRef.current
    mapRef.current?.easeTo({
      center: [lng, lat],
      zoom,
      pitch: three ? 58 : 0,
      bearing: three ? -18 : 0,
      duration: 900,
      essential: true,
    })
  }, [])

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
  // Theme / terrain → swap basemap + rebuild overlays (camera preserved).
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || !themeReady) return
    const next = mapStyleUrl(isDark, terrain)
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
  }, [isDark, terrain, ready, themeReady])

  const applyViewMode = useCallback((mode3d: boolean) => {
    const map = mapRef.current
    if (!map) return
    map.easeTo({
      pitch: mode3d ? 58 : 0,
      bearing: mode3d ? -18 : 0,
      duration: 550,
    })
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
    const three = view3dRef.current
    mapRef.current?.easeTo({
      center: [MAP_CENTER.lng, MAP_CENTER.lat],
      zoom: 13.2,
      pitch: three ? 58 : 0,
      bearing: three ? -18 : 0,
      duration: 800,
    })
    selectBuilding(null)
  }

  const constructionCount = allBuildings.filter((b) => b.status === 'construction').length
  const completedCount = allBuildings.filter((b) => b.status === 'completed').length

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
      className={`relative flex w-full overflow-hidden ${fullscreen ? 'h-dvh' : 'h-[calc(100dvh-4.5rem)] md:h-[calc(100dvh-5rem)]'} ${shellBg}`}
    >
      <div className="relative min-w-0 flex-1">
        {/* ponytail: MapLibre forces position:relative — absolute on the map node collapses to h=0. */}
        <div className="absolute inset-0">
          <div ref={containerRef} className="h-full w-full" />
        </div>

        {!ready && !error && (
          <div className={`absolute inset-0 z-10 grid place-items-center text-[14px] font-bold ${isDark ? 'bg-sv-navy/80 text-white/70' : 'bg-sv-cloud/85 text-sv-ink/55'}`}>
            3D რუკა იტვირთება…
          </div>
        )}
        {error && (
          <div className={`absolute inset-0 z-10 grid place-items-center px-6 text-center text-[14px] font-bold ${isDark ? 'bg-sv-navy/90 text-white/80' : 'bg-sv-cloud/90 text-sv-ink/70'}`}>
            {error}
          </div>
        )}

        {/* Top filter strip — below page header, map stays open on the left.
            ponytail: not inside navy nav; leaves room for right toolbar. */}
        <div className="absolute left-3 right-[5.25rem] top-3 z-20 hidden md:block md:left-4 md:right-[5.5rem] md:top-4">
          <div className={`flex items-center gap-2 overflow-x-auto rounded-tile border p-1.5 scrollbar-hide ${chip}`}>
            <div className="flex shrink-0 items-center gap-1.5 px-2">
              <Layers className={`h-3.5 w-3.5 ${isDark ? 'text-sv-blue-light' : 'text-sv-blue'}`} strokeWidth={2} />
              <p className="whitespace-nowrap text-[12px] font-extrabold tracking-tight">
                {visible.length} · {listingCount}
              </p>
            </div>
            <span className={`h-6 w-px shrink-0 ${isDark ? 'bg-white/10' : 'bg-sv-ink/10'}`} aria-hidden />
            <div className="flex shrink-0 gap-0.5" role="group" aria-label="გარიგების ფილტრი">
              {DEAL_FILTERS.map((f) => {
                const active = dealFilter === f.id
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setDealFilter(f.id)}
                    className={`min-h-8 whitespace-nowrap rounded-full px-2.5 text-[12px] font-extrabold tracking-tight transition ${
                      active ? 'text-white' : chipMuted
                    }`}
                    style={active ? { background: f.color } : undefined}
                  >
                    {f.label}
                  </button>
                )
              })}
            </div>
            <span className={`h-6 w-px shrink-0 ${isDark ? 'bg-white/10' : 'bg-sv-ink/10'}`} aria-hidden />
            <div className="flex shrink-0 gap-0.5" role="group" aria-label="სტატუსის ფილტრი">
              {STATUS_FILTERS.map((f) => {
                const active = statusFilter === f.id
                const bg =
                  active && f.id === 'completed'
                    ? SERVICE_BRAND.developers.hue
                    : active && f.id === 'construction'
                      ? STATUS_BRAND.construction.hue
                      : active
                        ? BRAND.colors.blue
                        : undefined
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setStatusFilter(f.id)}
                    title={
                      f.id === 'construction'
                        ? `${f.label} (${constructionCount})`
                        : f.id === 'completed'
                          ? `${f.label} (${completedCount})`
                          : f.label
                    }
                    className={`min-h-8 whitespace-nowrap rounded-full px-2.5 text-[12px] font-extrabold tracking-tight transition ${
                      active ? 'text-white' : chipMuted
                    }`}
                    style={bg ? { background: bg } : undefined}
                  >
                    {f.label}
                  </button>
                )
              })}
            </div>
            <span className={`h-6 w-px shrink-0 ${isDark ? 'bg-white/10' : 'bg-sv-ink/10'}`} aria-hidden />
            <div className="flex shrink-0 gap-0.5" role="group" aria-label={t('map.poi.group')}>
              {POI_CATEGORIES.map((id) => {
                const active = poiOn.includes(id)
                const Icon = POI_ICONS[id]
                const label = t(`map.poi.${id}` as DictKey)
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => togglePoi(id)}
                    title={label}
                    aria-label={label}
                    aria-pressed={active}
                    className={`inline-flex min-h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[12px] font-extrabold tracking-tight transition ${
                      active ? 'text-white' : chipMuted
                    }`}
                    style={active ? { background: POI_COLORS[id] } : undefined}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
                    {label}
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              onClick={resetView}
              className={`ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-full transition ${railHover}`}
              aria-label="საწყისი ხედი"
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>
          {refreshNote && (
            <p className={`mt-1.5 px-1 text-[11px] font-bold ${isDark ? 'text-sv-blue-light' : 'text-sv-blue'}`}>
              {refreshNote}
            </p>
          )}
        </div>

        <div className="absolute left-3 top-3 z-20 flex max-w-[min(100%-1.5rem,380px)] flex-col gap-2 md:left-4 md:top-[4.75rem]">
          {/* Mobile — count + filter sheet */}
          <div className="flex items-center gap-2 md:hidden">
            <div className={`flex min-w-0 flex-1 items-center gap-2 rounded-tile border px-3 py-2 ${chip}`}>
              <Layers className={`h-3.5 w-3.5 shrink-0 ${isDark ? 'text-sv-blue-light' : 'text-sv-blue'}`} strokeWidth={2} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-extrabold tracking-[-0.02em]">
                  {visible.length} · {listingCount}
                </p>
                {refreshNote && (
                  <p className={`truncate text-[10px] font-bold ${isDark ? 'text-sv-blue-light' : 'text-sv-blue'}`}>
                    {refreshNote}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-tile border transition ${chip} ${
                dealFilter !== 'all' || statusFilter !== 'all' || poiOn.length > 0 ? segOn : railHover
              }`}
              aria-label="ფილტრები"
            >
              <SlidersHorizontal className="h-4 w-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={resetView}
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-tile border transition ${railHover} ${chip}`}
              aria-label="საწყისი ხედი"
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
                {ipSuggest.ka}? აქ გაჩვენო
              </p>
              <button
                type="button"
                onClick={acceptIpSuggest}
                className="min-h-8 rounded-full bg-sv-blue px-3.5 text-[12px] font-extrabold text-white transition hover:bg-sv-blue-deep"
              >
                აქ
              </button>
              <button
                type="button"
                onClick={dismissIpSuggest}
                className={`grid h-8 w-8 place-items-center rounded-full transition ${railHover} ${chipMuted}`}
                aria-label="არა"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>
          )}
        </div>

        {/* Mobile filter sheet */}
        {filtersOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-sv-navy/45 backdrop-blur-[2px]"
              aria-label="დახურვა"
              onClick={() => setFiltersOpen(false)}
            />
            <div
              className={`absolute inset-x-0 bottom-0 max-h-[75dvh] overflow-y-auto rounded-t-card border-t px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 ${chip}`}
              role="dialog"
              aria-label="ფილტრები"
            >
              <div className={`mx-auto mb-3 h-1 w-10 rounded-full ${isDark ? 'bg-white/20' : 'bg-sv-ink/15'}`} />
              <p className="mb-3 text-[13px] font-extrabold tracking-tight">ფილტრები</p>
              <p className={`mb-2 text-[11px] font-bold ${chipMuted}`}>გარიგება</p>
              <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="გარიგების ფილტრი">
                {DEAL_FILTERS.map((f) => {
                  const active = dealFilter === f.id
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setDealFilter(f.id)}
                      className={`min-h-10 rounded-full px-3.5 text-[13px] font-extrabold transition ${
                        active ? 'text-white' : chipMuted
                      }`}
                      style={active ? { background: f.color } : undefined}
                    >
                      {f.label}
                    </button>
                  )
                })}
              </div>
              <p className={`mb-2 text-[11px] font-bold ${chipMuted}`}>სტატუსი</p>
              <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="სტატუსის ფილტრი">
                {STATUS_FILTERS.map((f) => {
                  const active = statusFilter === f.id
                  const bg =
                    active && f.id === 'completed'
                      ? SERVICE_BRAND.developers.hue
                      : active && f.id === 'construction'
                        ? STATUS_BRAND.construction.hue
                        : active
                          ? BRAND.colors.blue
                          : undefined
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setStatusFilter(f.id)}
                      className={`min-h-10 rounded-full px-3.5 text-[13px] font-extrabold transition ${
                        active ? 'text-white' : chipMuted
                      }`}
                      style={bg ? { background: bg } : undefined}
                    >
                      {f.label}
                      {f.id === 'construction' ? ` (${constructionCount})` : ''}
                      {f.id === 'completed' ? ` (${completedCount})` : ''}
                    </button>
                  )
                })}
              </div>
              <p className={`mb-2 text-[11px] font-bold ${chipMuted}`}>{t('map.poi.group')}</p>
              <div className="mb-5 flex flex-wrap gap-1.5" role="group" aria-label={t('map.poi.group')}>
                {POI_CATEGORIES.map((id) => {
                  const active = poiOn.includes(id)
                  const Icon = POI_ICONS[id]
                  const label = t(`map.poi.${id}` as DictKey)
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => togglePoi(id)}
                      className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-extrabold transition ${
                        active ? 'text-white' : chipMuted
                      }`}
                      style={active ? { background: POI_COLORS[id] } : undefined}
                    >
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
                      {label}
                    </button>
                  )
                })}
              </div>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="flex h-12 w-full items-center justify-center rounded-full bg-sv-blue text-[14px] font-extrabold text-white transition hover:bg-sv-blue-deep"
              >
                მზადაა
              </button>
            </div>
          </div>
        )}

        {/* Apple Maps–quiet control column */}
        <div
          className={`absolute right-3 top-3 z-20 flex w-[4.5rem] flex-col overflow-hidden rounded-tile border md:right-4 md:top-4 ${chip}`}
          role="toolbar"
          aria-label="რუკის კონტროლი"
        >
          <button
            type="button"
            aria-label="გადიდება"
            onClick={() => mapRef.current?.zoomIn({ duration: 280 })}
            className={`grid h-11 w-full place-items-center transition ${railHover}`}
          >
            <Plus className="h-4 w-4" strokeWidth={2.25} />
          </button>
          <button
            type="button"
            aria-label="დაპატარავება"
            onClick={() => mapRef.current?.zoomOut({ duration: 280 })}
            className={`grid h-11 w-full place-items-center transition ${railSep} ${railHover}`}
          >
            <Minus className="h-4 w-4" strokeWidth={2.25} />
          </button>

          <div className={`flex ${railSep}`} role="group" aria-label="რუკის ხედი">
            <button
              type="button"
              aria-pressed={!view3d}
              onClick={() => {
                if (view3d) toggleView3d()
              }}
              className={`h-10 flex-1 text-[11px] font-extrabold tracking-wide transition ${
                !view3d ? segOn : railHover
              }`}
            >
              2D
            </button>
            <button
              type="button"
              aria-pressed={view3d}
              onClick={() => {
                if (!view3d) toggleView3d()
              }}
              className={`h-10 flex-1 border-l text-[11px] font-extrabold tracking-wide transition ${hair} ${
                view3d ? segOn : railHover
              }`}
            >
              3D
            </button>
          </div>

          <div className={`flex ${railSep}`} role="group" aria-label="ტერიტორიის ხედი">
            {TERRAIN_OPTIONS.map((t, i) => {
              const active = terrain === t.id
              const Icon = t.Icon
              return (
                <button
                  key={t.id}
                  type="button"
                  title={t.label}
                  aria-label={t.label}
                  aria-pressed={active}
                  onClick={() => pickTerrain(t.id)}
                  className={`grid h-10 flex-1 place-items-center transition ${
                    i > 0 ? `border-l ${hair}` : ''
                  } ${active ? segOn : railHover}`}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
                </button>
              )
            })}
          </div>

          <button
            type="button"
            aria-label="ჩემთან ახლოს"
            aria-busy={locating}
            disabled={locating}
            onClick={locateMe}
            className={`grid h-11 w-full place-items-center transition ${railSep} ${railHover} disabled:opacity-45`}
          >
            <LocateFixed className={`h-4 w-4 ${locating ? 'animate-pulse' : ''}`} strokeWidth={2} />
          </button>

          <button
            type="button"
            aria-label={isDark ? 'დღის რეჟიმი' : 'ღამის რეჟიმი'}
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`grid h-11 w-full place-items-center transition ${railSep} ${railHover}`}
          >
            {isDark ? <Sun className="h-4 w-4" strokeWidth={2} /> : <Moon className="h-4 w-4" strokeWidth={2} />}
          </button>

          <button
            type="button"
            aria-label="განცხადებების განახლება"
            aria-busy={refreshing}
            disabled={refreshing}
            onClick={() => void refreshMapData()}
            className={`grid h-11 w-full place-items-center transition ${railSep} ${railHover} disabled:opacity-45`}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} strokeWidth={2} />
          </button>

          <button
            type="button"
            aria-label={fullscreen ? 'სრული ეკრანიდან გასვლა' : 'სრული ეკრანი'}
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
      </div>

      {selected && (
        <div className="absolute inset-x-0 bottom-0 z-30 max-h-[58%] overflow-hidden rounded-t-card border-t border-sv-ink/8 md:static md:max-h-none md:rounded-none md:border-t-0">
          <BuildingPanel
            building={selected}
            tab={tab}
            onTab={setTab}
            floor={floorFilter}
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
}: {
  dbBuildings?: MapBuildingCluster[]
  listings?: Listing[]
  projects?: Project[]
  initialUi?: MapUiSave
}) {
  return (
    <Suspense
      fallback={
        <div className="grid h-[calc(100dvh-4.5rem)] place-items-center bg-sv-cloud text-[14px] font-bold text-sv-ink/55 dark:bg-sv-navy dark:text-white/70">
          3D რუკა იტვირთება…
        </div>
      }
    >
      <Map3DInner
        dbBuildings={dbBuildings}
        listings={listings}
        projects={projects}
        initialUi={initialUi}
      />
    </Suspense>
  )
}
