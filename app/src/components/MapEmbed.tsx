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
import { GEORGIA_MAX_BOUNDS, MAP_MIN_ZOOM } from '@/lib/map/map-geo'
import { loadMapBasemap, overlayHybridLabels, mapStyleUrl, applyBrandPaints, bindMissingImages, STYLE_SATELLITE, type MapTerrain } from '@/lib/map/floorLayers'
import { parseCoords } from '@/lib/map/map-geo'
import { ringLabelPoint } from '@/lib/map/ring-label'
import { mapChromeOptions, tightenAttribution } from '@/lib/map/mapChrome'
import { mapBootCamera } from '@/lib/map/map-ui'
import { mapRuntimeOptions } from '@/lib/device-budget'
import { bindMaplibreWorker } from '@/lib/map/maplibre-worker'
import {
  closeRing,
  geometryRing,
  OSM_PICK_RADIUS_M,
  pickHighlightPolygon,
  pickNearestBuildingGeometry,
  snapPick,
} from '@/lib/map/pick-building'

export type MapEmbedPickMode = 'snap' | 'draw'

interface MapEmbedProps {
  lat: number
  lng: number
  zoom?: number
  mode?: 'place' | 'view' | 'search'
  /** snap = OSM building click; draw = vertex-by-vertex footprint */
  pickMode?: MapEmbedPickMode
  /** Controlled footprint ring (lng,lat). Open rings paint as a line. */
  footprint?: [number, number][] | null
  q?: string
  className?: string
  aspect?: '4/3' | '16/9' | '1/1'
  interactive?: boolean
  /** Third arg = OSM ring when snap hits a building, else null. */
  onPick?: (lat: number, lng: number, ring?: [number, number][] | null) => void
  highlight?: boolean
  /** streets = OFM; satellite = Esri hybrid (photo + roads + labels). */
  terrain?: MapTerrain
}

const ASPECTS = { '4/3': 'aspect-[4/3]', '16/9': 'aspect-video', '1/1': 'aspect-square' }
const PICK_SRC = 'sivrce-pick-bldg'
const PICK_FILL = 'sivrce-pick-fill'
const PICK_HALO = 'sivrce-pick-halo'
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

async function loadPinBasemap(styleKey: string) {
  let key = styleKey
  let style
  try {
    style = await loadMapBasemap(styleKey)
  } catch {
    key = STYLE_SATELLITE
    style = await loadMapBasemap(STYLE_SATELLITE)
  }
  return key === STYLE_SATELLITE ? overlayHybridLabels(style) : style
}

function makePin(hue: string) {
  const pin = document.createElement('div')
  pin.setAttribute('aria-hidden', 'true')
  pin.style.cssText =
    'width:32px;height:42px;pointer-events:none;filter:drop-shadow(0 4px 10px rgba(5,11,38,.34))'
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', '32')
  svg.setAttribute('height', '42')
  svg.setAttribute('viewBox', '0 0 28 36')
  svg.setAttribute('fill', 'none')
  const shell = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  shell.setAttribute(
    'd',
    'M14 1.2c6.8 0 12.3 5.4 12.3 12.5 0 8.6-10.4 18.6-12.3 21.6-1.9-3-12.3-13-12.3-21.6C1.7 6.6 7.2 1.2 14 1.2z',
  )
  shell.setAttribute('fill', '#fff')
  shell.setAttribute('stroke', hue)
  shell.setAttribute('stroke-width', '1.8')
  const core = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
  core.setAttribute('data-pin-core', '')
  core.setAttribute('cx', '14')
  core.setAttribute('cy', '13.4')
  core.setAttribute('r', '5.2')
  core.setAttribute('fill', hue)
  svg.append(shell, core)
  pin.append(svg)
  return pin
}

function tintPin(el: HTMLElement, hue: string) {
  const shell = el.querySelector('path')
  const core = el.querySelector('[data-pin-core]')
  if (shell) shell.setAttribute('stroke', hue)
  if (core) core.setAttribute('fill', hue)
}

function osmLayersOn(map: MlMap): string[] {
  return OSM_BLDG_LAYERS.filter((id) => map.getLayer(id))
}

/** ~m → screen px at current zoom (Web Mercator). */
function metersToPx(map: MlMap, meters: number, lat: number): number {
  const mpp =
    (156_543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** map.getZoom()
  return meters / Math.max(mpp, 0.05)
}

/** Point hit, else nearby buildings within OSM_PICK_RADIUS_M (curb/bus-stop pins). */
function queryBuildingNear(
  map: MlMap,
  lngLat: { lat: number; lng: number },
  point?: { x: number; y: number },
): GeoJSON.Geometry | null {
  const layers = osmLayersOn(map)
  if (!layers.length) return null
  const pt = point ?? map.project([lngLat.lng, lngLat.lat])
  const atPoint = map.queryRenderedFeatures([pt.x, pt.y], { layers })
  const direct = pickNearestBuildingGeometry(
    atPoint.map((f) => f.geometry),
    lngLat.lat,
    lngLat.lng,
  )
  if (direct) return direct
  const r = Math.min(96, Math.max(16, metersToPx(map, OSM_PICK_RADIUS_M, lngLat.lat)))
  const nearby = map.queryRenderedFeatures(
    [
      [pt.x - r, pt.y - r],
      [pt.x + r, pt.y + r],
    ],
    { layers },
  )
  return pickNearestBuildingGeometry(
    nearby.map((f) => f.geometry),
    lngLat.lat,
    lngLat.lng,
  )
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
      paint: { 'fill-color': hue, 'fill-opacity': 0.26 },
    })
  }
  if (!map.getLayer(PICK_HALO)) {
    map.addLayer(
      {
        id: PICK_HALO,
        type: 'line',
        source: PICK_SRC,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#fff',
          'line-width': 5,
          'line-opacity': 0.7,
        },
      },
      map.getLayer(PICK_LINE) ? PICK_LINE : undefined,
    )
  }
  if (!map.getLayer(PICK_LINE)) {
    map.addLayer({
      id: PICK_LINE,
      type: 'line',
      source: PICK_SRC,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': hue,
        'line-width': 2,
        'line-opacity': 0.95,
      },
    })
  }
}

function paintFeature(map: MlMap, feature: GeoJSON.Feature, hue: string) {
  // Watchdog/flyTo can reach us before the style parses — addLayer/setPaintProperty
  // would throw and spam errors; the boot-idle/moveend repaints cover us later.
  if (!map.isStyleLoaded()) return
  ensurePickLayers(map, hue)
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

function paintPick(
  map: MlMap,
  lat: number,
  lng: number,
  hue: string,
  marker?: MlMarker | null,
) {
  const osm = queryBuildingNear(map, { lat, lng })
  paintFeature(map, pickHighlightPolygon(lat, lng, osm), hue)
  // Pin glued to the exact building being highlighted — pin & ring never disagree.
  const ring = geometryRing(osm)
  if (ring && marker) {
    const p = ringLabelPoint(ring)
    marker.setLngLat([p.lng, p.lat])
  }
}

/** Controlled footprint — closed polygon or open draw polyline. */
function paintFootprint(
  map: MlMap,
  ring: [number, number][],
  lat: number,
  lng: number,
  hue: string,
) {
  if (ring.length === 0) {
    paintPick(map, lat, lng, hue)
    return
  }
  const closed = closeRing(ring)
  const isPoly =
    ring.length >= 4 &&
    closed[0]![0] === closed[closed.length - 1]![0] &&
    closed[0]![1] === closed[closed.length - 1]![1]
  if (isPoly) {
    paintFeature(
      map,
      {
        type: 'Feature',
        properties: {},
        geometry: { type: 'Polygon', coordinates: [closed] },
      },
      hue,
    )
    return
  }
  paintFeature(
    map,
    {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: ring },
    },
    hue,
  )
}

export default function MapEmbed({
  lat,
  lng,
  zoom = 14,
  pickMode = 'snap',
  footprint = null,
  q,
  className = '',
  aspect = '4/3',
  interactive = true,
  onPick,
  highlight = false,
  terrain = 'streets',
}: MapEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MlMap | null>(null)
  const markerRef = useRef<MlMarker | null>(null)
  const mlRef = useRef<MaplibreNS | null>(null)
  const styleKeyRef = useRef<string | null>(null)
  const onPickRef = useRef(onPick)
  const highlightRef = useRef(highlight)
  const pickModeRef = useRef(pickMode)
  const footprintRef = useRef(footprint)
  const pinHueRef = useRef<string>(BRAND.colors.blue)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const themeReady = resolvedTheme != null
  const pinHue = highlight ? BRAND.colors.orange : BRAND.colors.blue

  // Latest-values mirror for map callbacks — refs must not be written in render.
  useEffect(() => {
    onPickRef.current = onPick
    highlightRef.current = highlight
    pickModeRef.current = pickMode
    footprintRef.current = footprint
    pinHueRef.current = pinHue
  })
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
    let watchdog: number | undefined
    const container = containerRef.current
    const styleKey = mapStyleUrl(isDark, terrain)

    setStatus('loading')
    ;(async () => {
      try {
        const [mlMod, style] = await Promise.all([
          import('maplibre-gl'),
          loadPinBasemap(styleKey),
          import('maplibre-gl/dist/maplibre-gl.css'),
        ]).then(([ml, st]) => [ml, st] as const)
        if (cancelled || mapRef.current) return

        const maplibregl = resolveMaplibre(mlMod)
        mlRef.current = maplibregl
        styleKeyRef.current = styleKey

        bindMaplibreWorker(maplibregl)
        const map = new maplibregl.Map({
          container,
          style,
          center: [lng, lat],
          zoom,
          ...mapBootCamera(interactive),
          maxPitch: 60,
          minZoom: MAP_MIN_ZOOM,
          maxBounds: GEORGIA_MAX_BOUNDS,
          renderWorldCopies: false,
          fadeDuration: 0,
          interactive,
          scrollZoom: interactive,
          ...mapRuntimeOptions(),
          ...mapChromeOptions(),
        })
        mapRef.current = map

        const marker = new maplibregl.Marker({ element: makePin(pinHue), anchor: 'bottom' })
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
            if (pickModeRef.current === 'draw') {
              onPickRef.current(e.lngLat.lat, e.lngLat.lng, null)
              return
            }
            const osm = queryBuildingNear(
              map,
              { lat: e.lngLat.lat, lng: e.lngLat.lng },
              e.point,
            )
            const ring = geometryRing(osm)
            const snapped = snapPick(
              { lat: e.lngLat.lat, lng: e.lngLat.lng },
              osm,
            )
            onPickRef.current(snapped.lat, snapped.lng, ring)
          })
        }

        const paintHighlight = () => {
          if (!highlightRef.current) return
          const fp = footprintRef.current
          if (fp && fp.length > 0) {
            paintFootprint(map, fp, lat, lng, pinHueRef.current)
          } else {
            paintPick(map, lat, lng, pinHueRef.current, markerRef.current)
          }
        }

        let booted = false
        const boot = () => {
          if (cancelled || booted) return
          booted = true
          if (watchdog) clearTimeout(watchdog)
          bindMissingImages(map)
          applyBrandPaints(map, isDark ? 'dark' : 'light', terrain)
          tightenAttribution(map)
          map.resize()
          setStatus('ready')
          // Watchdog can fire before the style parses — painting then throws
          // ("Style is not done loading") and wedges the embed; idle repaint covers it.
          if (map.isStyleLoaded()) paintHighlight()
          map.once('idle', () => {
            if (!cancelled && mapRef.current && highlightRef.current) {
              paintHighlight()
            }
          })
        }
        map.once('load', boot)
        if (map.loaded()) boot()
        watchdog = window.setTimeout(boot, 1600)
        ro = new ResizeObserver(() => map.resize())
        ro.observe(container)
      } catch (err) {
        console.error('[MapEmbed] load', err)
        if (!cancelled) setStatus('error')
      }
    })()

    return () => {
      cancelled = true
      if (watchdog) clearTimeout(watchdog)
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
    const next = mapStyleUrl(isDark, terrain)
    if (styleKeyRef.current === next) return
    let cancelled = false
    ;(async () => {
      try {
        const style = await loadPinBasemap(next)
        if (cancelled || !mapRef.current) return
        styleKeyRef.current = next
        map.once('style.load', () => {
          applyBrandPaints(map, isDark ? 'dark' : 'light', terrain)
          tightenAttribution(map)
          if (highlightRef.current) {
            const fp = footprintRef.current
            if (fp && fp.length > 0) {
              paintFootprint(map, fp, lat, lng, pinHueRef.current)
            } else {
              paintPick(map, lat, lng, pinHueRef.current, markerRef.current)
            }
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
  }, [isDark, status, lat, lng, terrain])

  // Camera + pin (footprint paint is separate — draw mode must not fly every vertex).
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
  }, [lat, lng, zoom, coordsOk, status])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !coordsOk || status !== 'ready' || !highlight) return
    const paint = () => {
      if (footprint && footprint.length > 0) {
        paintFootprint(map, footprint, lat, lng, pinHue)
      } else {
        paintPick(map, lat, lng, pinHue, markerRef.current)
      }
    }
    const onMove = () => paint()
    map.once('moveend', onMove)
    paint()
    return () => {
      map.off('moveend', onMove)
    }
  }, [lat, lng, coordsOk, status, highlight, pinHue, footprint])

  useEffect(() => {
    const ml = mlRef.current
    if (!ml || !markerRef.current || !q) return
    markerRef.current.setPopup(
      new ml.Popup({ offset: 14, closeButton: false }).setText(q),
    )
  }, [q, status])

  useEffect(() => {
    const el = markerRef.current?.getElement()
    if (el) tintPin(el, pinHue)
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
      className={`relative overflow-hidden rounded-card border border-sv-ink/6 bg-sv-cloud shadow-card dark:bg-sv-navy ${ASPECTS[aspect]} ${className}`}
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
