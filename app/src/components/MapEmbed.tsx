'use client'

/**
 * SIVRCE — MapLibre pin embed (first-party tiles via /api/map).
 * Lazy MapLibre + theme setStyle + load/error/retry. Georgia coords only.
 * highlight: orange pin + OSM building ring (or square fallback).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { Pause, Play, Sun } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import type { Map as MlMap, Marker as MlMarker, MapMouseEvent, SkySpecification } from 'maplibre-gl'
import { BRAND } from '@/lib/brand'
import { GEORGIA_MAX_BOUNDS, MAP_MIN_ZOOM } from '@/lib/map/map-geo'
import { loadMapBasemap, overlayHybridLabels, mapStyleUrl, applyBrandPaints, bindMissingImages, setBasemapBuildings3d, STYLE_SATELLITE, type MapTerrain } from '@/lib/map/floorLayers'
import { parseCoords } from '@/lib/map/map-geo'
import { ringLabelPoint } from '@/lib/map/ring-label'
import { mapChromeOptions, tightenAttribution } from '@/lib/map/mapChrome'
import { mapBootCamera } from '@/lib/map/map-ui'
import { mapRuntimeOptions } from '@/lib/device-budget'
import { bindMaplibreWorker } from '@/lib/map/maplibre-worker'
import { formatSunTime, sunPosition, tbilisiInstant, tbilisiMinutesOfDay } from '@/lib/sun'
import {
  shadowPolygon,
  sunLight,
  sunSky,
  MAP_DEFAULT_LIGHT,
  MIN_ALTITUDE,
  NOMINAL_HEIGHT_M,
  type LngLatRing,
} from '@/lib/map/sun-shadow'
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
const SUN_SRC = 'sivrce-sun-shadow'
const SUN_FILL = 'sivrce-sun-shadow-fill'
/** Slider window covers every Georgian sunrise/sunset (≈05:27–20:40 extreme). */
const SUN_MIN_MINUTES = 300
const SUN_MAX_MINUTES = 1320
/** Playback speed, minutes-of-day per second — full window in ~8.5s. */
const SUN_PLAY_RATE = 120
const EMPTY_FC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }

/** Ring + tile height of the highlighted building — sun scrubber geometry. */
type SunSource = { ring: LngLatRing; heightM: number }

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
): { geometry: GeoJSON.Geometry | null; heightM: number | null } {
  const layers = osmLayersOn(map)
  if (!layers.length) return { geometry: null, heightM: null }
  const pt = point ?? map.project([lngLat.lng, lngLat.lat])
  const atPoint = map.queryRenderedFeatures([pt.x, pt.y], { layers })
  const direct = pickNearestBuildingGeometry(atPoint.map((f) => f.geometry), lngLat.lat, lngLat.lng)
  if (direct) {
    return {
      geometry: direct,
      heightM: tileHeight(atPoint.find((f) => f.geometry === direct)),
    }
  }
  const r = Math.min(96, Math.max(16, metersToPx(map, OSM_PICK_RADIUS_M, lngLat.lat)))
  const nearby = map.queryRenderedFeatures(
    [
      [pt.x - r, pt.y - r],
      [pt.x + r, pt.y + r],
    ],
    { layers },
  )
  const near = pickNearestBuildingGeometry(nearby.map((f) => f.geometry), lngLat.lat, lngLat.lng)
  return { geometry: near, heightM: near ? tileHeight(nearby.find((f) => f.geometry === near)) : null }
}

/** render_height from the style's 3D building source; null when the tile omits it. */
function tileHeight(feature: { properties?: Record<string, unknown> } | undefined): number | null {
  const h = Number(feature?.properties?.render_height)
  return Number.isFinite(h) && h > 0 ? h : null
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

/** Shadow fill sits under the highlight ring; both under nothing else custom. */
function ensureSunLayers(map: MlMap) {
  if (!map.getSource(SUN_SRC)) {
    map.addSource(SUN_SRC, { type: 'geojson', data: EMPTY_FC })
  }
  if (!map.getLayer(SUN_FILL)) {
    map.addLayer(
      {
        id: SUN_FILL,
        type: 'fill',
        source: SUN_SRC,
        paint: { 'fill-color': '#0b1233', 'fill-opacity': 0.3 },
      },
      map.getLayer(PICK_FILL) ? PICK_FILL : undefined,
    )
  }
}

/**
 * Sun scrubber repaint — exact shadow polygon + fill-extrusion light + sky,
 * all driven by the same solar position. `on=false` restores style defaults.
 * ponytail: light/sky are style-property writes (GPU uniforms) — cheap enough
 * to re-apply on every slider tick, no animation loop needed.
 */
function paintSun(
  map: MlMap,
  on: boolean,
  src: SunSource | null,
  at: Date,
  lat: number,
  lng: number,
) {
  if (!map.isStyleLoaded()) return
  ensureSunLayers(map)
  const source = map.getSource(SUN_SRC) as
    | { setData: (d: GeoJSON.FeatureCollection | GeoJSON.Feature) => void }
    | undefined
  if (!source) return
  const { altitude, azimuth } = sunPosition(lat, lng, at)
  const polygon = on && src ? shadowPolygon(src.ring, src.heightM, azimuth, altitude) : null
  source.setData(
    polygon
      ? { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [polygon] } }
      : EMPTY_FC,
  )
  try {
    if (on) {
      map.setLight(sunLight(altitude, azimuth))
      map.setSky(sunSky(altitude))
    } else {
      map.setLight(MAP_DEFAULT_LIGHT)
      // Runtime clears the sun sky on undefined (branch `!skyOptions && sky`);
      // the Map-class overload just types the arg as required.
      map.setSky(undefined as unknown as SkySpecification)
    }
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
): SunSource | null {
  const { geometry, heightM } = queryBuildingNear(map, { lat, lng })
  paintFeature(map, pickHighlightPolygon(lat, lng, geometry), hue)
  // Pin glued to the exact building being highlighted — pin & ring never disagree.
  const ring = geometryRing(geometry)
  if (ring && marker) {
    const p = ringLabelPoint(ring)
    marker.setLngLat([p.lng, p.lat])
  }
  return ring ? { ring, heightM: heightM ?? NOMINAL_HEIGHT_M } : null
}

/** Controlled footprint — closed polygon or open draw polyline. */
function paintFootprint(
  map: MlMap,
  ring: [number, number][],
  lat: number,
  lng: number,
  hue: string,
): SunSource | null {
  if (ring.length === 0) {
    return paintPick(map, lat, lng, hue)
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
    // Saved footprints have no tile property — ask the OSM building at the pin.
    const heightM = queryBuildingNear(map, { lat, lng }).heightM
    return { ring: closed, heightM: heightM ?? NOMINAL_HEIGHT_M }
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
  return null
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
  const { t, lang } = useI18n()
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

  // Sun scrubber — geometry captured by the highlight paint, time picked here.
  // ponytail: slider pinned to Tbilisi wall time, matching the SunPath card;
  // "today" frozen at first paint like SunPath (a reopened map re-freezes).
  // ref feeds map-internal repaints, state feeds render — both set together.
  const sunRingRef = useRef<SunSource | null>(null)
  const [sunSrc, setSunSrc] = useState<SunSource | null>(null)
  const captureSun = useCallback((src: SunSource | null) => {
    sunRingRef.current = src
    setSunSrc(src)
  }, [])
  const [sunOn, setSunOn] = useState(false)
  const [sunMin, setSunMin] = useState(() =>
    Math.min(SUN_MAX_MINUTES, Math.max(SUN_MIN_MINUTES, tbilisiMinutesOfDay())),
  )
  // Day playback — rAF pauses itself on hidden tabs; reduced-motion users scrub by hand.
  const [sunPlaying, setSunPlaying] = useState(false)
  const [reducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    if (!sunPlaying) return
    // ponytail: effect re-runs per frame via [sunMin] — the rAF handle it
    // schedules is cancelled by its own cleanup, so ticks never double.
    let cur = sunMin
    let last = performance.now()
    let raf = 0
    const tick = (now: number) => {
      cur += ((now - last) * SUN_PLAY_RATE) / 1000
      last = now
      if (cur >= SUN_MAX_MINUTES) {
        setSunMin(SUN_MAX_MINUTES)
        setSunPlaying(false)
        return
      }
      setSunMin(cur)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [sunPlaying, sunMin])
  const sunOnRef = useRef(sunOn)
  const sunMinRef = useRef(sunMin)
  const sunDateRef = useRef<Date>(tbilisiInstant(sunMin))
  const sunDate = useMemo(() => tbilisiInstant(sunMin), [sunMin])
  const sunUp = useMemo(
    () => sunSrc != null && sunPosition(lat, lng, sunDate).altitude >= MIN_ALTITUDE,
    [sunSrc, lat, lng, sunDate],
  )

  // Latest-values mirror for map callbacks — refs must not be written in render.
  useEffect(() => {
    onPickRef.current = onPick
    highlightRef.current = highlight
    pickModeRef.current = pickMode
    footprintRef.current = footprint
    pinHueRef.current = pinHue
    sunOnRef.current = sunOn
    sunMinRef.current = sunMin
    sunDateRef.current = tbilisiInstant(sunMin)
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
          ...mapBootCamera(interactive),
          zoom,
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

        const pin = makePin(pinHue)
        const marker = new maplibregl.Marker({ element: pin, anchor: 'bottom' })
          .setLngLat([lng, lat])
          .addTo(map)
        // maplibre force-adds tabindex=0 — a focusable element inside aria-hidden
        pin.setAttribute('tabindex', '-1')
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
            const { geometry } = queryBuildingNear(
              map,
              { lat: e.lngLat.lat, lng: e.lngLat.lng },
              e.point,
            )
            const ring = geometryRing(geometry)
            const snapped = snapPick(
              { lat: e.lngLat.lat, lng: e.lngLat.lng },
              geometry,
            )
            onPickRef.current(snapped.lat, snapped.lng, ring)
          })
        }

        const paintHighlight = () => {
          if (!highlightRef.current) return
          const fp = footprintRef.current
          const src =
            fp && fp.length > 0
              ? paintFootprint(map, fp, lat, lng, pinHueRef.current)
              : paintPick(map, lat, lng, pinHueRef.current, markerRef.current)
          captureSun(src)
          if (sunOnRef.current) paintSun(map, true, src, sunDateRef.current, lat, lng)
        }

        let booted = false
        const boot = () => {
          if (cancelled || booted) return
          booted = true
          if (watchdog) clearTimeout(watchdog)
          bindMissingImages(map)
          applyBrandPaints(map, isDark ? 'dark' : 'light', terrain)
          setBasemapBuildings3d(map, interactive)
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
          setBasemapBuildings3d(map, interactive)
          tightenAttribution(map)
          if (highlightRef.current) {
            const fp = footprintRef.current
            if (fp && fp.length > 0) {
              paintFootprint(map, fp, lat, lng, pinHueRef.current)
            } else {
              paintPick(map, lat, lng, pinHueRef.current, markerRef.current)
            }
            // setStyle wiped the custom layers — repaint the open shadow too.
            if (sunOnRef.current) {
              paintSun(map, true, sunRingRef.current, sunDateRef.current, lat, lng)
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
  }, [isDark, status, lat, lng, terrain, interactive])

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
      const src =
        footprint && footprint.length > 0
          ? paintFootprint(map, footprint, lat, lng, pinHue)
          : paintPick(map, lat, lng, pinHue, markerRef.current)
      captureSun(src)
    }
    const onMove = () => paint()
    map.once('moveend', onMove)
    paint()
    return () => {
      map.off('moveend', onMove)
    }
  }, [lat, lng, coordsOk, status, highlight, pinHue, footprint, captureSun])

  // Slider/toggle changes → recast shadow + sun light (or restore defaults when off).
  useEffect(() => {
    const map = mapRef.current
    if (!map || !coordsOk || status !== 'ready' || !highlight) return
    paintSun(map, sunOn, sunSrc, sunDate, lat, lng)
  }, [sunOn, sunDate, sunSrc, lat, lng, coordsOk, status, highlight])

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
    captureSun(null)
    setStatus('idle')
    setRetry((n) => n + 1)
  }, [captureSun])

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
              {t('map.error')}
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 rounded-full bg-sv-blue px-4 py-2 text-[12px] font-extrabold text-white transition hover:bg-sv-blue-deep"
            >
              {t('error.retry')}
            </button>
          </div>
        </div>
      )}
      {highlight && interactive && !onPick && sunSrc && status === 'ready' && (
        <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-2">
          <button
            type="button"
            aria-label={t('map.sun')}
            aria-pressed={sunOn}
            title={t('map.sun')}
            onClick={() => {
              setSunPlaying(false)
              setSunOn((v) => !v)
            }}
            className={`grid h-9 w-9 place-items-center rounded-full border shadow-card backdrop-blur transition ${
              sunOn
                ? 'border-transparent bg-sv-orange text-white'
                : 'border-sv-ink/10 bg-white/95 text-sv-ink hover:bg-white dark:border-white/10 dark:bg-sv-navy/90 dark:text-white'
            }`}
          >
            <Sun className="h-[18px] w-[18px]" aria-hidden strokeWidth={2.2} />
          </button>
          {sunOn && (
            <div className="w-44 rounded-module border border-sv-ink/10 bg-white/95 p-3 shadow-card backdrop-blur dark:border-white/10 dark:bg-sv-navy/90">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-black tabular-nums tracking-tight text-sv-ink dark:text-white">
                  {formatSunTime(sunDate, lang)}
                </span>
                <div className="flex items-center gap-0.5">
                  {!reducedMotion && (
                    <button
                      type="button"
                      aria-label={t('map.sunPlay')}
                      aria-pressed={sunPlaying}
                      title={t('map.sunPlay')}
                      onClick={() => {
                        if (!sunPlaying && sunMin >= SUN_MAX_MINUTES) setSunMin(SUN_MIN_MINUTES)
                        setSunPlaying((v) => !v)
                      }}
                      className="grid h-6 w-6 place-items-center rounded-full text-sv-ink/60 transition hover:bg-sv-ink/5 hover:text-sv-ink dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      {sunPlaying ? (
                        <Pause className="h-3.5 w-3.5" aria-hidden strokeWidth={2.4} />
                      ) : (
                        <Play className="h-3.5 w-3.5" aria-hidden strokeWidth={2.4} />
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSunPlaying(false)
                      setSunMin(Math.min(SUN_MAX_MINUTES, Math.max(SUN_MIN_MINUTES, tbilisiMinutesOfDay())))
                    }}
                    className="rounded-full px-2 py-0.5 text-[11px] font-extrabold text-sv-ink/60 transition hover:bg-sv-ink/5 hover:text-sv-ink dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    {t('map.sunNow')}
                  </button>
                </div>
              </div>
              <input
                type="range"
                min={SUN_MIN_MINUTES}
                max={SUN_MAX_MINUTES}
                step={10}
                value={sunMin}
                onChange={(e) => {
                  setSunPlaying(false)
                  setSunMin(Number(e.target.value))
                }}
                aria-label={t('map.sun')}
                aria-valuetext={formatSunTime(sunDate, lang)}
                className="mt-2 w-full accent-sv-orange"
              />
              <p className="mt-1 text-[10px] font-bold leading-tight text-sv-ink/60 dark:text-white/60">
                {sunUp ? t('map.sunNote') : t('map.sunDown')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
