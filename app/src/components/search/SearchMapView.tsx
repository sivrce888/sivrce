'use client'

/**
 * /search map view — price pins for the current filtered result set.
 * Shares the /map basemap stack (style proxy, Georgia bounds, chrome helpers)
 * instead of the foreign-WIP Map3D (building clusters + panels ≠ result pins).
 * ponytail: plain pill markers, no clustering — ≤100 pins is fine.
 * Upgrade path: supercluster when the map cap grows past a few hundred.
 */

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { GEORGIA_MAX_BOUNDS, MAP_MIN_ZOOM } from '@/lib/map/buildings'
import { loadMapBasemap, mapStyleUrl } from '@/lib/map/floorLayers'
import { mapChromeOptions } from '@/lib/map/mapChrome'
import { initialMapCenter } from '@/lib/map/user-place'
import { useI18n } from '@/lib/i18n/context'
import { localizedHref } from '@/lib/i18n/core'
import { useCurrency } from '@/lib/currency'
import { BRAND } from '@/lib/brand'
import type { Listing } from '@/data/listings'

export default function SearchMapView({ listings }: { listings: Listing[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const [ready, setReady] = useState(false)
  const router = useRouter()
  const { lang } = useI18n()
  const { format } = useCurrency()

  // Boot once — light basemap through the same /api/map proxy /map uses.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let cancelled = false
    const container = containerRef.current
    ;(async () => {
      let style
      try {
        style = await loadMapBasemap(mapStyleUrl(false))
      } catch {
        return // basemap proxy down — leave the empty shell, list view still works
      }
      if (cancelled || mapRef.current) return
      const boot = initialMapCenter()
      const map = new maplibregl.Map({
        container,
        style,
        center: [boot.lng, boot.lat],
        zoom: 11,
        minZoom: MAP_MIN_ZOOM,
        maxBounds: GEORGIA_MAX_BOUNDS,
        renderWorldCopies: false,
        fadeDuration: 0,
        ...mapChromeOptions(),
      })
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
      mapRef.current = map
      setReady(true)
    })()
    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  // Pins follow the current result set; camera fits them.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []
    const bounds = new maplibregl.LngLatBounds()
    for (const l of listings) {
      const { lat, lng } = l.coords
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) continue
      const el = document.createElement('button')
      el.type = 'button'
      el.className =
        'cursor-pointer whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-black text-white shadow-glow-blue-sm transition-transform hover:z-10 hover:scale-105'
      el.style.backgroundColor = BRAND.colors.blue
      el.textContent = format(l.priceGEL)
      el.setAttribute('aria-label', l.title)
      el.addEventListener('click', () => router.push(localizedHref(`/listing/${l.id}`, lang)))
      markersRef.current.push(
        new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([lng, lat]).addTo(map),
      )
      bounds.extend([lng, lat])
    }
    if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 400 })
  }, [ready, listings, format, lang, router])

  return (
    <div
      ref={containerRef}
      className="h-[62vh] min-h-[420px] w-full overflow-hidden rounded-card border border-sv-ink/[0.06] bg-sv-surface shadow-card"
    />
  )
}
