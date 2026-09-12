'use client'

/**
 * MetroStationMap — lean MapLibre embed showing a metro station pin + walking radius.
 * Lazy-loaded, minimal bundle impact.
 */

import { useEffect, useRef, useState } from 'react'
import type { Map as MlMap } from 'maplibre-gl'
import { bindMaplibreWorker } from '@/lib/map/maplibre-worker'
import { mapChromeOptions, tightenAttribution } from '@/lib/map/mapChrome'

type MaplibreNS = typeof import('maplibre-gl')

function resolveMaplibre(mlMod: MaplibreNS | { default: MaplibreNS }): MaplibreNS {
  if ('default' in mlMod && mlMod.default && typeof mlMod.default.Map === 'function') {
    return mlMod.default as MaplibreNS
  }
  return mlMod as MaplibreNS
}

interface MetroStationMapProps {
  lat: number
  lng: number
  stationName: string
  lines: string[]
  radiusM?: number
}

export default function MetroStationMap({
  lat,
  lng,
  stationName,
  lines,
  radiusM = 800,
}: MetroStationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MlMap | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    let disposed = false
    let map: MlMap | undefined

    async function boot() {
      if (!containerRef.current || disposed) return

      const mlMod = await import('maplibre-gl').catch(() => null)
      if (!mlMod || disposed) return

      const maplibregl = resolveMaplibre(mlMod)
      bindMaplibreWorker(maplibregl)

      map = new maplibregl.Map({
        container: containerRef.current,
        // First-party proxy (openfreemap positron) — tiles.openmaptiles.org
        // 403s without an API key. Same default as floorLayers STYLE_CLEAN.
        style: process.env.NEXT_PUBLIC_MAP_STYLE_URL_CLEAN ?? '/api/map/styles/positron',
        center: [lng, lat],
        zoom: 14,
        pitch: 0,
        keyboard: false,
        interactive: true,
        ...mapChromeOptions(),
      })

      const nav = new maplibregl.NavigationControl({
        visualizePitch: false,
        showCompass: false,
        showZoom: true,
      })
      map.addControl(nav, 'bottom-right')
      tightenAttribution(map)

      // Station pin
      const el = document.createElement('div')
      el.className = 'metro-station-pin'
      el.style.cssText =
        'width:28px;height:28px;border-radius:50%;background:#0066FF;border:3px solid #fff;' +
        'box-shadow:0 2px 8px rgba(0,0,20,.25);display:grid;place-items:center;'
      el.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M8 6v6m8-6v6M5 18h14M5 12h14M5 6h14"/></svg>`
      el.title = `${stationName} (${lines.join(', ')})`

      new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([lng, lat])
        .addTo(map)

      map.on('load', () => {
        if (disposed || !map) return
        map.addSource('metro-radius', {
          type: 'geojson',
          data: circleGeoJSON(lng, lat, radiusM),
        })
        map.addLayer({
          id: 'metro-radius-fill',
          type: 'fill',
          source: 'metro-radius',
          paint: { 'fill-color': '#0066FF', 'fill-opacity': 0.08 },
        })
        map.addLayer({
          id: 'metro-radius-stroke',
          type: 'line',
          source: 'metro-radius',
          paint: { 'line-color': '#0066FF', 'line-width': 1.5, 'line-opacity': 0.35 },
        })
        setReady(true)
      })

      mapRef.current = map
    }

    boot().catch(() => {
      if (!disposed) setError(true)
    })

    return () => {
      disposed = true
      map?.remove()
      mapRef.current = null
    }
  }, [lat, lng, stationName, lines, radiusM])

  if (error) {
    return (
      <div className="grid h-[260px] place-items-center rounded-card border border-sv-ink/[0.06] bg-sv-surface text-[13px] font-bold text-sv-ink/40">
        Karte konnte nicht geladen werden
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-card border border-sv-ink/[0.06] shadow-card">
      <div ref={containerRef} className="h-[260px] w-full" />
      {!ready && (
        <div className="absolute inset-0 grid place-items-center bg-sv-surface/80 backdrop-blur-sm">
          <span className="text-[13px] font-bold text-sv-ink/40">Karte wird geladen…</span>
        </div>
      )}
    </div>
  )
}

function circleGeoJSON(lng: number, lat: number, radiusM: number) {
  const R = 6371000
  const dLat = radiusM / R
  const dLng = dLat / Math.cos((lat * Math.PI) / 180)
  const points: [number, number][] = []
  for (let i = 0; i <= 16; i++) {
    const angle = (i / 16) * 2 * Math.PI
    points.push([
      lng + dLng * Math.cos(angle) * (180 / Math.PI),
      lat + dLat * Math.sin(angle) * (180 / Math.PI),
    ])
  }
  return {
    type: 'Feature' as const,
    geometry: { type: 'Polygon' as const, coordinates: [points] },
    properties: {},
  }
}
