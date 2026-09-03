'use client'

/**
 * /search map view — split list + price pins.
 * "Search this area" writes west/south/east/north → PostGIS /api/search.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import LocalizedLink from '@/components/LocalizedLink'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { ChevronLeft, ChevronRight, Heart, Layers, LocateFixed, Minus, Plus, Search, X } from 'lucide-react'
import { GEORGIA_MAX_BOUNDS, MAP_MIN_ZOOM } from '@/lib/map/map-geo'
import {
  applyBrandPaints,
  bindMissingImages,
  loadMapBasemap,
  mapStyleUrl,
  overlayHybridLabels,
  STYLE_SATELLITE,
} from '@/lib/map/floorLayers'
import { mapChromeOptions, tightenAttribution } from '@/lib/map/mapChrome'
import { groupListingsByPin, paintPricePinEl, pinMinPriceGEL } from '@/lib/map/price-pin'
import { mapRuntimeOptions } from '@/lib/device-budget'
import { bindMaplibreWorker } from '@/lib/map/maplibre-worker'
import { initialMapCenter } from '@/lib/map/user-place'
import { useI18n } from '@/lib/i18n/context'
import { listingPath } from '@/lib/listing-slug'
import { mapHrefForListing } from '@/lib/map/map-href'
import { stayCount, stayLine, type Listing } from '@/data/listings'
import { useCurrency, formatMapPin, formatListingPrice } from '@/lib/currency'
import { rentPeriodKey } from '@/lib/add-listing-fields'
import { blurProps } from '@/lib/media'
import { useFavorites } from '@/lib/favorites'

export type MapBounds = { west: number; south: number; east: number; north: number }

function MapPinCard({
  listing: l,
  index,
  total,
  onIndex,
  onClose,
}: {
  listing: Listing
  index: number
  total: number
  onIndex: (i: number) => void
  onClose: () => void
}) {
  const { t } = useI18n()
  const { currency, rate } = useCurrency()
  const { has, toggle } = useFavorites()
  const stay = stayCount(l)
  const suffixKey = rentPeriodKey(l.dealType, l.propType)
  const suffix = suffixKey ? t(suffixKey) : ''
  const photo = l.img || l.images[0]
  const fav = has(l.id)
  const price = formatListingPrice({
    priceUSD: l.priceUSD,
    priceGEL: l.priceGEL,
    priceOriginal: l.priceOriginal,
    currencyOriginal: l.currencyOriginal,
    currencyPreference: currency,
    rate,
  })
  const multi = total > 1
  return (
    <div className="sv-hero-in relative [animation-duration:0.4s]" data-map-pin-card>
      <LocalizedLink
        href={listingPath(l)}
        className="block overflow-hidden rounded-card bg-sv-surface shadow-card-hover ring-1 ring-sv-ink/[0.08] transition hover:ring-sv-blue/25 dark:ring-white/10"
      >
        <span className="relative block aspect-[4/3] bg-sv-ink/[0.06]">
          {photo && (
            <Image
              src={photo}
              alt=""
              fill
              sizes="360px"
              className="object-cover"
              {...blurProps(photo)}
            />
          )}
          {multi && (
            <span className="absolute bottom-2.5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-sv-navy/70 px-2 py-1 text-[11px] font-extrabold text-white backdrop-blur-sm">
              {index + 1}/{total}
            </span>
          )}
        </span>
        <span className="block px-3.5 py-3">
          <span className="block text-[17px] font-black tracking-tight text-sv-ink">
            {price.primary}
            {suffix ? (
              <span className="ml-1 text-[12px] font-bold text-sv-ink/45">{suffix}</span>
            ) : null}
          </span>
          <span className="mt-0.5 block text-[12px] font-semibold text-sv-ink/45">{price.secondary}</span>
          <span className="mt-1 block truncate text-[13px] font-semibold text-sv-ink/60">
            {stay.n > 0
              ? `${stayLine(l, t)} · ${l.area} მ² · ${l.district}`
              : `${l.area} მ² · ${l.district}`}
          </span>
          <span className="mt-0.5 block truncate text-[12px] font-semibold text-sv-ink/40">{l.title}</span>
        </span>
      </LocalizedLink>
      <button
        type="button"
        onClick={onClose}
        className="absolute left-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full bg-sv-navy/55 text-white backdrop-blur-sm transition hover:bg-sv-navy/75"
        aria-label={t('map.close')}
      >
        <X className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>
      <button
        type="button"
        aria-label={fav ? t('detail.removeFavorite') : t('detail.addFavorite')}
        aria-pressed={fav}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          toggle(l.id)
        }}
        className={`absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full backdrop-blur-sm transition ${
          fav ? 'bg-sv-surface text-sv-orange' : 'bg-sv-navy/55 text-white hover:bg-sv-navy/75'
        }`}
      >
        <Heart className={`h-3.5 w-3.5 ${fav ? 'fill-current' : ''}`} strokeWidth={2.5} />
      </button>
      {multi && (
        <>
          <button
            type="button"
            aria-label={t('detail.prevPhoto')}
            disabled={index === 0}
            onClick={() => onIndex(index - 1)}
            className="absolute left-2.5 top-[22%] grid h-8 w-8 place-items-center rounded-full bg-sv-surface/90 text-sv-ink shadow-card backdrop-blur-sm transition hover:bg-sv-surface disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            aria-label={t('detail.nextPhoto')}
            disabled={index >= total - 1}
            onClick={() => onIndex(index + 1)}
            className="absolute right-2.5 top-[22%] grid h-8 w-8 place-items-center rounded-full bg-sv-surface/90 text-sv-ink shadow-card backdrop-blur-sm transition hover:bg-sv-surface disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </>
      )}
    </div>
  )
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
  const skipMoveRef = useRef(0)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [retry, setRetry] = useState(0)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [cardIdx, setCardIdx] = useState(0)
  const [seen, setSeen] = useState<Set<string>>(() => new Set())
  const [showSearchArea, setShowSearchArea] = useState(false)
  const [locating, setLocating] = useState(false)
  const { t } = useI18n()
  const { format, currency, rate } = useCurrency()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const themeReady = resolvedTheme != null

  const visible = listings
  const groups = useMemo(() => groupListingsByPin(visible), [visible])
  const groupsRef = useRef(groups)
  groupsRef.current = groups

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !themeReady) return
    let cancelled = false
    let ro: ResizeObserver | null = null
    let watchdog: number | undefined
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
        bindMaplibreWorker(maplibregl)
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
      map.on('click', (e) => {
        const node = e.originalEvent.target
        if (node instanceof Element && node.closest('[data-map-pin]')) return
        setActiveKey(null)
      })
      const paint = () => {
        map.resize()
        tightenAttribution(map)
        applyBrandPaints(map, dark ? 'dark' : 'light', terrain)
      }
      let booted = false
      const reveal = () => {
        if (cancelled || booted) return
        booted = true
        if (watchdog) clearTimeout(watchdog)
        paint()
        setFailed(false)
        setReady(true)
      }
      map.once('load', reveal)
      if (map.loaded()) reveal()
      watchdog = window.setTimeout(reveal, 1600)
      ro = new ResizeObserver(() => map.resize())
      ro.observe(container)
    })()
    return () => {
      cancelled = true
      if (watchdog) clearTimeout(watchdog)
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
    (key: string) => {
      const el = elsRef.current.get(key)
      const inner = el?.firstElementChild as HTMLElement | null
      if (!el || !inner) return
      const g = groupsRef.current.find((x) => x.key === key)
      const hover = !!g && !!hoverId && g.listings.some((l) => l.id === hoverId)
      paintPricePinEl(el, inner, {
        hover,
        active: activeKey === key,
        seen: seen.has(key),
      })
    },
    [hoverId, activeKey, seen],
  )

  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    markersRef.current.forEach((m) => m.remove())
    markersRef.current.clear()
    elsRef.current.clear()

    const bounds = new maplibregl.LngLatBounds()
    for (const g of groups) {
      const { lat, lng, key, listings: items } = g
      const cheapest = items[0]!
      const minGel = pinMinPriceGEL(items)
      const el = document.createElement('button')
      el.type = 'button'
      el.className = 'relative cursor-pointer border-0 bg-transparent p-0'
      el.setAttribute(
        'aria-label',
        items.length > 1 ? `${cheapest.title} · ${items.length}` : cheapest.title,
      )
      el.dataset.id = key
      el.dataset.mapPin = ''
      const inner = document.createElement('span')
      inner.className =
        'pointer-events-none block whitespace-nowrap rounded-full border border-sv-ink/[0.08] bg-sv-surface px-2.5 py-1 text-[12px] font-black tracking-tight text-sv-ink'
      inner.style.transition =
        'transform 180ms cubic-bezier(0.21, 0.65, 0.2, 1), background-color 180ms cubic-bezier(0.21, 0.65, 0.2, 1), color 180ms cubic-bezier(0.21, 0.65, 0.2, 1)'
      inner.textContent = formatMapPin(minGel, currency, rate) || format(minGel)
      el.appendChild(inner)
      if (items.length > 1) {
        const nEl = document.createElement('span')
        nEl.dataset.pinN = ''
        nEl.className =
          'pointer-events-none absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-sv-navy px-1 text-[9px] font-black text-white'
        nEl.textContent = String(items.length)
        el.appendChild(nEl)
      }
      el.addEventListener('mouseenter', () => setHoverId(cheapest.id))
      el.addEventListener('mouseleave', () =>
        setHoverId((cur) => (cur === cheapest.id ? null : cur)),
      )
      el.addEventListener('mousedown', (e) => e.stopPropagation())
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        e.preventDefault()
        setActiveKey(key)
        setCardIdx(0)
        setSeen((prev) => {
          if (prev.has(key)) return prev
          const next = new Set(prev)
          next.add(key)
          return next
        })
        listRef.current?.querySelector(`[data-listing="${cheapest.id}"]`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        })
        skipMoveRef.current += 1
        map.easeTo({
          center: [lng, lat],
          zoom: Math.max(map.getZoom(), 13),
          offset: [0, -140],
          duration: 380,
        })
        map.once('moveend', () => {
          skipMoveRef.current = Math.max(0, skipMoveRef.current - 1)
        })
      })
      elsRef.current.set(key, el)
      markersRef.current.set(
        key,
        new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([lng, lat]).addTo(map),
      )
      bounds.extend([lng, lat])
    }

    if (!areaActive && !bounds.isEmpty()) {
      skipMoveRef.current += 1
      map.fitBounds(bounds, { padding: 56, maxZoom: 14, duration: 400 })
      map.once('moveend', () => {
        skipMoveRef.current = Math.max(0, skipMoveRef.current - 1)
        setShowSearchArea(false)
      })
    }
  }, [ready, groups, format, currency, rate, areaActive])

  useEffect(() => {
    for (const id of elsRef.current.keys()) paintPin(id)
  }, [paintPin, groups, ready])

  useEffect(() => {
    if (activeKey && !groups.some((g) => g.key === activeKey)) setActiveKey(null)
  }, [groups, activeKey])

  useEffect(() => {
    if (!activeKey) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveKey(null)
        return
      }
      const g = groupsRef.current.find((x) => x.key === activeKey)
      if (!g || g.listings.length < 2) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault()
        const dir = e.key === 'ArrowRight' ? 1 : -1
        setCardIdx((i) => Math.max(0, Math.min(g.listings.length - 1, i + dir)))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeKey])

  const searchThisArea = () => {
    const map = mapRef.current
    if (!map || !onSearchArea) return
    onSearchArea(readBounds(map))
    setShowSearchArea(false)
    setActiveKey(null)
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

  const picked = activeKey ? groups.find((g) => g.key === activeKey) : undefined
  const pickedListing = picked?.listings[Math.min(cardIdx, (picked.listings.length || 1) - 1)]
  const activeIds = picked ? new Set(picked.listings.map((l) => l.id)) : null

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
            const hot = hoverId === l.id || !!activeIds?.has(l.id)
            const stay = stayCount(l)
            const suffixKey = rentPeriodKey(l.dealType, l.propType)
            const suffix = suffixKey ? t(suffixKey) : ''
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
                    {formatListingPrice({
                      priceUSD: l.priceUSD,
                      priceGEL: l.priceGEL,
                      priceOriginal: l.priceOriginal,
                      currencyOriginal: l.currencyOriginal,
                      currencyPreference: currency,
                      rate,
                    }).primary}
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

        {picked && pickedListing && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center px-3 pb-[env(safe-area-inset-bottom)]">
            <div className="pointer-events-auto w-full max-w-[20rem] overflow-hidden">
              <MapPinCard
                listing={pickedListing}
                index={Math.min(cardIdx, picked.listings.length - 1)}
                total={picked.listings.length}
                onIndex={setCardIdx}
                onClose={() => setActiveKey(null)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
