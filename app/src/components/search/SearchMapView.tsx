'use client'

/**
 * /search map view — split list + price pins.
 * "Search this area" writes west/south/east/north → PostGIS /api/search.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import LocalizedLink from '@/components/LocalizedLink'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Layers, LocateFixed, Minus, Plus, Search } from 'lucide-react'
import { GEORGIA_MAX_BOUNDS, MAP_MIN_ZOOM } from '@/lib/map/buildings'
import {
  applyBrandPaints,
  bindMissingImages,
  loadMapBasemap,
  mapStyleUrl,
  overlayHybridLabels,
  STYLE_SATELLITE,
} from '@/lib/map/floorLayers'
import { mapChromeOptions, tightenAttribution } from '@/lib/map/mapChrome'
import { mapRuntimeOptions } from '@/lib/device-budget'
import { initialMapCenter } from '@/lib/map/user-place'
import { useI18n } from '@/lib/i18n/context'
import { listingPath } from '@/lib/listing-slug'
import { mapHrefForListing } from '@/lib/map/buildings'
import { stayCount, stayLine, type DealType, type Listing } from '@/data/listings'
import { useCurrency, formatMapPin } from '@/lib/currency'
import { DEAL_BRAND } from '@/lib/category-brand'
import { blurProps } from '@/lib/media'

export type MapBounds = { west: number; south: number; east: number; north: number }

function dealHue(d: DealType): string {
  if (d === 'rent') return DEAL_BRAND.rent
  if (d === 'daily') return DEAL_BRAND.daily
  if (d === 'pledge') return DEAL_BRAND.pledge
  return DEAL_BRAND.sale
}

function readBounds(map: maplibregl.Map): MapBounds {
  const b = map.getBounds()
  return {
    west: b.getWest(),
    south: b.getSouth(),
    east: b.getEast(),
    north: b.getNorth(),
  }
}

export default function SearchMapView({
  listings,
  areaActive,
  onSearchArea,
  onClearArea,
}: {
  listings: Listing[]
  areaActive?: boolean
  onSearchArea?: (b: MapBounds) => void
  onClearArea?: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map())
  const elsRef = useRef<Map<string, HTMLButtonElement>>(new Map())
  const skipMoveRef = useRef(false)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [retry, setRetry] = useState(0)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [seen, setSeen] = useState<Set<string>>(() => new Set())
  const [showSearchArea, setShowSearchArea] = useState(false)
  const [locating, setLocating] = useState(false)
  const { t } = useI18n()
  const { format, currency, rate } = useCurrency()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const themeReady = resolvedTheme != null

  const visible = listings

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !themeReady) return
    let cancelled = false
    let ro: ResizeObserver | null = null
    const container = containerRef.current
    const markers = markersRef.current
    const els = elsRef.current
    const dark = isDark
    ;(async () => {
      // ponytail: streets first (same /map look). sat+hybrid only if OFM 5s timeout.
      let terrain: 'streets' | 'satellite' = 'streets'
      let style
      try {
        style = await loadMapBasemap(mapStyleUrl(dark))
      } catch (err) {
        console.error('[SearchMap] streets', err)
        try {
          style = await overlayHybridLabels(await loadMapBasemap(STYLE_SATELLITE))
          terrain = 'satellite'
        } catch (satErr) {
          console.error('[SearchMap] sat', satErr)
          if (!cancelled) setFailed(true)
          return
        }
      }
      if (cancelled || mapRef.current) return
      const boot = initialMapCenter()
      let map: maplibregl.Map
      try {
        map = new maplibregl.Map({
          container,
          style,
          center: [boot.lng, boot.lat],
          zoom: 11,
          minZoom: MAP_MIN_ZOOM,
          maxBounds: GEORGIA_MAX_BOUNDS,
          renderWorldCopies: false,
          fadeDuration: 0,
          ...mapRuntimeOptions(),
          ...mapChromeOptions(),
        })
      } catch (err) {
        console.error('[SearchMap] gl', err)
        if (!cancelled) setFailed(true)
        return
      }
      mapRef.current = map
      map.dragRotate.disable()
      map.touchPitch.disable()
      bindMissingImages(map)
      map.on('movestart', () => {
        if (skipMoveRef.current) return
        setShowSearchArea(true)
      })
      const paint = () => {
        map.resize()
        tightenAttribution(map)
        applyBrandPaints(map, dark ? 'dark' : 'light', terrain)
      }
      map.once('load', () => {
        if (cancelled) return
        paint()
        setFailed(false)
        setReady(true)
      })
      ro = new ResizeObserver(() => map.resize())
      ro.observe(container)
    })()
    return () => {
      cancelled = true
      ro?.disconnect()
      markers.forEach((m) => m.remove())
      markers.clear()
      els.clear()
      mapRef.current?.remove()
      mapRef.current = null
      setReady(false)
    }
  }, [themeReady, isDark, retry])

  const paintPin = useCallback(
    (id: string) => {
      const el = elsRef.current.get(id)
      if (!el) return
      const hovered = hoverId === id
      const active = activeId === id
      const wasSeen = seen.has(id)
      el.style.transform = hovered || active ? 'scale(1.12)' : 'scale(1)'
      el.style.zIndex = hovered || active ? '20' : '1'
      el.style.opacity = wasSeen && !active && !hovered ? '0.55' : '1'
      el.style.boxShadow = active
        ? '0 0 0 3px rgba(255,255,255,0.95), 0 4px 14px rgba(5,11,38,0.28)'
        : '0 2px 8px rgba(5,11,38,0.18)'
    },
    [hoverId, activeId, seen],
  )

  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    markersRef.current.forEach((m) => m.remove())
    markersRef.current.clear()
    elsRef.current.clear()

    const bounds = new maplibregl.LngLatBounds()
    for (const l of visible) {
      const { lat, lng } = l.coords
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) continue
      const el = document.createElement('button')
      el.type = 'button'
      el.className =
        'cursor-pointer whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-black text-white transition-transform'
      el.style.backgroundColor = dealHue(l.dealType)
      el.textContent = formatMapPin(l.priceGEL, currency, rate) || format(l.priceGEL)
      el.setAttribute('aria-label', l.title)
      el.dataset.id = l.id
      el.addEventListener('mouseenter', () => setHoverId(l.id))
      el.addEventListener('mouseleave', () => setHoverId((cur) => (cur === l.id ? null : cur)))
      el.addEventListener('click', () => {
        setActiveId(l.id)
        setSeen((prev) => {
          if (prev.has(l.id)) return prev
          const next = new Set(prev)
          next.add(l.id)
          return next
        })
        const card = listRef.current?.querySelector(`[data-listing="${l.id}"]`)
        card?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      })
      elsRef.current.set(l.id, el)
      markersRef.current.set(
        l.id,
        new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([lng, lat]).addTo(map),
      )
      bounds.extend([lng, lat])
    }

    if (!areaActive && !bounds.isEmpty()) {
      skipMoveRef.current = true
      map.fitBounds(bounds, { padding: 56, maxZoom: 14, duration: 400 })
      map.once('moveend', () => {
        skipMoveRef.current = false
        setShowSearchArea(false)
      })
    }
  }, [ready, visible, format, currency, rate, areaActive])

  useEffect(() => {
    for (const id of elsRef.current.keys()) paintPin(id)
  }, [paintPin])

  const searchThisArea = () => {
    const map = mapRef.current
    if (!map || !onSearchArea) return
    onSearchArea(readBounds(map))
    setShowSearchArea(false)
    setActiveId(null)
  }

  const clearArea = () => {
    onClearArea?.()
    setShowSearchArea(false)
  }

  const zoomBy = (delta: number) => {
    const map = mapRef.current
    if (!map) return
    map.easeTo({ zoom: map.getZoom() + delta, duration: 200 })
  }

  const locateMe = () => {
    if (!navigator.geolocation || locating) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        mapRef.current?.easeTo({
          center: [pos.coords.longitude, pos.coords.latitude],
          zoom: 14,
          duration: 700,
        })
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    )
  }

  return (
    <div className="flex h-[min(78dvh,860px)] min-h-[min(56dvh,420px)] flex-col overflow-hidden rounded-card border border-sv-ink/[0.06] bg-sv-surface shadow-card md:flex-row">
      <div
        ref={listRef}
        className="flex max-h-[42%] min-w-0 flex-col overflow-y-auto border-b border-sv-ink/[0.06] md:max-h-none md:w-[min(22.5rem,40%)] md:shrink-0 md:border-b-0 md:border-r"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-sv-ink/[0.06] bg-sv-surface/95 px-3.5 py-2.5 backdrop-blur-sm">
          <p className="text-[13px] font-extrabold text-sv-ink">
            {t('search.mapInArea', { n: visible.length })}
          </p>
          {areaActive && (
            <button
              type="button"
              onClick={clearArea}
              className="text-[12px] font-extrabold text-sv-blue hover:text-sv-blue-deep"
            >
              {t('search.mapClearArea')}
            </button>
          )}
        </div>
        {visible.length === 0 ? (
          <p className="px-4 py-10 text-center text-[13px] font-semibold text-sv-ink/45">
            {t('search.mapEmptyArea')}
          </p>
        ) : (
          visible.map((l) => {
            const hot = hoverId === l.id || activeId === l.id
            const stay = stayCount(l)
            const suffix =
              l.dealType === 'rent'
                ? t('detail.perMonth')
                : l.dealType === 'daily'
                  ? t('detail.perDay')
                  : ''
            return (
              <Link
                key={l.id}
                href={listingPath(l)}
                data-listing={l.id}
                onMouseEnter={() => setHoverId(l.id)}
                onMouseLeave={() => setHoverId((cur) => (cur === l.id ? null : cur))}
                onFocus={() => setHoverId(l.id)}
                onBlur={() => setHoverId((cur) => (cur === l.id ? null : cur))}
                className={`flex gap-3 border-b border-sv-ink/[0.05] px-3.5 py-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-sv-blue ${
                  hot ? 'bg-sv-blue/[0.06]' : 'hover:bg-sv-ink/[0.02]'
                }`}
              >
                <span className="relative h-16 w-20 shrink-0 overflow-hidden rounded-control bg-sv-ink/[0.06]">
                  {(l.img || l.images[0]) && (
                    <Image
                      src={l.img || l.images[0]!}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                      {...blurProps(l.img || l.images[0]!)}
                    />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-black tracking-tight text-sv-ink">
                    {format(l.priceGEL)}
                    {suffix ? (
                      <span className="ml-1 text-[12px] font-bold text-sv-ink/45">{suffix}</span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] font-semibold text-sv-ink/55">
                    {stay.n > 0
                      ? `${stayLine(l, t)} · ${l.area} მ² · ${l.district}`
                      : `${l.area} მ² · ${l.district}`}
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] font-semibold text-sv-ink/40">
                    {l.title}
                  </span>
                </span>
              </Link>
            )
          })
        )}
      </div>

      <div className="relative min-h-[280px] flex-1 md:min-h-0">
        <div
          ref={containerRef}
          className="absolute inset-0 h-full w-full touch-none overscroll-contain"
          role="application"
          aria-label={t('search.map')}
          aria-busy={!ready && !failed}
        />
        {!ready && !failed && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 animate-pulse bg-gradient-to-br from-sv-blue/10 via-sv-cloud to-sv-violet/10 dark:from-sv-navy dark:via-sv-navy-soft dark:to-sv-blue/20"
          />
        )}
        {failed && (
          <div className="absolute inset-0 z-20 grid place-items-center bg-sv-cloud/95 px-4 text-center dark:bg-sv-navy/95">
            <div>
              <p className="text-[13px] font-bold text-sv-ink/60 dark:text-white/60">{t('map.error')}</p>
              <button
                type="button"
                onClick={() => {
                  mapRef.current?.remove()
                  mapRef.current = null
                  setFailed(false)
                  setRetry((n) => n + 1)
                }}
                className="mt-3 rounded-full bg-sv-blue px-4 py-2 text-[12px] font-extrabold text-white transition hover:bg-sv-blue-deep"
              >
                {t('error.retry')}
              </button>
            </div>
          </div>
        )}

        {showSearchArea && (
          <button
            type="button"
            onClick={searchThisArea}
            className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-sv-blue px-4 py-2.5 text-[13px] font-extrabold text-white shadow-glow-blue-sm transition hover:bg-sv-blue-deep"
          >
            <Search className="h-3.5 w-3.5" aria-hidden />
            {t('search.mapSearchArea')}
          </button>
        )}

        <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5">
          <LocalizedLink
            href={visible[0] ? mapHrefForListing(visible[0]) : '/map'}
            className="grid h-11 w-11 place-items-center rounded-tile border border-sv-ink/[0.08] bg-sv-orange text-white shadow-glow-orange transition hover:brightness-110"
            aria-label={t('nav.map')}
          >
            <Layers className="h-4 w-4" strokeWidth={2.5} />
          </LocalizedLink>
          <button
            type="button"
            onClick={() => zoomBy(1)}
            className="grid h-11 w-11 place-items-center rounded-tile border border-sv-ink/[0.08] bg-sv-surface text-sv-ink shadow-card transition hover:border-sv-blue/30 hover:text-sv-blue"
            aria-label={t('map.zoomIn')}
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => zoomBy(-1)}
            className="grid h-11 w-11 place-items-center rounded-tile border border-sv-ink/[0.08] bg-sv-surface text-sv-ink shadow-card transition hover:border-sv-blue/30 hover:text-sv-blue"
            aria-label={t('map.zoomOut')}
          >
            <Minus className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={locateMe}
            disabled={locating}
            className="grid h-11 w-11 place-items-center rounded-tile border border-sv-ink/[0.08] bg-sv-surface text-sv-ink shadow-card transition hover:border-sv-blue/30 hover:text-sv-blue disabled:opacity-50"
            aria-label={t('search.mapLocate')}
          >
            <LocateFixed className={`h-4 w-4 ${locating ? 'animate-pulse' : ''}`} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  )
}
