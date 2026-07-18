'use client'

/**
 * SIVRCE 3D map — MapLibre + Google-familiar paints, filters, click-anywhere.
 * ponytail: OFM tiles (no key), vendor chrome stripped; Meilisearch geo when scale hits.
 */

import { useEffect, useRef, useState, useCallback, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTheme } from 'next-themes'
import maplibregl, {
  type Map as MlMap,
  type MapLayerMouseEvent,
  type MapMouseEvent,
  type GeoJSONSource,
  type FilterSpecification,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { LISTINGS, type DealType, type Listing } from '@/data/listings'
import { PROJECTS } from '@/data/professionals'
import { BRAND } from '@/lib/brand'
import { DEAL_BRAND, CATEGORY_BRAND, SERVICE_BRAND } from '@/lib/category-brand'
import {
  MAP_CENTER,
  GEORGIA_MAX_BOUNDS,
  MAP_MIN_ZOOM,
  buildingsToGeoJSON,
  clusterListingsToBuildings,
  filterBuildings,
  findBuildingBySlug,
  findNearestBuilding,
  mergeMapBuildings,
  mergeDbBuildings,
  neighborhoodsToGeoJSON,
  projectsToConstructionBuildings,
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
  mapStyleUrl,
} from '@/lib/map/floorLayers'
import {
  loadCleanStyle,
  mapChromeOptions,
  tightenAttribution,
} from '@/lib/map/mapChrome'
import { Layers, RotateCcw, HardHat, CheckCircle2, MapPin, Box, Square, Plus, Minus, Moon, Sun } from 'lucide-react'

const SOURCE_ID = 'sivrce-buildings'
const FILL_ID = 'sivrce-buildings-fill'
const EXTRUDE_ID = 'sivrce-buildings-3d'
const LABEL_ID = 'sivrce-buildings-label'

const NBH_SOURCE_ID = 'sivrce-neighborhoods'
const NBH_CIRCLE_ID = 'sivrce-neighborhoods-circle'
const NBH_LABEL_ID = 'sivrce-neighborhoods-label'
const NBH_DATA = neighborhoodsToGeoJSON()

const STATIC_BUILDINGS = mergeMapBuildings(
  clusterListingsToBuildings(LISTINGS),
  projectsToConstructionBuildings(PROJECTS),
)

function ensureLayers(map: MlMap, data: GeoJSON.FeatureCollection) {
  if (map.getSource(SOURCE_ID)) return

  map.addSource(SOURCE_ID, { type: 'geojson', data })

  map.addLayer({
    id: FILL_ID,
    type: 'fill',
    source: SOURCE_ID,
    paint: {
      'fill-color': ['get', 'color'],
      'fill-opacity': 0.22,
    },
  })

  map.addLayer({
    id: EXTRUDE_ID,
    type: 'fill-extrusion',
    source: SOURCE_ID,
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

  // ——— neighborhoods toggleable layer (off by default) ———
  map.addSource(NBH_SOURCE_ID, { type: 'geojson', data: NBH_DATA })
  map.addLayer({
    id: NBH_CIRCLE_ID,
    type: 'circle',
    source: NBH_SOURCE_ID,
    layout: { visibility: 'none' },
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 5, 14, 12, 17, 22],
      'circle-color': BRAND.colors.blueLight,
      'circle-stroke-color': '#FFFFFF',
      'circle-stroke-width': 2,
      'circle-opacity': 0.85,
    },
  })
  map.addLayer({
    id: NBH_LABEL_ID,
    type: 'symbol',
    source: NBH_SOURCE_ID,
    layout: {
      visibility: 'none',
      'text-field': ['get', 'name'],
      'text-size': 12,
      'text-font': ['Noto Sans Bold'],
      'text-offset': [0, -1.6],
      'text-allow-overlap': true,
    },
    paint: {
      'text-color': '#FFFFFF',
      'text-halo-color': BRAND.colors.navy,
      'text-halo-width': 1.4,
    },
  })
}

const DEAL_FILTERS: { id: MapDealFilter; label: string; color: string }[] = [
  { id: 'all', label: 'ყველა', color: BRAND.colors.blue },
  { id: 'sale', label: 'იყიდება', color: DEAL_BRAND.sale },
  { id: 'rent', label: 'ქირავდება', color: DEAL_BRAND.rent },
  { id: 'daily', label: 'დღიურად', color: DEAL_BRAND.daily },
  { id: 'pledge', label: 'გირავდება', color: DEAL_BRAND.pledge },
]

const STATUS_FILTERS: { id: MapStatusFilter; label: string }[] = [
  { id: 'all', label: 'ყველა შენობა' },
  { id: 'active', label: 'აქტიური' },
  { id: 'construction', label: 'მშენებარე' },
  { id: 'completed', label: 'დასრულებული' },
]

function Map3DInner({
  dbBuildings = [],
  listings,
}: {
  dbBuildings?: MapBuildingCluster[]
  listings?: Listing[]
}) {
  const searchParams = useSearchParams()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MlMap | null>(null)
  const visibleRef = useRef<MapBuildingCluster[]>(STATIC_BUILDINGS)
  const allRef = useRef<MapBuildingCluster[]>(STATIC_BUILDINGS)
  const selectRef = useRef<(b: MapBuildingCluster | null) => void>(() => {})
  const deepLinked = useRef(false)

  const [selected, setSelected] = useState<MapBuildingCluster | null>(null)
  const [tab, setTab] = useState<DealType | 'all'>('all')
  const [dealFilter, setDealFilter] = useState<MapDealFilter>('all')
  const [statusFilter, setStatusFilter] = useState<MapStatusFilter>('all')
  const [floorFilter, setFloorFilter] = useState<number | null>(null)
  const [showNeighborhoods, setShowNeighborhoods] = useState(false)
  const [view3d, setView3d] = useState(true)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { resolvedTheme, setTheme } = useTheme()
  // ponytail: light-first (ThemeProvider default); avoid flash before hydration.
  const isDark = resolvedTheme === 'dark'
  const themeReady = resolvedTheme != null

  const selectedRef = useRef<MapBuildingCluster | null>(null)
  const view3dRef = useRef(true)
  const dealRef = useRef<MapDealFilter>('all')
  const floorRef = useRef<(n: number) => void>(() => {})
  const popupRef = useRef<maplibregl.Popup | null>(null)
  const darkRef = useRef(isDark)
  const nbhRef = useRef(showNeighborhoods)
  const styleGenRef = useRef(0)
  const styleUrlRef = useRef<string | null>(null)
  const remountRef = useRef<(() => void) | null>(null)
  useEffect(() => { darkRef.current = isDark }, [isDark])
  useEffect(() => { nbhRef.current = showNeighborhoods }, [showNeighborhoods])

  // Live DB listings when present; else demo LISTINGS. DB buildings add inventory/rings.
  const sourceListings = listings?.length ? listings : LISTINGS
  const listingCount = sourceListings.length
  const baseBuildings = useMemo(
    () =>
      mergeMapBuildings(
        clusterListingsToBuildings(sourceListings),
        projectsToConstructionBuildings(PROJECTS),
      ),
    [sourceListings],
  )
  const allBuildings = useMemo(
    () => mergeDbBuildings(baseBuildings, dbBuildings),
    [baseBuildings, dbBuildings],
  )
  useEffect(() => { allRef.current = allBuildings }, [allBuildings])

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

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const src = map.getSource(SOURCE_ID) as GeoJSONSource | undefined
    src?.setData(buildingsToGeoJSON(visible))
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
    const exclude = (showFloors && selected
      ? ['!=', ['get', 'id'], selected.id]
      : null) as FilterSpecification | null
    for (const layer of [EXTRUDE_ID, FILL_ID, LABEL_ID]) {
      if (map.getLayer(layer)) map.setFilter(layer, exclude)
    }
  }, [selected, dealFilter, ready])

  // Neighborhoods layer visibility toggle
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const vis = showNeighborhoods ? 'visible' : 'none'
    for (const layer of [NBH_CIRCLE_ID, NBH_LABEL_ID]) {
      if (map.getLayer(layer)) map.setLayoutProperty(layer, 'visibility', vis)
    }
  }, [showNeighborhoods, ready])

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
    const initialStyle = mapStyleUrl(darkRef.current)
    styleUrlRef.current = initialStyle
    const container = containerRef.current

    ;(async () => {
      let style
      try {
        style = await loadCleanStyle(initialStyle)
      } catch (err) {
        console.error('[Map3D] style', err)
        if (!cancelled) setError('რუკის ჩატვირთვა ვერ მოხერხდა. სცადე განახლება.')
        return
      }
      if (cancelled || mapRef.current) return

      const map = new maplibregl.Map({
        container,
        style,
        center: [MAP_CENTER.lng, MAP_CENTER.lat],
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
          layers: [EXTRUDE_ID, FILL_ID, FLOORS_FILL_ID].filter((id) => map.getLayer(id)),
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
        const price = document.createElement('div')
        price.className = 'sivrce-nbh-pop-price'
        price.textContent = `~$${Number(p.avgPriceM2USD).toLocaleString('en-US')}/m²`
        root.appendChild(price)
        root.appendChild(scoreRow('ტრანსპორტი', Number(p.transport)))
        root.appendChild(scoreRow('სკოლები', Number(p.schools)))
        root.appendChild(scoreRow('მწვანე', Number(p.green)))
        root.appendChild(scoreRow('უსაფრთხოება', Number(p.safety)))
        root.appendChild(scoreRow('ღამის ცხოვრება', Number(p.nightlife)))
        nbhPopup.setLngLat(e.lngLat).setDOMContent(root).addTo(map)
      }

      const onNeighborhoodEnter = () => {
        map.getCanvas().style.cursor = 'pointer'
      }
      const onNeighborhoodLeave = () => {
        map.getCanvas().style.cursor = ''
      }

      const mountOverlays = () => {
        applyBrandPaints(map, darkRef.current ? 'dark' : 'light')
        ensureLayers(map, buildingsToGeoJSON(visibleRef.current))
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
        const exclude = (showFloors && selectedRef.current
          ? ['!=', ['get', 'id'], selectedRef.current.id]
          : null) as FilterSpecification | null
        for (const layer of [EXTRUDE_ID, FILL_ID, LABEL_ID]) {
          if (map.getLayer(layer)) map.setFilter(layer, exclude)
        }
        const vis = nbhRef.current ? 'visible' : 'none'
        for (const layer of [NBH_CIRCLE_ID, NBH_LABEL_ID]) {
          if (map.getLayer(layer)) map.setLayoutProperty(layer, 'visibility', vis)
        }
        const labelColor = darkRef.current ? '#FFFFFF' : BRAND.colors.ink
        const labelHalo = darkRef.current ? BRAND.colors.navy : '#FFFFFF'
        for (const layer of [LABEL_ID, FLOORS_LABEL_ID, NBH_LABEL_ID]) {
          if (!map.getLayer(layer)) continue
          try {
            map.setPaintProperty(layer, 'text-color', labelColor)
            map.setPaintProperty(layer, 'text-halo-color', labelHalo)
          } catch {
            /* layer paint may differ */
          }
        }
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
        console.error('[Map3D]', e.error)
        if (!map.isStyleLoaded()) {
          setError('რუკის ჩატვირთვა ვერ მოხერხდა. სცადე განახლება.')
        }
      })

      map.on('mouseenter', EXTRUDE_ID, () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', EXTRUDE_ID, () => {
        map.getCanvas().style.cursor = ''
      })
      map.on('click', EXTRUDE_ID, onFeatureClick)
      map.on('click', FILL_ID, onFeatureClick)
      map.on('mousemove', FLOORS_FILL_ID, onFloorMove)
      map.on('mouseleave', FLOORS_FILL_ID, clearFloorHover)
      map.on('click', FLOORS_FILL_ID, onFloorClick)
      map.on('click', NBH_CIRCLE_ID, onNeighborhoodClick)
      map.on('mouseenter', NBH_CIRCLE_ID, onNeighborhoodEnter)
      map.on('mouseleave', NBH_CIRCLE_ID, onNeighborhoodLeave)
      map.on('click', onMapClick)

      remountRef.current = mountOverlays
    })()

    return () => {
      cancelled = true
      remountRef.current = null
      ro?.disconnect()
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [themeReady])

  // Theme flip → swap basemap + rebuild overlays (camera preserved).
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || !themeReady) return
    const next = mapStyleUrl(isDark)
    if (styleUrlRef.current === next) return
    styleUrlRef.current = next
    const gen = ++styleGenRef.current
    let cancelled = false
    ;(async () => {
      try {
        const style = await loadCleanStyle(next)
        if (cancelled || gen !== styleGenRef.current) return
        map.once('style.load', () => {
          if (gen !== styleGenRef.current) return
          remountRef.current?.()
        })
        map.setStyle(style)
      } catch (err) {
        console.error('[Map3D] theme style', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isDark, ready, themeReady])

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
      map.setPaintProperty(FILL_ID, 'fill-opacity', mode3d ? 0.22 : 0.5)
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
  const statusCount = (id: MapStatusFilter): string => {
    if (id === 'construction') return ` (${constructionCount})`
    if (id === 'completed') return ` (${completedCount})`
    return ''
  }

  const chip = isDark
    ? 'border-white/10 bg-sv-navy/85 text-white backdrop-blur-md'
    : 'border-sv-ink/10 bg-sv-surface/92 text-sv-ink shadow-soft backdrop-blur-md'
  const chipMuted = isDark ? 'text-white/60 hover:text-white' : 'text-sv-ink/55 hover:text-sv-ink'
  const shellBg = isDark ? 'bg-sv-navy' : 'bg-sv-cloud'
  const railBtn = (extra = '') =>
    `grid h-11 w-11 place-items-center transition hover:bg-sv-blue hover:text-white ${extra}`
  const railSep = isDark ? 'border-t border-white/10' : 'border-t border-sv-ink/8'

  return (
    <div className={`relative flex h-[calc(100dvh-4.5rem)] w-full overflow-hidden md:h-[calc(100dvh-5rem)] ${shellBg}`}>
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

        <div className="absolute left-4 top-4 z-20 flex max-w-[min(100%-2rem,560px)] flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-[12px] font-extrabold ${chip}`}>
              <Layers className={`h-3.5 w-3.5 ${isDark ? 'text-sv-blue-light' : 'text-sv-blue'}`} />
              {visible.length} შენობა · {listingCount} განცხადება
            </div>
            <button
              type="button"
              onClick={resetView}
              className={`grid h-11 w-11 place-items-center rounded-full border transition hover:bg-sv-blue hover:text-white ${chip}`}
              aria-label="საწყისი ხედი"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          <div
            className={`flex flex-wrap gap-1.5 rounded-tile border p-2 ${chip}`}
            role="group"
            aria-label="გარიგების ფილტრი"
          >
            {DEAL_FILTERS.map((f) => {
              const active = dealFilter === f.id
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setDealFilter(f.id)}
                  className={`min-h-11 rounded-full px-3.5 py-2 text-[12px] font-extrabold transition ${
                    active ? 'text-white shadow-glow-blue-sm' : chipMuted
                  }`}
                  style={active ? { background: f.color } : undefined}
                >
                  {f.label}
                </button>
              )
            })}
          </div>

          <div
            className={`flex flex-wrap gap-1.5 rounded-tile border p-2 ${chip}`}
            role="group"
            aria-label="სტატუსის ფილტრი"
          >
            {STATUS_FILTERS.map((f) => {
              const active = statusFilter === f.id
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={`inline-flex min-h-11 items-center gap-1 rounded-full px-3.5 py-2 text-[12px] font-extrabold transition ${
                    active ? 'bg-sv-blue text-white shadow-glow-blue-sm' : chipMuted
                  }`}
                  style={
                    active && f.id === 'completed'
                      ? { background: SERVICE_BRAND.developers.hue }
                      : active && f.id === 'construction'
                        ? { background: CATEGORY_BRAND.newProjects.hue }
                        : undefined
                  }
                >
                  {f.id === 'construction' && <HardHat className="h-3 w-3" />}
                  {f.id === 'completed' && <CheckCircle2 className="h-3 w-3" />}
                  {f.label}
                  {statusCount(f.id)}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowNeighborhoods((v) => !v)}
            aria-pressed={showNeighborhoods}
            className={`inline-flex min-h-11 w-fit items-center gap-1.5 rounded-tile border px-3.5 py-2 text-[12px] font-extrabold transition ${
              showNeighborhoods
                ? isDark
                  ? 'border-sv-blue-light/50 bg-sv-blue-light/15 text-white shadow-glow-blue-sm backdrop-blur-md'
                  : 'border-sv-blue/40 bg-sv-blue/10 text-sv-ink shadow-glow-blue-sm backdrop-blur-md'
                : `${chip} ${chipMuted}`
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            რაიონები ({NBH_DATA.features.length})
          </button>
        </div>

        {/* One chrome stack: zoom · 2D/3D · day/night */}
        <div
          className={`absolute right-3 top-4 z-20 flex flex-col overflow-hidden rounded-tile border md:right-4 ${chip}`}
          role="toolbar"
          aria-label="რუკის კონტროლი"
        >
          <button
            type="button"
            aria-label="გადიდება"
            onClick={() => mapRef.current?.zoomIn({ duration: 280 })}
            className={railBtn()}
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="დაპატარავება"
            onClick={() => mapRef.current?.zoomOut({ duration: 280 })}
            className={railBtn(railSep)}
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={view3d ? '2D ხედი' : '3D ხედი'}
            aria-pressed={view3d}
            onClick={toggleView3d}
            className={railBtn(`${railSep} ${view3d ? 'bg-sv-blue/15 text-sv-blue' : ''}`)}
          >
            {view3d ? <Square className="h-4 w-4" /> : <Box className="h-4 w-4" />}
          </button>
          <button
            type="button"
            aria-label={isDark ? 'დღის რეჟიმი' : 'ღამის რეჟიმი'}
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={railBtn(railSep)}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
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
}: {
  dbBuildings?: MapBuildingCluster[]
  listings?: Listing[]
}) {
  return (
    <Suspense
      fallback={
        <div className="grid h-[calc(100dvh-4.5rem)] place-items-center bg-sv-cloud text-[14px] font-bold text-sv-ink/55 dark:bg-sv-navy dark:text-white/70">
          3D რუკა იტვირთება…
        </div>
      }
    >
      <Map3DInner dbBuildings={dbBuildings} listings={listings} />
    </Suspense>
  )
}
