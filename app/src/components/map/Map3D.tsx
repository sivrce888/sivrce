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
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { LISTINGS } from '@/data/listings'
import type { DealType } from '@/data/listings'
import { PROJECTS } from '@/data/professionals'
import { BRAND } from '@/lib/brand'
import { DEAL_BRAND, CATEGORY_BRAND } from '@/lib/category-brand'
import {
  MAP_CENTER,
  buildingsToGeoJSON,
  clusterListingsToBuildings,
  filterBuildings,
  findBuildingBySlug,
  findNearestBuilding,
  mergeMapBuildings,
  projectsToConstructionBuildings,
  type MapBuildingCluster,
  type MapDealFilter,
  type MapStatusFilter,
} from '@/lib/map/buildings'
import BuildingPanel from '@/components/map/BuildingPanel'
import { Layers, RotateCcw, HardHat } from 'lucide-react'

const STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? 'https://tiles.openfreemap.org/styles/dark'

const SOURCE_ID = 'sivrce-buildings'
const FILL_ID = 'sivrce-buildings-fill'
const EXTRUDE_ID = 'sivrce-buildings-3d'
const LABEL_ID = 'sivrce-buildings-label'

const ALL_BUILDINGS = mergeMapBuildings(
  clusterListingsToBuildings(LISTINGS),
  projectsToConstructionBuildings(PROJECTS),
)

function applyBrandPaints(map: MlMap) {
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
]

function Map3DInner() {
  const searchParams = useSearchParams()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MlMap | null>(null)
  const visibleRef = useRef<MapBuildingCluster[]>(ALL_BUILDINGS)
  const selectRef = useRef<(b: MapBuildingCluster | null) => void>(() => {})
  const deepLinked = useRef(false)

  const [selected, setSelected] = useState<MapBuildingCluster | null>(null)
  const [tab, setTab] = useState<DealType | 'all'>('all')
  const [dealFilter, setDealFilter] = useState<MapDealFilter>('all')
  const [statusFilter, setStatusFilter] = useState<MapStatusFilter>('all')
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const visible = useMemo(
    () => filterBuildings(ALL_BUILDINGS, dealFilter, statusFilter),
    [dealFilter, statusFilter],
  )
  useEffect(() => { visibleRef.current = visible }, [visible])

  const selectBuilding = useCallback((b: MapBuildingCluster | null) => {
    setSelected(b)
    setTab('all')
  }, [])
  useEffect(() => { selectRef.current = selectBuilding }, [selectBuilding])

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

  useEffect(() => {
    if (!ready || deepLinked.current) return
    const slug = searchParams.get('building')
    if (!slug) return
    const b = findBuildingBySlug(slug, ALL_BUILDINGS)
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
  }, [ready, searchParams, selectBuilding])

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
        visibleRef.current.find((x) => x.id === id) ?? ALL_BUILDINGS.find((x) => x.id === id)
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
      const hits = map.queryRenderedFeatures(e.point, { layers: [EXTRUDE_ID, FILL_ID] })
      if (hits.length > 0) return
      const nearest = findNearestBuilding(e.lngLat.lat, e.lngLat.lng, visibleRef.current)
      selectRef.current(nearest)
      if (nearest) flyTo(nearest)
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

  const constructionCount = ALL_BUILDINGS.filter((b) => b.status === 'construction').length

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
                >
                  {f.id === 'construction' && <HardHat className="h-3 w-3" />}
                  {f.label}
                  {f.id === 'construction' ? ` (${constructionCount})` : ''}
                </button>
              )
            })}
          </div>
        </div>

        <div className="absolute bottom-4 left-4 z-20 flex flex-wrap gap-2 rounded-tile border border-white/10 bg-sv-navy/85 p-3 backdrop-blur-md">
          {(
            [
              ['იყიდება', DEAL_BRAND.sale],
              ['ქირავდება', DEAL_BRAND.rent],
              ['დღიურად', DEAL_BRAND.daily],
              ['გირავდება', DEAL_BRAND.pledge],
              ['მშენებარე', CATEGORY_BRAND.newProjects.hue],
            ] as const
          ).map(([label, color]) => (
            <div key={label} className="flex items-center gap-1.5 text-[11px] font-extrabold text-white/80">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
              {label}
            </div>
          ))}
        </div>

        <p className="pointer-events-none absolute bottom-4 right-4 z-20 hidden max-w-[240px] rounded-control border border-white/10 bg-sv-navy/80 px-3 py-2 text-[12px] font-semibold text-white/55 backdrop-blur-md md:block">
          დააჭირე კორპუსს — განცხადებები გაიხსნება
        </p>
      </div>

      {selected && (
        <div className="absolute inset-x-0 bottom-0 z-30 max-h-[58%] overflow-hidden rounded-t-card border-t border-sv-ink/8 md:static md:max-h-none md:rounded-none md:border-t-0">
          <BuildingPanel
            building={selected}
            tab={tab}
            onTab={setTab}
            onClose={() => selectBuilding(null)}
          />
        </div>
      )}
    </div>
  )
}

export default function Map3D() {
  return (
    <Suspense
      fallback={
        <div className="grid h-[calc(100dvh-4.5rem)] place-items-center bg-sv-navy text-[14px] font-bold text-white/70">
          3D რუკა იტვირთება…
        </div>
      }
    >
      <Map3DInner />
    </Suspense>
  )
}
