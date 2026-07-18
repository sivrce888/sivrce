'use client'

/**
 * Focused floor-stack map for /buildings/[slug] — one building, exploded floors.
 * Data arrives as props from the server (SSG); the island never imports listings.
 * scrollZoom off: page scroll wins, pinch/buttons still zoom.
 */

import { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import maplibregl, {
  type Map as MlMap,
  type MapLayerMouseEvent,
  type GeoJSONSource,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { BRAND } from '@/lib/brand'
import {
  applyBrandPaints,
  bindMissingImages,
  ensureFloorLayers,
  FLOORS_FILL_ID,
  FLOORS_LABEL_ID,
  FLOORS_SOURCE_ID,
  mapStyleUrl,
} from '@/lib/map/floorLayers'
import { floorTooltipKa, type FloorInfo } from '@/lib/map/floors'

interface BuildingFloorsMapProps {
  geojson: GeoJSON.FeatureCollection
  floors: FloorInfo[]
  center: { lat: number; lng: number }
  /** Omit both on project pages — slabs stay view-only */
  selectedFloor?: number | null
  onSelectFloor?: (n: number) => void
  /** Construction ghost: tooltip shows progress, no availability */
  ghost?: boolean
  progress?: number
  label: string
}

export default function BuildingFloorsMap({
  geojson,
  floors,
  center,
  selectedFloor = null,
  onSelectFloor,
  ghost = false,
  progress,
  label,
}: BuildingFloorsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MlMap | null>(null)
  const selectRef = useRef<(n: number) => void>(() => {})
  const selectedRef = useRef(selectedFloor)
  const geoRef = useRef(geojson)
  const floorsRef = useRef(floors)
  const styleUrlRef = useRef<string | null>(null)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const themeReady = resolvedTheme != null

  useEffect(() => { selectRef.current = onSelectFloor ?? (() => {}) }, [onSelectFloor])
  useEffect(() => { selectedRef.current = selectedFloor }, [selectedFloor])
  useEffect(() => { geoRef.current = geojson }, [geojson])
  useEffect(() => { floorsRef.current = floors }, [floors])

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
    if (!containerRef.current || mapRef.current || !themeReady) return
    let cancelled = false
    const initialStyle = mapStyleUrl(isDark)
    styleUrlRef.current = initialStyle
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: initialStyle,
      center: [center.lng, center.lat],
      zoom: 16.2,
      pitch: 62,
      bearing: -20,
      maxPitch: 70,
      fadeDuration: 0,
      scrollZoom: false,
    })
    mapRef.current = map
    bindMissingImages(map)
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
      const tip = floorTooltipKa(
        { n, available: Number(p?.available) || 0, minPriceGEL: null },
        { ghost, progress, showPrice: false },
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

    const mountOverlays = (dark: boolean) => {
      applyBrandPaints(map, dark ? 'dark' : 'light')
      ensureFloorLayers(map, 15)
      ;(map.getSource(FLOORS_SOURCE_ID) as GeoJSONSource).setData(geoRef.current)
      for (const f of floorsRef.current) {
        map.setFeatureState(
          { source: FLOORS_SOURCE_ID, id: f.n },
          { selected: selectedRef.current === f.n },
        )
      }
      if (map.getLayer(FLOORS_LABEL_ID)) {
        try {
          map.setPaintProperty(FLOORS_LABEL_ID, 'text-color', dark ? '#FFFFFF' : BRAND.colors.ink)
          map.setPaintProperty(
            FLOORS_LABEL_ID,
            'text-halo-color',
            dark ? BRAND.colors.navy : '#FFFFFF',
          )
        } catch {
          /* ok */
        }
      }
    }

    map.on('load', () => {
      if (cancelled) return
      map.resize()
      mountOverlays(isDark)
    })
    const ro = new ResizeObserver(() => map.resize())
    ro.observe(containerRef.current)
    map.on('mousemove', FLOORS_FILL_ID, onMove)
    map.on('mouseleave', FLOORS_FILL_ID, clearHover)
    map.on('click', FLOORS_FILL_ID, onClick)

    return () => {
      cancelled = true
      ro.disconnect()
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once theme is known; server props stable
  }, [themeReady])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !themeReady) return
    const next = mapStyleUrl(isDark)
    if (styleUrlRef.current === next) return
    styleUrlRef.current = next
    const onStyle = () => {
      applyBrandPaints(map, isDark ? 'dark' : 'light')
      ensureFloorLayers(map, 15)
      ;(map.getSource(FLOORS_SOURCE_ID) as GeoJSONSource).setData(geoRef.current)
      for (const f of floorsRef.current) {
        map.setFeatureState(
          { source: FLOORS_SOURCE_ID, id: f.n },
          { selected: selectedRef.current === f.n },
        )
      }
    }
    map.once('style.load', onStyle)
    map.setStyle(next)
    return () => {
      map.off('style.load', onStyle)
    }
  }, [isDark, themeReady])

  return (
    <div className="absolute inset-0" role="img" aria-label={`${label} — სართულების 3D ხედი`}>
      {/* ponytail: MapLibre forces position:relative — absolute on the map node collapses to h=0. */}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  )
}
