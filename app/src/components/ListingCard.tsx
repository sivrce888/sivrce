'use client'

import { useId, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import LocalizedLink from '@/components/LocalizedLink'
import { useInViewOnce } from '@/components/Reveal'
import {
  Heart, BedDouble, Bath, Ruler, MapPin, Crown, Flame, Share2, Zap, DoorOpen,
  TrendingDown, TrainFront, CircleDot, Columns2, ChevronLeft, ChevronRight, Clock,
  Layers, BadgeCheck, Play, Camera, Copy, Eye, X, Volume2, VolumeX,
} from 'lucide-react'
import type { Listing } from '@/data/listings'
import { formatPerM2, formatFloor, postedDaysAgo, postedAgoLabel, stayCount, stayLine, priceOnRequestLabel } from '@/lib/listing-format'
import { placeLabel } from '@/lib/place-label'
import { listingDisplayTitle, listingPath } from '@/lib/listing-slug'
import { listingPublicId } from '@/lib/listing-public-id'
import { listingShareLines, listingShareText } from '@/lib/listing-share'
import { useCurrency, formatListingPrice } from '@/lib/currency'
import { useFavorites } from '@/lib/favorites'
import { useCompare } from '@/lib/compare'
import { useCompareStrings } from '@/components/compare/i18n'
import { useI18n } from '@/lib/i18n/context'
import { FeatureGlyph } from '@/components/FeatureIcon'
import { BRAND } from '@/lib/brand'
import { CATEGORY_BRAND, DEAL_BRAND } from '@/lib/category-brand'
import { isLandLease, rentPeriodKey } from '@/lib/add-listing-fields'
import { avifCardOf, cardOf } from '@/lib/media'
import { photoIndexFromX } from '@/lib/photo-index-from-x'
import { cardGalleryTeaser, photoMountIdx } from '@/lib/card-gallery-teaser'
import { pickDailySignals } from '@/lib/features'
import { formatMetroDist } from '@/lib/map/metro-format'
import { readableName } from '@/lib/ka-latin'
import { useDistrictPpsm } from '@/lib/district-ppsm'
import { vsDistrict } from '@/lib/price-scale'
import { useNearestMetro } from '@/components/use-nearest-metro'
import { SparkMark } from '@/components/SparkMark'
import { sivrceScore } from '@/lib/sivrce-score'
import { aiLabel } from '@/lib/ai-label'
import { inlineVideoEmbedFor, getActiveVideoCard, setActiveVideoCard, subscribeActiveVideoCard } from '@/lib/listing-video'

/* Card lifestyle chips — central FEATURE_ICON (mirrors Collections.tsx) */

/* VIP badge system — locked in BRAND.vipTiers, consumed here (BRAND.md §8) */
export const BADGE_STYLE: Record<NonNullable<Listing['badge']>, string> = {
  'SUPER VIP': BRAND.vipTiers['SUPER VIP'].style,
  'VIP+': BRAND.vipTiers['VIP+'].style,
  VIP: BRAND.vipTiers.VIP.style,
}

const CHIP_PAD = { md: 'px-3 py-1.5 text-[11px]', sm: 'px-2.5 py-1 text-[10px]' } as const
const CHIP_ICON = { md: 'h-3.5 w-3.5', sm: 'h-3 w-3' } as const

function ExclusiveChip({
  compact,
  size,
  label,
  hint,
  chipClass,
  icon,
}: {
  compact: boolean
  size: 'sm' | 'md'
  label: string
  hint: string
  chipClass: string
  icon: ReactNode
}) {
  const tipId = useId()
  const chip = `${CHIP_PAD[size]} inline-flex items-center gap-1 whitespace-nowrap rounded-full font-black tracking-wide ${chipClass}`
  if (compact) {
    return <span title={hint} className={`pointer-events-auto ${chip}`}>{icon}{label}</span>
  }
  return (
    <span className="group relative">
      <button
        type="button"
        aria-describedby={tipId}
        className={`${chip} pointer-events-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2`}
      >
        {icon}{label}
      </button>
      <span
        id={tipId}
        role="tooltip"
        className="invisible absolute left-0 top-[calc(100%+8px)] z-40 w-[min(18rem,calc(100vw-2rem))] rounded-module bg-sv-surface p-3.5 text-left opacity-0 shadow-card ring-1 ring-sv-ink/[0.08] transition duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 dark:ring-white/10"
      >
        <span className="block text-[13px] font-black text-sv-blue">{label}</span>
        <span className="mt-1 block text-[12px] font-semibold leading-snug text-sv-ink/60">{hint}</span>
      </span>
    </span>
  )
}

/** Agency exclusive + Sivrce-only. Cards: compact. Detail: hover/focus tooltip. */
export function ExclusiveBadges({
  exclusive,
  sivrceExclusive,
  size = 'sm',
  compact = true,
}: {
  exclusive?: boolean
  sivrceExclusive?: boolean
  size?: 'sm' | 'md'
  compact?: boolean
}) {
  const { t } = useI18n()
  if (!exclusive && !sivrceExclusive) return null
  const icon = CHIP_ICON[size]
  return (
    <>
      {exclusive ? (
        <ExclusiveChip
          compact={compact}
          size={size}
          label={t('badge.exclusive')}
          hint={t('badge.exclusiveHint')}
          chipClass="border border-sv-blue-light/30 bg-gradient-to-r from-sv-navy via-sv-blue to-sv-violet text-white shadow-glow-blue-sm"
          icon={<Crown className={icon} aria-hidden />}
        />
      ) : null}
      {sivrceExclusive ? (
        <ExclusiveChip
          compact={compact}
          size={size}
          label={compact ? t('badge.sivrceExclusiveShort') : t('badge.sivrceExclusive')}
          hint={t('badge.sivrceExclusiveHint')}
          chipClass="bg-sv-navy text-white"
          icon={<SparkMark className={`${icon} text-sv-orange`} mono />}
        />
      ) : null}
    </>
  )
}

/** Paid stickers + exclusive flags — amenities stay free features. */
export function ListingStickerStack({
  urgent,
  priceDrop,
  inStory,
  exclusive,
  sivrceExclusive,
  className = '',
  size = 'sm',
  max = 2,
}: {
  urgent?: boolean
  priceDrop?: boolean
  inStory?: boolean
  exclusive?: boolean
  sivrceExclusive?: boolean
  className?: string
  size?: 'sm' | 'md'
  /** Photo overlay cap — trust first, then urgency. */
  max?: number
}) {
  const { t } = useI18n()
  const pad = CHIP_PAD[size]
  const icon = CHIP_ICON[size]
  const chips: ReactNode[] = []
  if (exclusive) {
    chips.push(
      <ExclusiveChip
        key="ex"
        compact
        size={size}
        label={t('badge.exclusive')}
        hint={t('badge.exclusiveHint')}
        chipClass="border border-sv-blue-light/30 bg-gradient-to-r from-sv-navy via-sv-blue to-sv-violet text-white shadow-glow-blue-sm"
        icon={<Crown className={icon} aria-hidden />}
      />,
    )
  }
  if (sivrceExclusive) {
    chips.push(
      <ExclusiveChip
        key="sv"
        compact
        size={size}
        label={t('badge.sivrceExclusiveShort')}
        hint={t('badge.sivrceExclusiveHint')}
        chipClass="bg-sv-navy text-white"
        icon={<SparkMark className={`${icon} text-sv-orange`} mono />}
      />,
    )
  }
  if (urgent) {
    chips.push(
      <span key="urgent" className={`flex items-center gap-1 rounded-full bg-gradient-to-r from-sv-orange to-sv-orange-deep font-black tracking-wide text-sv-ink shadow-glow-orange ${pad}`}>
        <Zap className={icon} aria-hidden />
        {t('sticker.urgent')}
      </span>,
    )
  }
  if (priceDrop) {
    chips.push(
      <span key="drop" className={`flex items-center gap-1 rounded-full bg-sv-navy/90 font-black tracking-wide text-white backdrop-blur ${pad}`}>
        <TrendingDown className={icon} aria-hidden />
        {t('sticker.priceDrop')}
      </span>,
    )
  }
  if (inStory) {
    chips.push(
      <span key="story" className={`flex items-center gap-1 rounded-full bg-gradient-to-r from-sv-violet to-sv-blue font-black tracking-wide text-white shadow-glow-blue-sm ${pad}`}>
        <CircleDot className={icon} aria-hidden />
        {t('sticker.story')}
      </span>,
    )
  }
  const shown = chips.slice(0, Math.max(0, max))
  if (shown.length === 0) return null
  return <div className={`flex flex-col items-start gap-1 ${className}`}>{shown}</div>
}

interface ListingCardProps {
  l: Listing
  i?: number
  /** grid (default, fixed scroller width) | wide (fills grid cell) | list (horizontal) */
  layout?: 'grid' | 'wide' | 'list'
  animate?: boolean
  /** Structured-search match: n of criteria, hint = reasons + honest gaps. */
  match?: { n: number; total: number; hint: string }
}

export default function ListingCard({ l, i = 0, layout = 'grid', animate = true, match }: ListingCardProps) {
  const { has, toggle } = useFavorites()
  const { has: inCompare, toggle: toggleCompare, full: compareFull } = useCompare()
  const { t, lang } = useI18n()
  const districtPpsm = useDistrictPpsm()
  // SS.ge-style price position: sale listings only, project teasers excluded
  // ("from" prices aren't comparable), quiet/scam bands hidden inside vsDistrict.
  const vsAvg =
    l.dealType === 'sale' && !l.projectCatalog
      ? vsDistrict(l.perM2USD, districtPpsm?.[l.district] ?? 0)
      : null
  const cs = useCompareStrings()
  const { currency, rate, eurRate } = useCurrency()
  const fav = has(l.id)
  const compared = inCompare(l.id)
  const lifestyle = l.dealType === 'daily' ? pickDailySignals(l.features) : []
  // Server chip wins worldwide (zero client bytes); static listings lazily load the grid.
  const metro = useNearestMetro(l.metroNear, l.coords.lat, l.coords.lng)
  const scored = sivrceScore({
    verified: l.verified,
    photos: l.photoCount ?? (l.images?.length || (l.img ? 1 : 0)),
    features: l.features?.length ?? 0,
    hasCoords: Number.isFinite(l.coords.lat) && Number.isFinite(l.coords.lng),
  })
  const displayScore = scored.score
  const displayLabel = aiLabel(displayScore, lang)
  const city = placeLabel(l.city, lang, l.country)
  const district = placeLabel(l.district, lang, l.country)
  const title = listingDisplayTitle(l, lang, t)
  const onRequest = Boolean(l.projectCatalog && l.priceUSD <= 0)

  const { photos, multi, more, total } = cardGalleryTeaser(l.images, l.img, l.photoCount)
  const href = l.projectCatalog && l.projectSlug ? `/projects/${l.projectSlug}` : listingPath(l)
  const [photo, setPhoto] = useState(0)
  // Neighbour frames mount on intent (pointer/touch/focus on the photo), not on paint:
  // stacked opacity-0 frames sit in the viewport, so lazy-load fetched + decoded 3 photos per card.
  const [warm, setWarm] = useState(false)
  const { ref: revealRef, inView: revealInView } = useInViewOnce<HTMLElement>('-40px')
  const frame = photos.length ? Math.min(photo, photos.length - 1) : 0
  const imgRef = useRef<HTMLDivElement>(null)
  const touchRef = useRef<{ x: number; y: number } | null>(null)
  const axisLock = useRef<'h' | 'v' | null>(null)
  const swipedRef = useRef(false)

  // Inline card video — plays right on the card, photos keep their frame.
  // ponytail: <video>/<iframe> mounts on tap only (zero bytes + decoder at rest);
  // singleton governor = max one card playing globally.
  const videoEmbed = l.video ? inlineVideoEmbedFor(l.video, true) : null
  const [playing, setPlaying] = useState(false)
  const [videoMuted, setVideoMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoKey = useId()

  useEffect(() => {
    if (!playing) return
    setActiveVideoCard(videoKey)
    const unsubscribe = subscribeActiveVideoCard((id) => {
      if (id !== videoKey) setPlaying(false)
    })
    return () => {
      unsubscribe()
      if (getActiveVideoCard() === videoKey) setActiveVideoCard(null)
    }
  }, [playing, videoKey])

  const stopVideo = () => {
    const v = videoRef.current
    // Drop the decoder + buffered bytes immediately, not at GC.
    if (v) {
      v.pause()
      v.removeAttribute('src')
      v.load()
    }
    setPlaying(false)
  }

  const playVideo = (e: React.SyntheticEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (videoEmbed) setPlaying(true)
  }

  const toggleVideoSound = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const next = !videoMuted
    setVideoMuted(next)
    if (videoRef.current) videoRef.current.muted = next
  }

  const priceObj = formatListingPrice({
    priceUSD: l.priceUSD,
    priceGEL: l.priceGEL,
    priceOriginal: l.priceOriginal,
    currencyOriginal: l.currencyOriginal,
    currencyPreference: currency,
    country: l.country,
    rate,
    eurRate,
  })
  const suffixKey = rentPeriodKey(l.dealType, l.propType)
  const suffix = suffixKey ? t(suffixKey) : ''
  const stay = stayCount(l)
  const stayText = stayLine(l, t, lang)
  const StayIcon = stay.kind === 'beds' ? BedDouble : DoorOpen
  const displayPrice = onRequest ? priceOnRequestLabel(lang) : `${priceObj.primary}${suffix}`
  const displaySecondaryPrice = onRequest ? '' : priceObj.secondary

  const navPhoto = (dir: number, e: React.SyntheticEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setPhoto((p) => (p + dir + photos.length) % photos.length)
  }

  // Hover scrub (fine pointer only) — move across photo = flip frames. Touch keeps swipe.
  const onImgPointerMove = (e: React.PointerEvent) => {
    if (!multi || playing || e.pointerType !== 'mouse' || !imgRef.current) return
    // Don't fight share/heart/chevrons/segments
    if ((e.target as HTMLElement).closest('button')) return
    const r = imgRef.current.getBoundingClientRect()
    if (r.width <= 0) return
    const next = photoIndexFromX((e.clientX - r.left) / r.width, photos.length)
    setPhoto((p) => (p === next ? p : next))
  }

  const onImgTouchStart = (e: React.TouchEvent) => {
    if (!multi || playing || !imgRef.current) return
    const t = e.touches[0]
    const r = imgRef.current.getBoundingClientRect()
    if (t.clientX < r.left || t.clientX > r.right || t.clientY < r.top || t.clientY > r.bottom) {
      touchRef.current = null
      return
    }
    touchRef.current = { x: t.clientX, y: t.clientY }
    axisLock.current = null
    swipedRef.current = false
  }

  const onImgTouchMove = (e: React.TouchEvent) => {
    if (!multi || !touchRef.current) return
    const dx = e.touches[0].clientX - touchRef.current.x
    const dy = e.touches[0].clientY - touchRef.current.y
    if (!axisLock.current && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      axisLock.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'
    }
    // Claim horizontal gesture so homepage HScroll doesn't steal it
    if (axisLock.current === 'h') e.stopPropagation()
  }

  const onImgTouchEnd = (e: React.TouchEvent) => {
    if (!multi || !touchRef.current) return
    const dx = e.changedTouches[0].clientX - touchRef.current.x
    touchRef.current = null
    if (axisLock.current !== 'h' || Math.abs(dx) < 40) {
      axisLock.current = null
      return
    }
    axisLock.current = null
    swipedRef.current = true
    setPhoto((p) => (p + (dx < 0 ? 1 : -1) + photos.length) % photos.length)
  }

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const url = `${window.location.origin}${l.projectCatalog && l.projectSlug ? `/projects/${l.projectSlug}` : listingPath(l)}`
    const input = {
      title,
      district,
      city,
      area: l.area,
      priceLabel: displayPrice,
      agentName: l.agent.name,
      agency: l.agent.agency,
    }
    if (navigator.share) {
      navigator.share({ title, text: listingShareLines(input).join('\n'), url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(listingShareText(input, url)).catch(() => {})
    }
  }

  // Always visible — hover-hide made chrome look "missing" on desktop
  const actionBtn =
    'grid h-11 w-11 place-items-center rounded-full bg-white/90 text-sv-ink shadow-glow-navy backdrop-blur transition-colors duration-200 hover:bg-sv-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-blue [@media(pointer:fine)]:h-8 [@media(pointer:fine)]:w-8'

  const imageBlock = (
    <div
      ref={imgRef}
      // z-[1] keeps chrome above the title's full-card ::after hit layer
      className={`relative z-[1] overflow-hidden bg-sv-navy/[0.06] ${layout === 'list' ? 'aspect-[4/3] w-full sm:aspect-auto sm:h-full sm:min-h-[200px] sm:w-[min(17.5rem,38%)] sm:shrink-0' : 'aspect-[4/3]'}`}
      onPointerMove={onImgPointerMove}
      onPointerEnter={warm ? undefined : () => setWarm(true)}
      onFocus={warm ? undefined : () => setWarm(true)}
    >
      {/* Current ±1 only — full gallery, no 15-frame stack. CDN masters skip Vercel Image Opt. */}
      {(warm ? photoMountIdx(frame, photos.length) : [frame]).map((idx) => {
        const src = photos[idx]
        const card = cardOf(src)
        const avif = avifCardOf(src)
        // First card paints the LCP on grid pages — eager + high; the rest lazy.
        // ponytail: 1 high-priority image only — 4×fetchPriority=high contended
        // with text-LCP bandwidth on home. Visible frame only, never its neighbours.
        const eager = i < 1 && idx === frame
        return (
          // ponytail: native lazy img — next/image was emitting <link rel=preload> for below-fold cards
          // AVIF first (~30% smaller); missing twin (old photos) falls back to WebP automatically.
          <picture
            key={`${src}-${idx}`}
            className={`absolute inset-0 ${
              idx === frame ? 'opacity-100' : 'pointer-events-none opacity-0'
            } transition-opacity duration-200 ease-out motion-reduce:duration-0`}
          >
            {avif ? <source srcSet={avif} type="image/avif" /> : null}
            <img
              src={card ?? src}
              alt={idx === frame ? title : ''}
              width={800}
              height={600}
              draggable={false}
              loading={eager ? 'eager' : 'lazy'}
              decoding="async"
              fetchPriority={eager ? 'high' : 'low'}
              aria-hidden={idx !== frame}
              onError={card ? (e) => { if (e.currentTarget.src !== src) e.currentTarget.src = src } : undefined}
              className={`h-full w-full object-cover ${src.includes('/images/projects/') ? 'object-left' : ''}`}
            />
          </picture>
        )
      })}
      {/* Bottom-only navy tint — counter + dashes stay readable, photo stays the hero */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-sv-navy/50 to-transparent" />
      {playing && videoEmbed ? (
        <div className="absolute inset-0 z-30 bg-sv-navy">
          {videoEmbed.type === 'native' ? (
            <video
              ref={videoRef}
              src={videoEmbed.url}
              aria-label={title}
              autoPlay
              muted={videoMuted}
              loop
              playsInline
              preload="auto"
              {...{ 'webkit-playsinline': '' }}
              onClick={(e) => {
                e.preventDefault()
                const v = videoRef.current
                if (!v) return
                if (v.paused) v.play().catch(() => {})
                else v.pause()
              }}
              className="h-full w-full cursor-pointer object-cover"
            />
          ) : (
            <iframe
              src={videoEmbed.url}
              title={title}
              allow="autoplay; encrypted-media; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              className="h-full w-full border-0"
            />
          )}
          <button
            type="button"
            aria-label={t('card.closeVideo')}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              stopVideo()
            }}
            className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-sv-navy/60 text-white backdrop-blur-md transition-colors duration-200 hover:bg-sv-navy/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
          {videoEmbed.type === 'native' ? (
            <button
              type="button"
              aria-label={videoMuted ? t('card.unmute') : t('card.mute')}
              aria-pressed={!videoMuted}
              onClick={toggleVideoSound}
              className="absolute bottom-3 right-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-sv-navy/60 text-white backdrop-blur-md transition-colors duration-200 hover:bg-sv-navy/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {videoMuted ? <VolumeX className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
            </button>
          ) : null}
        </div>
      ) : null}
      {videoEmbed && !playing && !(more > 0 && frame === photos.length - 1) ? (
        <button
          type="button"
          className="group/play absolute left-1/2 top-1/2 z-20 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-sv-navy/60 text-white shadow-glow-blue-sm backdrop-blur-md transition-colors duration-200 hover:bg-sv-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label={t('detail.playVideo')}
          onClick={playVideo}
        >
          <Play className="ml-0.5 h-4 w-4 fill-white transition-transform group-hover/play:scale-110" />
        </button>
      ) : null}
      {more > 0 && frame === photos.length - 1 ? (
        <span className="pointer-events-none absolute inset-0 z-[5] grid place-items-center bg-sv-navy/55 text-white backdrop-blur-[2px]">
          <span className="flex flex-col items-center gap-1.5">
            <Camera className="h-6 w-6" strokeWidth={1.75} aria-hidden />
            <span className="text-[13px] font-black tracking-wide">{t('card.allPhotos', { n: more })}</span>
          </span>
        </span>
      ) : null}
      {/* ponytail: photo click → same tab (Cmd/Ctrl+click = new). Chrome stays above. */}
      <LocalizedLink
        href={href}
        aria-hidden
        tabIndex={-1}
        className="absolute inset-0 z-0"
        onClick={(e) => {
          if (swipedRef.current) {
            e.preventDefault()
            swipedRef.current = false
          }
        }}
      />
      {/* ── Photo chrome map ───────────────────────────────────────────
          TL: VIP / stickers
          TR: share · compare · heart
          Mid: ‹ › white chips on hover (desktop); touch = swipe
          Bottom: hairline dashes (center) · 1 / N (right)
      */}
      {l.badge && (
        <span className={`absolute left-3 top-4 z-20 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black tracking-wider ${BADGE_STYLE[l.badge]}`}>
          {l.badge === 'SUPER VIP' ? <Crown className="h-3 w-3" /> : <Flame className="h-3 w-3" />}
          {l.badge}
        </span>
      )}
      {l.projectCatalog && !l.badge && (
        <span className="absolute left-3 top-4 z-20 rounded-full bg-sv-navy/85 px-2.5 py-1 text-[11px] font-black tracking-wider text-white backdrop-blur">
          {t('detail.project')}
        </span>
      )}
      <ListingStickerStack
        urgent={l.stickerUrgent}
        priceDrop={l.stickerPriceDrop}
        inStory={l.inStory}
        exclusive={l.isExclusive}
        sivrceExclusive={l.isSivrceExclusive}
        max={l.badge || l.projectCatalog ? 1 : 2}
        className={`absolute left-3 z-20 ${l.badge || l.projectCatalog ? 'top-14' : 'top-4'}`}
      />

      <div className="absolute right-3 top-4 z-20 flex gap-1.5">
        <button
          type="button"
          aria-label={t('detail.share')}
          onClick={handleShare}
          className={`${actionBtn} hidden hover:text-sv-blue [@media(hover:hover)]:grid`}
        >
          <Share2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          aria-label={compared ? cs('remove') : compareFull ? cs('full') : cs('add')}
          aria-pressed={compared}
          disabled={!compared && compareFull}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            toggleCompare(l.id)
          }}
          className={`${actionBtn} hidden disabled:cursor-not-allowed disabled:opacity-40 [@media(hover:hover)]:grid ${
            compared ? 'bg-sv-surface text-sv-blue' : 'hover:text-sv-blue'
          }`}
        >
          <Columns2 className={`h-3.5 w-3.5 ${compared ? 'stroke-[2.5]' : ''}`} />
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
          className={`${actionBtn} ${
            fav ? 'bg-sv-surface text-sv-orange' : 'hover:text-sv-orange'
          }`}
        >
          <Heart className={`h-3.5 w-3.5 ${fav ? 'fill-current sv-heart-pop' : ''}`} />
        </button>
      </div>

      {multi && !playing && warm && (
        <>
          {/* Hover/focus only — touch uses swipe + dashes. Mounted on first
              pointerenter/focus (warm): the always-present heart precedes them
              in tab order, so keyboard users still reach them; SSR skips ~8 nodes/card. */}
          <button
            type="button"
            aria-label={t('detail.prevPhoto')}
            onClick={(e) => navPhoto(-1, e)}
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 opacity-0 transition-opacity focus-visible:opacity-100 focus-visible:outline-none group-hover:opacity-100 [@media(pointer:coarse)]:hidden"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-sv-ink shadow-glow-navy backdrop-blur transition-colors hover:bg-sv-surface">
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
            </span>
          </button>
          <button
            type="button"
            aria-label={t('detail.nextPhoto')}
            onClick={(e) => navPhoto(1, e)}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 opacity-0 transition-opacity focus-visible:opacity-100 focus-visible:outline-none group-hover:opacity-100 [@media(pointer:coarse)]:hidden"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-sv-ink shadow-glow-navy backdrop-blur transition-colors hover:bg-sv-surface">
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </span>
          </button>
        </>
      )}

      {/* Bottom: video chip (left) · hairline dashes (center) + 1 / N (right) */}
      {multi && !playing && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3">
          {videoEmbed ? (
            <button
              type="button"
              onClick={playVideo}
              aria-label={t('detail.playVideo')}
              className="pointer-events-auto flex items-center gap-1 justify-self-start rounded-full bg-sv-navy/60 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white/95 backdrop-blur-sm transition-colors duration-200 hover:bg-sv-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Play className="h-2.5 w-2.5 fill-white" aria-hidden />
              {t('card.hasVideo')}
            </button>
          ) : (
            <span />
          )}
          <div
            className="pointer-events-auto flex w-[7.5rem] gap-[3px] sm:w-36"
            role="group"
            aria-label={t('detail.photoViewer')}
          >
            {photos.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-current={frame === idx ? 'true' : undefined}
                aria-label={t('detail.photo', { n: idx + 1 })}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setPhoto(idx)
                }}
                className="-my-3 flex h-6 min-w-0 flex-1 items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span
                  aria-hidden
                  className={`block h-[2px] w-full rounded-full transition-colors duration-200 ${
                    frame === idx ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              </button>
            ))}
          </div>
          <span
            aria-live="polite"
            className="justify-self-end rounded-full bg-sv-navy/60 px-2 py-0.5 text-[10px] font-bold tabular-nums tracking-wide text-white/95 backdrop-blur-sm"
          >
            {frame + 1} / {total}
          </span>
        </div>
      )}

    </div>
  )

  const streetHref = l.streetHref ?? null
  const publicId = listingPublicId(l)
  const days = postedDaysAgo(l)
  // District sometimes already embeds the city (project catalog addresses).
  const place = district && city && district.includes(city)
    ? district
    : [district, city].filter(Boolean).join(', ')

  const showPerM2 = l.dealType === 'sale' && l.perM2USD > 0

  const rail = layout === 'grid'

  const bodyBlock = (
    <div className="flex min-w-0 flex-1 flex-col p-4 pt-3.5">
      {/* Price first — scannable like ss.ge / myhome with locked nominal currency */}
      <div className="flex min-w-0 items-baseline gap-2 text-[clamp(1.125rem,0.9rem+2.2cqi,1.375rem)] font-black tabular-nums tracking-[-0.03em] text-sv-ink dark:text-sv-blue">
        <span>{displayPrice}</span>
        <span className="text-[13px] font-semibold text-sv-ink/60 dark:text-sv-blue-light/70">{displaySecondaryPrice}</span>
        {l.dealType === 'pledge' && (
          <span
            className="self-center rounded-full px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-sv-navy"
            style={{ backgroundColor: DEAL_BRAND.pledge }}
          >
            {t('map.pledge')}
          </span>
        )}
        {isLandLease(l.dealType, l.propType) && (
          <span
            className="self-center rounded-full px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-sv-navy"
            style={{ backgroundColor: CATEGORY_BRAND.land.hue }}
          >
            {t('add.deal.lease')}
          </span>
        )}
      </div>
      {/* ponytail: rails reserve the row so mixed sale/rent cards stay even; search/list drop empty air */}
      {showPerM2 || rail ? (
        <p
          className={`mt-0.5 flex items-center gap-1.5 text-[13px] font-bold tabular-nums text-sv-ink/60 ${rail ? 'min-h-[1.25rem]' : ''} ${showPerM2 ? '' : 'invisible'}`}
          aria-hidden={!showPerM2}
        >
          <span className="min-w-0 truncate">{showPerM2 ? formatPerM2(l, currency, lang) : '\u00a0'}</span>
          {vsAvg !== null && (
            <span
              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-black leading-tight ${
                vsAvg < 0 ? 'bg-sv-blue/10 text-sv-blue-deep' : 'bg-sv-ink/[0.06] text-sv-ink/60'
              }`}
            >
              {vsAvg > 0 ? '+' : ''}{vsAvg}% {t('card.vsAvg')}
            </span>
          )}
        </p>
      ) : null}
      {/* Lifestyle under price — was photo overlay, covered dots/chevrons */}
      {lifestyle.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {lifestyle.map((key) => (
            <span
              key={key}
              className="flex max-w-full items-center gap-1 rounded-full bg-sv-cloud px-2 py-0.5 text-[11px] font-extrabold leading-tight text-sv-ink/70"
            >
              <FeatureGlyph
                k={key}
                className={`h-3 w-3 shrink-0 ${key === 'add.f.partiesAllowed' ? '' : 'text-sv-blue'}`}
                style={key === 'add.f.partiesAllowed' ? { color: CATEGORY_BRAND.partyHouses.hue } : undefined}
              />
              <span className="truncate">{t(key)}</span>
            </span>
          ))}
        </div>
      )}

      <h3 className={`mt-2.5 text-[15px] font-extrabold leading-[1.4] text-sv-ink transition-colors group-hover:text-sv-blue ${rail ? 'min-h-[2.8em]' : ''}`}>
        <LocalizedLink
          href={href}
          aria-label={title}
          onClick={(e) => {
            if (swipedRef.current) {
              e.preventDefault()
              swipedRef.current = false
            }
          }}
          className="rounded-sm after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
        >
          {title}
        </LocalizedLink>
      </h3>

      <p className="relative z-10 mt-1.5 flex min-w-0 items-center gap-1.5 text-[13px] font-semibold text-sv-ink/60">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-sv-blue" aria-hidden />
        {streetHref ? (
          <LocalizedLink
            href={streetHref}
            className="truncate text-sv-blue dark:text-sv-blue-light hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {place || l.address}
          </LocalizedLink>
        ) : (
          <span className="truncate">{place || l.address}</span>
        )}
      </p>

      {metro || rail ? (
        <p
          className={`mt-1 flex min-w-0 items-center gap-1.5 text-[12px] font-bold text-sv-blue dark:text-sv-blue-light ${rail ? 'min-h-[1.25rem]' : ''} ${metro ? '' : 'invisible'}`}
          aria-hidden={!metro}
        >
          {/* ponytail: invisible placeholder rows keep height via text, skip the SVG (−DOM per card) */}
          {metro ? <TrainFront className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
          <span className="min-w-0 flex-1 text-[12px] font-bold leading-snug">{metro ? readableName(metro.name, lang) : '\u00a0'}</span>
          <span className="shrink-0 font-semibold text-sv-blue dark:text-sv-blue-light">
            · {metro ? formatMetroDist(metro, lang) : '\u00a0'}
          </span>
        </p>
      ) : null}

      {/* Specs + AI + meta pinned to bottom — equal card heights in rails */}
      <div className="mt-auto pt-3">
        {/* ponytail: 4 reserved slots — conditional hide made rails look 2-vs-3 jagged */}
        <div className="sv-card-specs min-h-[1.5rem] gap-x-2 gap-y-1.5 border-t border-sv-ink/[0.06] pt-3 text-[13px] font-bold leading-snug text-sv-ink/70">
          <span className={`flex min-w-0 items-center gap-1 ${l.area > 0 ? '' : 'invisible'}`} aria-hidden={l.area <= 0}>
            {l.area > 0 ? <Ruler className="h-3.5 w-3.5 shrink-0 text-sv-ink/60" aria-hidden /> : null}
            <span>
              {l.projectCatalog ? t('card.areaFrom', { n: l.area }) : `${l.area} ${t('add.areaUnit.m2')}`}
            </span>
          </span>
          <span
            className={`flex min-w-0 items-center gap-1 ${stay.n > 0 ? '' : 'invisible'}`}
            aria-hidden={stay.n <= 0}
            title={stay.kind === 'beds' && stay.rooms > 0 ? stayText : undefined}
          >
            {stay.n > 0 ? <StayIcon className="h-3.5 w-3.5 shrink-0 text-sv-ink/60" aria-hidden /> : null}
            <span>{stayText}</span>
          </span>
          <span className={`flex min-w-0 items-center gap-1 ${l.baths > 0 ? '' : 'invisible'}`} aria-hidden={l.baths <= 0}>
            {l.baths > 0 ? <Bath className="h-3.5 w-3.5 shrink-0 text-sv-ink/60" aria-hidden /> : null}
            {l.baths}
          </span>
          <span
            className={`flex min-w-0 items-center gap-1 text-sv-ink/60 ${
              !l.projectCatalog && (l.floor > 0 || l.totalFloors > 0) ? '' : 'invisible'
            }`}
            aria-hidden={l.projectCatalog || (l.floor <= 0 && l.totalFloors <= 0)}
          >
            {!l.projectCatalog && (l.floor > 0 || l.totalFloors > 0) ? <Layers className="h-3.5 w-3.5 shrink-0 text-sv-ink/60" aria-hidden /> : null}
            <span>{formatFloor(l, lang)}</span>
          </span>
        </div>

        {/* ponytail: Spark + score, no gradient AI chrome box */}
        <div className="mt-2.5 flex min-h-[1.5rem] items-center gap-2">
          <SparkMark className="h-3.5 w-3.5 shrink-0" />
          <span className="shrink-0 text-[13px] font-black tabular-nums tracking-tight text-sv-ink">
            {displayScore || '—'}
          </span>
          <span className="min-w-0 flex-1 truncate text-[12px] font-semibold leading-snug text-sv-ink/60">
            {displayLabel || t('detail.aiScore')}
          </span>
          {l.verified ? (
            <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-sv-blue" aria-label={t('detail.scoreVerified')} />
          ) : null}
          {(l.dupeCount ?? 0) > 1 && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sv-blue/10 px-2 py-0.5 text-[11px] font-black tabular-nums text-sv-blue-deep">
              <Copy className="h-3 w-3" aria-hidden />×{l.dupeCount}
            </span>
          )}
          {match && match.total > 0 ? (
            <span
              title={match.hint}
              className="shrink-0 rounded-full bg-sv-blue/10 px-2 py-0.5 text-[11px] font-black tabular-nums text-sv-blue-deep"
            >
              {match.n}/{match.total}
            </span>
          ) : null}
          {l.isNew && (
            <span className="shrink-0 rounded-full bg-sv-orange/10 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-sv-ink">
              {t('card.new')}
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 text-[12px] font-semibold text-sv-ink/60">
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex shrink-0 items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden />
              {postedAgoLabel(days, lang)}
            </span>
            {l.views > 0 && (
              <span
                className="flex shrink-0 items-center gap-1 tabular-nums"
                aria-label={t('card.views')}
                title={t('card.views')}
              >
                <Eye className="h-3 w-3" aria-hidden />
                {new Intl.NumberFormat(lang, { notation: 'compact' }).format(l.views)}
              </span>
            )}
          </span>
          <span className="min-w-0 truncate font-mono text-[10px] font-black tabular-nums text-sv-ink/60">
            #{publicId}
          </span>
        </div>
      </div>
    </div>
  )

  const sizeClass =
    layout === 'grid'
      ? 'w-[clamp(16.5rem,82%,23.75rem)] shrink-0 self-stretch'
      : layout === 'list'
        ? 'w-full min-w-0 flex-col self-start sm:flex-row'
        : 'min-w-0 w-full self-start'

  return (
    <article
      ref={revealRef}
      data-reveal={animate ? '' : undefined}
      data-in={!animate || revealInView || undefined}
      style={
        animate
          ? ({ '--reveal-y': '28px', '--reveal-delay': `${(i % 3) * 0.08}s` } as CSSProperties)
          : undefined
      }
      onTouchStart={onImgTouchStart}
      onTouchMove={onImgTouchMove}
      onTouchEnd={onImgTouchEnd}
      className={`group @container relative flex min-h-0 flex-col overflow-hidden rounded-card border bg-sv-surface shadow-card transition-[transform,box-shadow] duration-500 [@media(hover:hover)]:hover:-translate-y-1.5 [@media(hover:hover)]:hover:shadow-card-hover ${sizeClass} ${
        l.highlighted
          ? 'border-sv-blue/45 ring-2 ring-sv-blue/25'
          : 'border-sv-ink/[0.06]'
      }`}
    >
      {imageBlock}
      {bodyBlock}
    </article>
  )
}
