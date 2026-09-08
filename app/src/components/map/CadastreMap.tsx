'use client'

/**
 * CadastreMap — lean MapLibre view for NAPR parcel rings.
 * Serves the public /cadastre explorer and /account/cadastre.
 * Same boot discipline as Map3D: same-origin tile proxy, worker bind,
 * device-budget runtime, brand paints. 2D only — cadastral work is planar.
 */

import { useEffect, useRef, useState } from 'react'
import { MapIcon, Minus, Plus, Satellite } from 'lucide-react'
import * as maplibregl from 'maplibre-gl'
import type { GeoJSONSource, MapMouseEvent, Map as MlMap } from 'maplibre-gl'
import { useI18n } from '@/lib/i18n/context'
import { useTheme } from 'next-themes'
import { BRAND } from '@/lib/brand'
import { GEORGIA_MAX_BOUNDS, MAP_CENTER, MAP_MIN_ZOOM } from '@/lib/map/map-geo'
import { mapRuntimeOptions } from '@/lib/device-budget'
import {
  applyBrandPaints,
  bindMissingImages,
  loadMapBasemap,
  mapStyleUrl,
} from '@/lib/map/floorLayers'
import { mapChromeOptions, tightenAttribution } from '@/lib/map/mapChrome'
import { bindMaplibreWorker } from '@/lib/map/maplibre-worker'
import { ringCentroid } from '@/lib/map/pick-building'
import { parcelsFC, type CadastreParcel } from '@/lib/map/cadastre'

const SRC = 'cadastre-parcels'
const SRC_LABELS = 'cadastre-parcels-centroids'
const FILL = 'cadastre-fill'
const LINE = 'cadastre-line'
const LABELS = 'cadastre-labels'

export type CadastreFocus = {
  code: string
  ring?: [number, number][]
  lat: number
  lng: number
} | null

type Props = {
  parcels: CadastreParcel[]
  selectedCode?: string | null
  focus?: CadastreFocus
  /** Tapped bare map — reverse parcel lookup. */
  onPick?: (lat: number, lng: number) => void
  /** Tapped a drawn parcel. */
  onSelectParcel?: (code: string) => void
}

function centroidPoints(parcels: CadastreParcel[]) {
  return {
    type: 'FeatureCollection' as const,
    features: parcels
      .filter((p) => p.ring.length >= 3)
      .map((p) => {
        const c = ringCentroid(p.ring)
        return {
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [c.lng, c.lat] },
          properties: { code: p.code },
        }
      }),
  }
}

function pushData(map: MlMap, parcels: CadastreParcel[], selectedCode?: string | null) {
  const src = map.getSource(SRC) as GeoJSONSource | undefined
  const labels = map.getSource(SRC_LABELS) as GeoJSONSource | undefined
  if (src) src.setData(parcelsFC(parcels, selectedCode))
  if (labels) labels.setData(centroidPoints(parcels))
}

function mountParcels(map: MlMap) {
  if (map.getSource(SRC)) return
  map.addSource(SRC, { type: 'geojson', data: parcelsFC([]) })
  map.addSource(SRC_LABELS, { type: 'geojson', data: centroidPoints([]) })
  map.addLayer({
    id: FILL,
    type: 'fill',
    source: SRC,
    paint: {
      'fill-color': [
        'match',
        ['get', 'status'],
        'active',
        BRAND.colors.success,
        'pending',
        BRAND.colors.orange,
        BRAND.colors.ink,
      ],
      'fill-opacity': ['case', ['get', 'selected'], 0.3, 0.16],
    },
  })
  map.addLayer({
    id: LINE,
    type: 'line',
    source: SRC,
    paint: {
      'line-color': [
        'match',
        ['get', 'status'],
        'active',
        BRAND.colors.success,
        'pending',
        BRAND.colors.orange,
        BRAND.colors.blue,
      ],
      'line-width': ['case', ['get', 'selected'], 3.2, 1.8],
      'line-opacity': ['case', ['get', 'selected'], 1, 0.8],
    },
  })
  map.addLayer({
    id: LABELS,
    type: 'symbol',
    source: SRC_LABELS,
    minzoom: 13,
    layout: {
      'text-field': ['get', 'code'],
      'text-size': 10,
      'text-font': ['Noto Sans Regular'],
      'text-letter-spacing': 0.08,
      'text-allow-overlap': true,
    },
    paint: {
      'text-color': BRAND.colors.paper,
      'text-halo-color': BRAND.colors.navy,
      'text-halo-width': 1.4,
    },
  })
}

export default function CadastreMap({
  parcels,
  selectedCode,
  focus,
  onPick,
  onSelectParcel,
}: Props) {
  const { t } = useI18n()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const themeReady = resolvedTheme != null

  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MlMap | null>(null)
  const [terrain, setTerrain] = useState<'streets' | 'satellite'>('streets')
  const [booted, setBooted] = useState(false)
  // Latest props for map event closures — synced post-render (refs: no render writes).
  const latest = useRef({ parcels, selectedCode, isDark, terrain, onPick, onSelectParcel })
  useEffect(() => {
    latest.current = { parcels, selectedCode, isDark, terrain, onPick, onSelectParcel }
  })

  // Boot once — locale/theme land before mount because themeReady gates.
  useEffect(() => {
    if (!containerRef.current || mapRef.current || !themeReady) return
    let cancelled = false
    const dark = latest.current.isDark

    ;(async () => {
      let style
      try {
        style = await loadMapBasemap(mapStyleUrl(dark, 'streets'))
      } catch (err) {
        console.error('[CadastreMap] style', err)
        return
      }
      if (cancelled || mapRef.current) return

      bindMaplibreWorker(maplibregl)
      const map = new maplibregl.Map({
        container: containerRef.current!,
        style,
        center: [MAP_CENTER.lng, MAP_CENTER.lat],
        zoom: 11,
        minZoom: MAP_MIN_ZOOM,
        maxBounds: GEORGIA_MAX_BOUNDS,
        renderWorldCopies: false,
        fadeDuration: 0,
        ...mapRuntimeOptions(),
        ...mapChromeOptions(),
      })
      mapRef.current = map
      bindMissingImages(map)

      const remount = () => {
        mountParcels(map)
        pushData(map, latest.current.parcels, latest.current.selectedCode)
        applyBrandPaints(map, latest.current.isDark ? 'dark' : 'light', latest.current.terrain)
        tightenAttribution(map)
      }
      map.on('load', () => {
        remount()
        setBooted(true)
      })

      map.on('click', (e: MapMouseEvent) => {
        const hits = map.queryRenderedFeatures(e.point, {
          layers: [FILL].filter((id) => map.getLayer(id)),
        })
        const code = hits[0]?.properties?.code
        if (typeof code === 'string' && code) {
          latest.current.onSelectParcel?.(code)
          return
        }
        latest.current.onPick?.(e.lngLat.lat, e.lngLat.lng)
      })
      map.on('mouseenter', FILL, () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', FILL, () => {
        map.getCanvas().style.cursor = ''
      })
    })()

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [themeReady])

  // Theme flips repaint in place — paints only, no style reload.
  useEffect(() => {
    const map = mapRef.current
    if (map && booted) applyBrandPaints(map, isDark ? 'dark' : 'light', latest.current.terrain)
  }, [isDark, booted])

  // Data pushes post-boot (pre-boot ones replay in remount on 'load').
  useEffect(() => {
    if (mapRef.current && booted) pushData(mapRef.current, parcels, selectedCode)
  }, [parcels, selectedCode, booted])

  // Camera follows the focused parcel.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !booted || !focus) return
    if (focus.ring && focus.ring.length >= 3) {
      const bounds = new maplibregl.LngLatBounds(focus.ring[0], focus.ring[0])
      for (const p of focus.ring) bounds.extend(p)
      map.fitBounds(bounds, { padding: 90, maxZoom: 17.5, duration: 800, essential: true })
    } else {
      map.easeTo({
        center: [focus.lng, focus.lat],
        zoom: Math.max(map.getZoom(), 16),
        duration: 800,
        essential: true,
      })
    }
  }, [focus, booted])

  const pickTerrain = async (next: 'streets' | 'satellite') => {
    const map = mapRef.current
    if (!map || next === terrain) return
    setTerrain(next)
    try {
      const style = await loadMapBasemap(mapStyleUrl(latest.current.isDark, next))
      // Attach before setStyle — style.load can fire synchronously on inline styles.
      map.once('style.load', () => {
        mountParcels(map)
        pushData(map, latest.current.parcels, latest.current.selectedCode)
        applyBrandPaints(map, latest.current.isDark ? 'dark' : 'light', next)
        tightenAttribution(map)
      })
      map.setStyle(style)
    } catch {
      setTerrain(terrain)
    }
  }

  // Glass chrome — same recipe as Map3D's control rail.
  const hair = isDark ? 'border-white/10' : 'border-sv-ink/[0.06]'
  const chip = isDark
    ? 'border-white/10 bg-sv-navy/90 text-white shadow-soft backdrop-blur-xl'
    : 'border-sv-ink/[0.06] bg-sv-surface/92 text-sv-ink shadow-soft backdrop-blur-xl'
  const railHover = isDark
    ? 'hover:bg-white/10 active:bg-white/15'
    : 'hover:bg-sv-ink/[0.04] active:bg-sv-ink/[0.07]'
  const segOn = 'bg-sv-blue text-white shadow-glow-blue-sm'

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="absolute inset-0" />

      <div
        className={`absolute right-3 top-3 z-20 flex w-11 flex-col overflow-hidden rounded-tile border md:right-4 md:top-4 ${chip}`}
        role="toolbar"
        aria-label={t('map.controls')}
      >
        <button
          type="button"
          aria-label={t('map.zoomIn')}
          onClick={() => mapRef.current?.zoomIn({ duration: 280 })}
          className={`grid h-11 w-full place-items-center transition ${railHover}`}
        >
          <Plus className="h-4 w-4" strokeWidth={2.25} />
        </button>
        <button
          type="button"
          aria-label={t('map.zoomOut')}
          onClick={() => mapRef.current?.zoomOut({ duration: 280 })}
          className={`grid h-11 w-full place-items-center border-t transition ${hair} ${railHover}`}
        >
          <Minus className="h-4 w-4" strokeWidth={2.25} />
        </button>
        <div className={`flex flex-col border-t ${hair}`} role="group" aria-label={t('map.terrain')}>
          <button
            type="button"
            aria-label={t('map.terrain.streets')}
            aria-pressed={terrain === 'streets'}
            onClick={() => void pickTerrain('streets')}
            className={`grid min-h-10 w-full place-items-center transition ${railHover} ${
              terrain === 'streets' ? segOn : ''
            }`}
          >
            <MapIcon className="h-4 w-4" strokeWidth={2.25} />
          </button>
          <button
            type="button"
            aria-label={t('map.terrain.satellite')}
            aria-pressed={terrain === 'satellite'}
            onClick={() => void pickTerrain('satellite')}
            className={`grid min-h-10 w-full place-items-center border-t transition ${hair} ${railHover} ${
              terrain === 'satellite' ? segOn : ''
            }`}
          >
            <Satellite className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>
      </div>
    </div>
  )
}
