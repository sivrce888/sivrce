'use client'

/**
 * SIVRCE 3D map — MapLibre + OpenFreeMap, brand paints, clickable buildings.
 * ponytail: OpenFreeMap (no key). Swap tile URL → MapTiler/Google adapter when bill/key ready.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import maplibregl, { type Map as MlMap, type MapLayerMouseEvent } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { LISTINGS } from '@/data/listings'
import type { DealType } from '@/data/listings'
import { BRAND } from '@/lib/brand'
import {
  MAP_CENTER,
  buildingsToGeoJSON,
  clusterListingsToBuildings,
  type MapBuildingCluster,
} from '@/lib/map/buildings'
import BuildingPanel from '@/components/map/BuildingPanel'
import { Layers, RotateCcw } from 'lucide-react'

const STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? 'https://tiles.openfreemap.org/styles/dark'

const SOURCE_ID = 'sivrce-buildings'
const FILL_ID = 'sivrce-buildings-fill'
const EXTRUDE_ID = 'sivrce-buildings-3d'
const LABEL_ID = 'sivrce-buildings-label'

const BUILDINGS = clusterListingsToBuildings(LISTINGS)
const GEOJSON = buildingsToGeoJSON(BUILDINGS)
const BY_ID = Object.fromEntries(BUILDINGS.map((b) => [b.id, b])) as Record<
  string,
  MapBuildingCluster
>

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

function addListingBuildings(map: MlMap) {
  if (map.getSource(SOURCE_ID)) return

  map.addSource(SOURCE_ID, { type: 'geojson', data: GEOJSON })

  map.addLayer({
    id: FILL_ID,
    type: 'fill',
    source: SOURCE_ID,
    paint: {
      'fill-color': ['get', 'color'],
      'fill-opacity': 0.25,
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
      'fill-extrusion-opacity': 0.92,
    },
  })

  map.addLayer({
    id: LABEL_ID,
    type: 'symbol',
    source: SOURCE_ID,
    layout: {
      'text-field': ['to-string', ['get', 'total']],
      'text-size': 13,
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

export default function Map3D() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MlMap | null>(null)
  const [selected, setSelected] = useState<MapBuildingCluster | null>(null)
  const [tab, setTab] = useState<DealType | 'all'>('all')
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectBuilding = useCallback((b: MapBuildingCluster | null) => {
    setSelected(b)
    setTab('all')
  }, [])

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

    map.on('load', () => {
      if (cancelled) return
      applyBrandPaints(map)
      addListingBuildings(map)
      setReady(true)
    })

    map.on('error', (e) => {
      console.error('[Map3D]', e.error)
      setError('რუკის ჩატვირთვა ვერ მოხერხდა. სცადე განახლება.')
    })

    const onEnter = () => {
      map.getCanvas().style.cursor = 'pointer'
    }
    const onLeave = () => {
      map.getCanvas().style.cursor = ''
    }
    const onClick = (e: MapLayerMouseEvent) => {
      const f = e.features?.[0]
      const id = f?.properties?.id as string | undefined
      if (!id) return
      const b = BY_ID[id]
      if (!b) return
      selectBuilding(b)
      map.easeTo({
        center: [b.lng, b.lat],
        zoom: Math.max(map.getZoom(), 15.5),
        pitch: 62,
        duration: 700,
        essential: true,
      })
    }

    map.on('mouseenter', EXTRUDE_ID, onEnter)
    map.on('mouseleave', EXTRUDE_ID, onLeave)
    map.on('click', EXTRUDE_ID, onClick)
    map.on('click', FILL_ID, onClick)

    return () => {
      cancelled = true
      map.remove()
      mapRef.current = null
    }
  }, [selectBuilding])

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

        <div className="absolute bottom-4 left-4 z-20 flex flex-wrap gap-2 rounded-tile border border-white/10 bg-sv-navy/85 p-3 backdrop-blur-md">
          {(
            [
              ['იყიდება', '#2E6BFF'],
              ['ქირავდება', '#7C3AED'],
              ['დღიურად', '#E11D48'],
            ] as const
          ).map(([label, color]) => (
            <div key={label} className="flex items-center gap-1.5 text-[11px] font-extrabold text-white/80">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
              {label}
            </div>
          ))}
        </div>

        <div className="absolute left-4 top-4 z-20 flex gap-2">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-sv-navy/85 px-3.5 py-2 text-[12px] font-extrabold text-white backdrop-blur-md">
            <Layers className="h-3.5 w-3.5 text-sv-blue-light" />
            {BUILDINGS.length} შენობა · {LISTINGS.length} განცხადება
          </div>
          <button
            type="button"
            onClick={resetView}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-sv-navy/85 text-white backdrop-blur-md transition hover:bg-sv-blue"
            aria-label="საწყისი ხედი"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {selected && (
        <div className="absolute inset-x-0 bottom-0 z-30 max-h-[55%] overflow-hidden rounded-t-card border-t border-sv-ink/8 md:static md:max-h-none md:rounded-none md:border-t-0">
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
