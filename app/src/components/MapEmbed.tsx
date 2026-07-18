'use client'

/**
 * SIVRCE — MapLibre pin embed (first-party tiles via /api/map).
 * Replaces the old Google Maps iframe. Same props surface for callers.
 */

import { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import maplibregl, { type Map as MlMap } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { BRAND } from '@/lib/brand'
import { GEORGIA_MAX_BOUNDS, MAP_MIN_ZOOM } from '@/lib/map/buildings'
import { loadMapBasemap, mapStyleUrl } from '@/lib/map/floorLayers'
import { mapChromeOptions, tightenAttribution } from '@/lib/map/mapChrome'

interface MapEmbedProps {
  lat: number
  lng: number
  /** Zoom level (1–21), default 14 */
  zoom?: number
  /** Kept for API compat — pin is always placed */
  mode?: 'place' | 'view' | 'search'
  /** Optional label under the pin */
  q?: string
  className?: string
  aspect?: '4/3' | '16/9' | '1/1'
  /** When false, map is display-only (homepage preview under a link) */
  interactive?: boolean
}

const ASPECTS = { '4/3': 'aspect-[4/3]', '16/9': 'aspect-video', '1/1': 'aspect-square' }

export default function MapEmbed({
  lat,
  lng,
  zoom = 14,
  q,
  className = '',
  aspect = '4/3',
  interactive = true,
}: MapEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MlMap | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const themeReady = resolvedTheme != null

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !themeReady) return
    let cancelled = false
    let ro: ResizeObserver | null = null
    const container = containerRef.current
    const styleKey = mapStyleUrl(isDark)

    ;(async () => {
      let style
      try {
        style = await loadMapBasemap(styleKey)
      } catch (err) {
        console.error('[MapEmbed] style', err)
        return
      }
      if (cancelled || mapRef.current) return

      const map = new maplibregl.Map({
        container,
        style,
        center: [lng, lat],
        zoom,
        pitch: interactive ? 45 : 35,
        bearing: -12,
        maxPitch: 60,
        minZoom: MAP_MIN_ZOOM,
        maxBounds: GEORGIA_MAX_BOUNDS,
        renderWorldCopies: false,
        fadeDuration: 0,
        interactive,
        scrollZoom: interactive,
        ...mapChromeOptions(),
      })
      mapRef.current = map

      const pin = document.createElement('div')
      pin.setAttribute('aria-hidden', 'true')
      pin.style.cssText =
        `width:18px;height:18px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);` +
        `background:${BRAND.colors.orange};border:2px solid #fff;` +
        `box-shadow:0 2px 8px rgba(5,11,38,0.35)`
      const marker = new maplibregl.Marker({ element: pin, anchor: 'center' })
        .setLngLat([lng, lat])
        .addTo(map)
      if (q) {
        marker.setPopup(
          new maplibregl.Popup({ offset: 14, closeButton: false }).setText(q),
        )
      }
      markerRef.current = marker

      map.once('load', () => {
        tightenAttribution(map)
        map.resize()
      })
      ro = new ResizeObserver(() => map.resize())
      ro.observe(container)
    })()

    return () => {
      cancelled = true
      ro?.disconnect()
      markerRef.current?.remove()
      markerRef.current = null
      mapRef.current?.remove()
      mapRef.current = null
    }
    // Mount once per theme readiness; lat/lng updates handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount gate
  }, [themeReady])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.jumpTo({ center: [lng, lat], zoom })
    markerRef.current?.setLngLat([lng, lat])
    if (q) {
      markerRef.current?.setPopup(
        new maplibregl.Popup({ offset: 14, closeButton: false }).setText(q),
      )
    }
  }, [lat, lng, zoom, q])

  return (
    <div
      className={`overflow-hidden rounded-card border border-sv-ink/6 ${ASPECTS[aspect]} ${className}`}
    >
      <div ref={containerRef} className="h-full w-full" role="img" aria-label={q ?? 'Sivrce map'} />
    </div>
  )
}
