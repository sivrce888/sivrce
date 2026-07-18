'use client'

/**
 * SIVRCE — MapLibre pin embed (first-party tiles via /api/map).
 * Lazy MapLibre + theme setStyle + load/error/retry. Georgia coords only.
 * highlight: orange pin + OSM building ring (or square fallback).
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import type { Map as MlMap, Marker as MlMarker, MapMouseEvent } from 'maplibre-gl'
import { BRAND } from '@/lib/brand'
import { GEORGIA_MAX_BOUNDS, MAP_MIN_ZOOM } from '@/lib/map/buildings'
import { loadMapBasemap, mapStyleUrl, applyBrandPaints, bindMissingImages } from '@/lib/map/floorLayers'
import { parseCoords } from '@/lib/map/geocode'
import { mapChromeOptions, tightenAttribution } from '@/lib/map/mapChrome'
import { pickHighlightPolygon, snapPick } from '@/lib/map/pick-building'

interface MapEmbedProps {
  lat: number
  lng: number
  zoom?: number
  mode?: 'place' | 'view' | 'search'
  q?: string
  className?: string
  aspect?: '4/3' | '16/9' | '1/1'
  interactive?: boolean
  onPick?: (lat: number, lng: number) => void
  highlight?: boolean
}

const ASPECTS = { '4/3': 'aspect-[4/3]', '16/9': 'aspect-video', '1/1': 'aspect-square' }
const PICK_SRC = 'sivrce-pick-bldg'
const PICK_FILL = 'sivrce-pick-fill'
const PICK_LINE = 'sivrce-pick-line'
const OSM_BLDG_LAYERS = ['building', 'building-3d'] as const

type MaplibreNS = typeof import('maplibre-gl')
type Status = 'idle' | 'loading' | 'ready' | 'error'

function resolveMaplibre(mlMod: MaplibreNS | { default: MaplibreNS }): MaplibreNS {
  if (
    'default' in mlMod &&
    mlMod.default &&
    typeof (mlMod.default as MaplibreNS).Map === 'function'
  ) {
    return mlMod.default as MaplibreNS
  }
  return mlMod as MaplibreNS
}

function makePin(hue: string) {
  const pin = document.createElement('div')
  pin.setAttribute('aria-hidden', 'true')
  pin.style.cssText =
    `width:18px;height:18px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);` +
    `background:${hue};border:2px solid #fff;` +
    `box-shadow:0 2px 8px rgba(5,11,38,0.35)`
  return pin
}

function osmLayersOn(map: MlMap): string[] {
  return OSM_BLDG_LAYERS.filter((id) => map.getLayer(id))
}

function queryBuildingAt(map: MlMap, point: { x: number; y: number }): GeoJSON.Geometry | null {
  const layers = osmLayersOn(map)
  if (!layers.length) return null
  const hits = map.queryRenderedFeatures([point.x, point.y], { layers })
  return hits[0]?.geometry ?? null
}

function ensurePickLayers(map: MlMap, hue: string) {
  if (!map.getSource(PICK_SRC)) {
    map.addSource(PICK_SRC, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    })
  }
  if (!map.getLayer(PICK_FILL)) {
    map.addLayer({
      id: PICK_FILL,
      type: 'fill',
      source: PICK_SRC,
      paint: { 'fill-color': hue, 'fill-opacity': 0.32 },
    })
  }
  if (!map.getLayer(PICK_LINE)) {
    map.addLayer({
      id: PICK_LINE,
      type: 'line',
      source: PICK_SRC,
      paint: {
        'line-color': hue,
        'line-width': 2.5,
        'line-opacity': 0.95,
      },
    })
  }
}

function paintPick(map: MlMap, lat: number, lng: number, hue: string) {
  ensurePickLayers(map, hue)
  const pt = map.project([lng, lat])
  const osm = queryBuildingAt(map, pt)
  const feature = pickHighlightPolygon(lat, lng, osm)
  const src = map.getSource(PICK_SRC) as
    | { setData: (d: GeoJSON.FeatureCollection | GeoJSON.Feature) => void }
    | undefined
  src?.setData({ type: 'FeatureCollection', features: [feature] })
  try {
    map.setPaintProperty(PICK_FILL, 'fill-color', hue)
    map.setPaintProperty(PICK_LINE, 'line-color', hue)
  } catch {
    /* style swap mid-paint */
  }
}

export default function MapEmbed({
  lat,
  lng,
  zoom = 14,
  q,
  className = '',
  aspect = '4/3',
  interactive = true,
  onPick,
  highlight = false,
}: MapEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MlMap | null>(null)
  const markerRef = useRef<MlMarker | null>(null)
  const mlRef = useRef<MaplibreNS | null>(null)
  const styleKeyRef = useRef<string | null>(null)
  const onPickRef = useRef(onPick)
  onPickRef.current = onPick
  const highlightRef = useRef(highlight)
  highlightRef.current = highlight
  const pinHueRef = useRef<string>(BRAND.colors.blue)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const themeReady = resolvedTheme != null
  const pinHue = highlight ? BRAND.colors.orange : BRAND.colors.blue
  pinHueRef.current = pinHue
  const coordsOk = parseCoords(lat, lng) != null
  // ponytail: skip MapLibre until near viewport
  const [near, setNear] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el || !coordsOk) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setNear(true)
          io.disconnect()
        }
      },
      { rootMargin: '240px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [coordsOk])

  // Mount once (theme swaps via setStyle below — no remount flash).
  useEffect(() => {
    if (!containerRef.current || mapRef.current || !themeReady || !near || !coordsOk) return
    let cancelled = false
    let ro: ResizeObserver | null = null
    const container = containerRef.current
    const styleKey = mapStyleUrl(isDark)

    setStatus('loading')
    ;(async () => {
      try {
        const [mlMod, style] = await Promise.all([
          import('maplibre-gl'),
          loadMapBasemap(styleKey),
          import('maplibre-gl/dist/maplibre-gl.css'),
        ]).then(([ml, st]) => [ml, st] as const)
        if (cancelled || mapRef.current) return

        const maplibregl = resolveMaplibre(mlMod)
        mlRef.current = maplibregl
        styleKeyRef.current = styleKey

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

        const marker = new maplibregl.Marker({ element: makePin(pinHue), anchor: 'center' })
          .setLngLat([lng, lat])
          .addTo(map)
        if (q) {
          marker.setPopup(
            new maplibregl.Popup({ offset: 14, closeButton: false }).setText(q),
          )
        }
        markerRef.current = marker

        if (onPickRef.current) {
          map.getCanvas().style.cursor = 'crosshair'
          map.on('click', (e: MapMouseEvent) => {
            if (!onPickRef.current) return
            const osm = queryBuildingAt(map, e.point)
            const snapped = snapPick(
              { lat: e.lngLat.lat, lng: e.lngLat.lng },
              osm,
            )
            onPickRef.current(snapped.lat, snapped.lng)
          })
        }

        map.once('load', () => {
          bindMissingImages(map)
          applyBrandPaints(map, isDark ? 'dark' : 'light')
          tightenAttribution(map)
          map.resize()
          if (highlightRef.current) {
            paintPick(map, lat, lng, pinHueRef.current)
            // OSM buildings often land after first idle
            map.once('idle', () => {
              if (!cancelled && mapRef.current && highlightRef.current) {
                paintPick(mapRef.current, lat, lng, pinHueRef.current)
              }
            })
          }
          if (!cancelled) setStatus('ready')
        })
        ro = new ResizeObserver(() => map.resize())
        ro.observe(container)
      } catch (err) {
        console.error('[MapEmbed] load', err)
        if (!cancelled) setStatus('error')
      }
    })()

    return () => {
      cancelled = true
      ro?.disconnect()
      markerRef.current?.remove()
      markerRef.current = null
      mapRef.current?.remove()
      mapRef.current = null
      mlRef.current = null
      styleKeyRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once; theme via setStyle
  }, [themeReady, near, coordsOk, retry])

  // Theme → setStyle (camera + pin preserved).
  useEffect(() => {
    const map = mapRef.current
    if (!map || status !== 'ready') return
    const next = mapStyleUrl(isDark)
    if (styleKeyRef.current === next) return
    let cancelled = false
    ;(async () => {
      try {
        const style = await loadMapBasemap(next)
        if (cancelled || !mapRef.current) return
        styleKeyRef.current = next
        map.once('style.load', () => {
          applyBrandPaints(map, isDark ? 'dark' : 'light')
          tightenAttribution(map)
          if (highlightRef.current) {
            paintPick(map, lat, lng, pinHueRef.current)
          }
        })
        map.setStyle(style)
      } catch (err) {
        console.error('[MapEmbed] theme', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isDark, status])

  // Camera + pin + building highlight (not on every popup label tweak).
  useEffect(() => {
    const map = mapRef.current
    if (!map || !coordsOk || status !== 'ready') return
    map.flyTo({
      center: [lng, lat],
      zoom,
      duration: 700,
      essential: true,
    })
    markerRef.current?.setLngLat([lng, lat])
    if (highlight) {
      const onMove = () => paintPick(map, lat, lng, pinHue)
      map.once('moveend', onMove)
      paintPick(map, lat, lng, pinHue)
      return () => {
        map.off('moveend', onMove)
      }
    }
  }, [lat, lng, zoom, coordsOk, status, highlight, pinHue])

  useEffect(() => {
    const ml = mlRef.current
    if (!ml || !markerRef.current || !q) return
    markerRef.current.setPopup(
      new ml.Popup({ offset: 14, closeButton: false }).setText(q),
    )
  }, [q, status])

  useEffect(() => {
    const el = markerRef.current?.getElement()
    if (el) el.style.background = pinHue
  }, [pinHue])

  const onRetry = useCallback(() => {
    mapRef.current?.remove()
    mapRef.current = null
    markerRef.current = null
    mlRef.current = null
    styleKeyRef.current = null
    setStatus('idle')
    setRetry((n) => n + 1)
  }, [])

  return (
    <div
      className={`relative overflow-hidden rounded-card border border-sv-ink/6 bg-sv-cloud dark:bg-sv-navy ${ASPECTS[aspect]} ${className}`}
    >
      <div
        ref={containerRef}
        className="h-full w-full"
        role="img"
        aria-label={coordsOk ? (q ?? 'Sivrce map') : 'Map unavailable'}
      />
      {(status === 'idle' || status === 'loading') && coordsOk && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 animate-pulse bg-gradient-to-br from-sv-blue/10 via-sv-cloud to-sv-violet/10 dark:from-sv-navy dark:via-sv-navy-soft dark:to-sv-blue/20"
        />
      )}
      {status === 'error' && (
        <div className="absolute inset-0 grid place-items-center bg-sv-cloud/95 px-4 text-center dark:bg-sv-navy/95">
          <div>
            <p className="text-[13px] font-bold text-sv-ink/60 dark:text-white/60">
              რუკა ვერ ჩაიტვირთა
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 rounded-full bg-sv-blue px-4 py-2 text-[12px] font-extrabold text-white transition hover:bg-sv-blue-deep"
            >
              თავიდან ცდა
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
