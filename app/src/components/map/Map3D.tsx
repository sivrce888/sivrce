'use client'

/**
 * SIVRCE 3D map — MapLibre + brand paints, filters, click-anywhere, construction ghosts.
 * ponytail: OpenFreeMap (no key). setData filter = O(n) client; Meilisearch geo when scale hits.
 */

import { useEffect, useRef, useState, useCallback, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import maplibregl, {
  type Map as MlMap,
  type MapLayerMouseEvent,
  type MapMouseEvent,
  type GeoJSONSource,
  type FilterSpecification,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { LISTINGS } from '@/data/listings'
import type { DealType } from '@/data/listings'
import { PROJECTS } from '@/data/professionals'
import { BRAND } from '@/lib/brand'
import { DEAL_BRAND, CATEGORY_BRAND, SERVICE_BRAND } from '@/lib/category-brand'
import {
  MAP_CENTER,
  buildingsToGeoJSON,
  clusterListingsToBuildings,
  filterBuildings,
  findBuildingBySlug,
  findNearestBuilding,
  mergeMapBuildings,
  neighborhoodsToGeoJSON,
  projectsToConstructionBuildings,
  type MapBuildingCluster,
  type MapDealFilter,
  type MapStatusFilter,
} from '@/lib/map/buildings'
import BuildingPanel from '@/components/map/BuildingPanel'
import {
  EMPTY_FLOORS,
  floorTooltipKa,
  floorsToGeoJSON,
  type FloorInfo,
} from '@/lib/map/floors'
import {
  applyBrandPaints,
  ensureFloorLayers,
  FLOORS_FILL_ID,
  FLOORS_SOURCE_ID,
  STYLE_URL,
} from '@/lib/map/floorLayers'
import { Layers, RotateCcw, HardHat, CheckCircle2, MapPin } from 'lucide-react'

const SOURCE_ID = 'sivrce-buildings'
const FILL_ID = 'sivrce-buildings-fill'
const EXTRUDE_ID = 'sivrce-buildings-3d'
const LABEL_ID = 'sivrce-buildings-label'

const NBH_SOURCE_ID = 'sivrce-neighborhoods'
const NBH_CIRCLE_ID = 'sivrce-neighborhoods-circle'
const NBH_LABEL_ID = 'sivrce-neighborhoods-label'
const NBH_DATA = neighborhoodsToGeoJSON()

const ALL_BUILDINGS = mergeMapBuildings(
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
      'fill-extrusion-color': ['get', 'color'],
      'fill-extrusion-height': ['get', 'height'],
      'fill-extrusion-base': 0,
      'fill-extrusion-opacity': ['get', 'opacity'],
    },
  })

  map.addLayer({
    id: LABEL_ID,
    type: 'symbol',
    source: SOURCE_ID,
    layout: {
      'text-field': [
        'case',
        ['==', ['get', 'status'], 'construction'],
        [
          'case',
          ['>', ['get', 'total'], 0],
          ['to-string', ['get', 'total']],
          ['concat', ['to-string', ['get', 'progress']], '%'],
        ],
        [
          'case',
          ['!=', ['get', 'code'], ''],
          ['get', 'code'],
          ['to-string', ['get', 'total']],
        ],
      ],
      'text-size': 11,
      'text-font': ['Noto Sans Bold'],
      'text-allow-overlap': true,
    },
    paint: {
      'text-color': '#FFFFFF',
      'text-halo-color': BRAND.colors.navy,
      'text-halo-width': 1.4,
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

function Map3DInner({ dbBuildings = [] }: { dbBuildings?: MapBuildingCluster[] }) {
  const searchParams = useSearchParams()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MlMap | null>(null)
  const visibleRef = useRef<MapBuildingCluster[]>(ALL_BUILDINGS)
  const allRef = useRef<MapBuildingCluster[]>(ALL_BUILDINGS)
  const selectRef = useRef<(b: MapBuildingCluster | null) => void>(() => {})
  const deepLinked = useRef(false)

  const [selected, setSelected] = useState<MapBuildingCluster | null>(null)
  const [tab, setTab] = useState<DealType | 'all'>('all')
  const [dealFilter, setDealFilter] = useState<MapDealFilter>('all')
  const [statusFilter, setStatusFilter] = useState<MapStatusFilter>('all')
  const [floorFilter, setFloorFilter] = useState<number | null>(null)
  const [showNeighborhoods, setShowNeighborhoods] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedRef = useRef<MapBuildingCluster | null>(null)
  const dealRef = useRef<MapDealFilter>('all')
  const floorRef = useRef<(n: number) => void>(() => {})
  const popupRef = useRef<maplibregl.Popup | null>(null)

  // DB-curated buildings merged over static; static catalog wins on slug collision.
  const allBuildings = useMemo(() => {
    if (dbBuildings.length === 0) return ALL_BUILDINGS
    const staticSlugs = new Set(ALL_BUILDINGS.map((b) => b.slug))
    return [...ALL_BUILDINGS, ...dbBuildings.filter((b) => !b.slug || !staticSlugs.has(b.slug))]
  }, [dbBuildings])
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

  // Floor stack: replace the selected building's silhouette with per-floor slabs.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const src = map.getSource(FLOORS_SOURCE_ID) as GeoJSONSource | undefined
    src?.setData(selected ? floorsToGeoJSON(selected, dealFilter) : EMPTY_FLOORS)
    if (!selected) popupRef.current?.remove()
    const exclude = (selected
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
      pitch: 62,
      duration: 900,
      essential: true,
    })
  }, [ready, searchParams, selectBuilding, allBuildings])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    let cancelled = false
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: [MAP_CENTER.lng, MAP_CENTER.lat],
      zoom: 13.2,
      pitch: 58,
      bearing: -18,
      maxPitch: 70,
      fadeDuration: 0,
    })
    mapRef.current = map

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right')
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
      }),
      'top-right',
    )

    const flyTo = (b: MapBuildingCluster) => {
      map.easeTo({
        center: [b.lng, b.lat],
        zoom: Math.max(map.getZoom(), 15.5),
        pitch: 62,
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
        layers: [EXTRUDE_ID, FILL_ID, FLOORS_FILL_ID],
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
      // DOM-built content — no HTML injection from data
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

    map.on('load', () => {
      if (cancelled) return
      applyBrandPaints(map)
      ensureLayers(map, buildingsToGeoJSON(visibleRef.current))
      setReady(true)
    })

    map.on('error', (e) => {
      console.error('[Map3D]', e.error)
      setError('რუკის ჩატვირთვა ვერ მოხერხდა. სცადე განახლება.')
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

    return () => {
      cancelled = true
      map.remove()
      mapRef.current = null
    }
  }, [])

  const resetView = () => {
    mapRef.current?.easeTo({
      center: [MAP_CENTER.lng, MAP_CENTER.lat],
      zoom: 13.2,
      pitch: 58,
      bearing: -18,
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

  return (
    <div className="relative flex h-[calc(100dvh-4.5rem)] w-full overflow-hidden bg-sv-navy md:h-[calc(100dvh-5rem)]">
      <div className="relative min-w-0 flex-1">
        <div ref={containerRef} className="absolute inset-0" />

        {!ready && !error && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-sv-navy/80 text-[14px] font-bold text-white/70">
            3D რუკა იტვირთება…
          </div>
        )}
        {error && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-sv-navy/90 px-6 text-center text-[14px] font-bold text-white/80">
            {error}
          </div>
        )}

        <div className="absolute left-4 top-4 z-20 flex max-w-[min(100%-2rem,560px)] flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-sv-navy/85 px-3.5 py-2 text-[12px] font-extrabold text-white backdrop-blur-md">
              <Layers className="h-3.5 w-3.5 text-sv-blue-light" />
              {visible.length} შენობა · {LISTINGS.length} განცხადება
            </div>
            <button
              type="button"
              onClick={resetView}
              className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-sv-navy/85 text-white backdrop-blur-md transition hover:bg-sv-blue"
              aria-label="საწყისი ხედი"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          <div
            className="flex flex-wrap gap-1.5 rounded-tile border border-white/10 bg-sv-navy/85 p-2 backdrop-blur-md"
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
                    active ? 'text-white shadow-glow-blue-sm' : 'text-white/60 hover:text-white'
                  }`}
                  style={active ? { background: f.color } : undefined}
                >
                  {f.label}
                </button>
              )
            })}
          </div>

          <div
            className="flex flex-wrap gap-1.5 rounded-tile border border-white/10 bg-sv-navy/85 p-2 backdrop-blur-md"
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
                    active
                      ? 'bg-sv-blue text-white shadow-glow-blue-sm'
                      : 'text-white/60 hover:text-white'
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
            className={`inline-flex min-h-11 w-fit items-center gap-1.5 rounded-tile border px-3.5 py-2 text-[12px] font-extrabold backdrop-blur-md transition ${
              showNeighborhoods
                ? 'border-sv-blue-light/50 bg-sv-blue-light/15 text-white shadow-glow-blue-sm'
                : 'border-white/10 bg-sv-navy/85 text-white/60 hover:text-white'
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            რაიონები ({NBH_DATA.features.length})
          </button>
        </div>

        <div className="absolute bottom-4 left-4 z-20 flex flex-wrap gap-2 rounded-tile border border-white/10 bg-sv-navy/85 p-3 backdrop-blur-md">
          {(
            [
              ['იყიდება', DEAL_BRAND.sale],
              ['ქირავდება', DEAL_BRAND.rent],
              ['დღიურად', DEAL_BRAND.daily],
              ['გირავდება', DEAL_BRAND.pledge],
              ['მშენებარე', CATEGORY_BRAND.newProjects.hue],
              ['დასრულებული', SERVICE_BRAND.developers.hue],
              ['რაიონი', BRAND.colors.blueLight],
            ] as const
          ).map(([label, color]) => (
            <div key={label} className="flex items-center gap-1.5 text-[11px] font-extrabold text-white/80">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
              {label}
            </div>
          ))}
        </div>

        <p className="pointer-events-none absolute bottom-4 right-4 z-20 hidden max-w-[240px] rounded-control border border-white/10 bg-sv-navy/80 px-3 py-2 text-[12px] font-semibold text-white/55 backdrop-blur-md md:block">
          დააჭირე კორპუსს — სართულები გაიხსნება · მიატრიე მაუსი სართულს
        </p>
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

export default function Map3D({ dbBuildings }: { dbBuildings?: MapBuildingCluster[] }) {
  return (
    <Suspense
      fallback={
        <div className="grid h-[calc(100dvh-4.5rem)] place-items-center bg-sv-navy text-[14px] font-bold text-white/70">
          3D რუკა იტვირთება…
        </div>
      }
    >
      <Map3DInner dbBuildings={dbBuildings} />
    </Suspense>
  )
}
