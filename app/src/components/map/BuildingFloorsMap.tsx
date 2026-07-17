'use client'

/**
 * Focused floor-stack map for /buildings/[slug] — one building, exploded floors.
 * Data arrives as props from the server (SSG); the island never imports listings.
 * scrollZoom off: page scroll wins, pinch/buttons still zoom.
 */

import { useEffect, useRef } from 'react'
import maplibregl, {
  type Map as MlMap,
  type MapLayerMouseEvent,
  type GeoJSONSource,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  applyBrandPaints,
  ensureFloorLayers,
  FLOORS_FILL_ID,
  FLOORS_SOURCE_ID,
  STYLE_URL,
} from '@/lib/map/floorLayers'
import { floorTooltipKa, type FloorInfo } from '@/lib/map/floors'

interface BuildingFloorsMapProps {
  geojson: GeoJSON.FeatureCollection
  floors: FloorInfo[]
  center: { lat: number; lng: number }
  selectedFloor: number | null
  onSelectFloor: (n: number) => void
  label: string
}

export default function BuildingFloorsMap({
  geojson,
  floors,
  center,
  selectedFloor,
  onSelectFloor,
  label,
}: BuildingFloorsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MlMap | null>(null)
  const selectRef = useRef(onSelectFloor)
  const selectedRef = useRef(selectedFloor)
  useEffect(() => { selectRef.current = onSelectFloor }, [onSelectFloor])
  useEffect(() => { selectedRef.current = selectedFloor }, [selectedFloor])

  // Keep the chosen slab lit.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.getSource(FLOORS_SOURCE_ID)) return
    for (const f of floors) {
      map.setFeatureState(
        { source: FLOORS_SOURCE_ID, id: f.n },
        { selected: selectedFloor === f.n },
      )
    }
  }, [selectedFloor, floors])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let cancelled = false
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: [center.lng, center.lat],
      zoom: 16.2,
      pitch: 62,
      bearing: -20,
      maxPitch: 70,
      fadeDuration: 0,
      scrollZoom: false,
    })
    mapRef.current = map
    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true, showCompass: false }),
      'top-right',
    )

    const popup = new maplibregl.Popup({
      className: 'sivrce-floor-pop',
      closeButton: false,
      closeOnClick: false,
      offset: 12,
      maxWidth: '240px',
    })

    let hovered: number | null = null
    const clearHover = () => {
      if (hovered != null) {
        map.setFeatureState({ source: FLOORS_SOURCE_ID, id: hovered }, { hover: false })
        hovered = null
      }
      popup.remove()
      map.getCanvas().style.cursor = ''
    }

    const onMove = (e: MapLayerMouseEvent) => {
      const p = e.features?.[0]?.properties
      const n = Number(p?.floor)
      if (!Number.isFinite(n)) return
      if (hovered !== n) {
        if (hovered != null) {
          map.setFeatureState({ source: FLOORS_SOURCE_ID, id: hovered }, { hover: false })
        }
        hovered = n
        map.setFeatureState({ source: FLOORS_SOURCE_ID, id: n }, { hover: true })
      }
      map.getCanvas().style.cursor = 'pointer'
      // DOM-built content — no HTML injection from data
      const tip = floorTooltipKa(
        { n, available: Number(p?.available) || 0, minPriceGEL: null },
        { ghost: false, showPrice: false },
      )
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

    const onClick = (e: MapLayerMouseEvent) => {
      const n = Number(e.features?.[0]?.properties?.floor)
      if (Number.isFinite(n) && n > 0) selectRef.current(n)
    }

    map.on('load', () => {
      if (cancelled) return
      applyBrandPaints(map)
      ensureFloorLayers(map, 15)
      ;(map.getSource(FLOORS_SOURCE_ID) as GeoJSONSource).setData(geojson)
      for (const f of floors) {
        map.setFeatureState(
          { source: FLOORS_SOURCE_ID, id: f.n },
          { selected: selectedRef.current === f.n },
        )
      }
    })
    map.on('mousemove', FLOORS_FILL_ID, onMove)
    map.on('mouseleave', FLOORS_FILL_ID, clearHover)
    map.on('click', FLOORS_FILL_ID, onClick)

    return () => {
      cancelled = true
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once; server props never change for the page's lifetime
  }, [])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      role="img"
      aria-label={`${label} — სართულების 3D ხედი`}
    />
  )
}
