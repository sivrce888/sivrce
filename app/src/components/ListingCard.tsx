'use client'

import { useId, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import LocalizedLink from '@/components/LocalizedLink'
import {
  Heart, BedDouble, Bath, Ruler, MapPin, Crown, Flame, Share2, Zap,
  Waves, Bath as BathTub, PartyPopper, Palmtree, KeyRound, PawPrint, MountainSnow, Laptop,
  TrendingDown, TrainFront, CircleDot, Columns2, ChevronLeft, ChevronRight, Camera, Clock,
  type LucideIcon,
} from 'lucide-react'
import type { Listing } from '@/data/listings'
import { formatPerM2, formatFloor, postedDaysAgo } from '@/data/listings'
import { listingPath } from '@/lib/listing-slug'
import { listingPublicId } from '@/lib/listing-public-id'
import { streetHrefForListing } from '@/lib/street-href'
import { useCurrency } from '@/lib/currency'
import { useFavorites } from '@/lib/favorites'
import { useCompare } from '@/lib/compare'
import { useI18n } from '@/lib/i18n/context'
import { BRAND } from '@/lib/brand'
import { blurProps } from '@/lib/media'
import { DAILY_SIGNAL_KEYS, pickDailySignals } from '@/lib/features'
import { formatMetroDist, nearestMetro } from '@/lib/map/pois'

/* Icon map for card overlays — mirrors Collections.tsx */
const SIGNAL_ICON: Record<(typeof DAILY_SIGNAL_KEYS)[number], LucideIcon> = {
  'add.f.pool': Waves,
  'add.f.jacuzzi': BathTub,
  'add.f.partiesAllowed': PartyPopper,
  'add.f.beachfront': Palmtree,
  'add.f.selfCheckIn': KeyRound,
  'add.f.petsAllowed': PawPrint,
  'add.f.skiAccess': MountainSnow,
  'add.f.workspace': Laptop,
}

/* VIP badge system — locked in BRAND.vipTiers, consumed here (BRAND.md §8) */
export const BADGE_STYLE: Record<NonNullable<Listing['badge']>, string> = {
  'SUPER VIP': BRAND.vipTiers['SUPER VIP'].style,
  'VIP+': BRAND.vipTiers['VIP+'].style,
  VIP: BRAND.vipTiers.VIP.style,
}

/** Paid stickers only — amenities stay free features; owner is seller-card truth, not a chip. */
export function ListingStickerStack({
  urgent,
  priceDrop,
  inStory,
  className = '',
  size = 'sm',
}: {
  urgent?: boolean
  priceDrop?: boolean
  inStory?: boolean
  className?: string
  size?: 'sm' | 'md'
}) {
  const { t } = useI18n()
  if (!urgent && !priceDrop && !inStory) return null
  const pad = size === 'md' ? 'px-3 py-1.5 text-[11px]' : 'px-2.5 py-1 text-[10px]'
  const icon = size === 'md' ? 'h-3.5 w-3.5' : 'h-3 w-3'
  return (
    <div className={`flex flex-col items-start gap-1 ${className}`}>
      {inStory ? (
        <span className={`flex items-center gap-1 rounded-full bg-gradient-to-r from-sv-violet to-sv-blue font-black tracking-wide text-white shadow-glow-blue-sm ${pad}`}>
          <CircleDot className={icon} aria-hidden />
          {t('sticker.story')}
        </span>
      ) : null}
      {urgent ? (
        <span className={`flex items-center gap-1 rounded-full bg-gradient-to-r from-sv-orange to-sv-orange-deep font-black tracking-wide text-white shadow-glow-orange ${pad}`}>
          <Zap className={icon} aria-hidden />
          {t('sticker.urgent')}
        </span>
      ) : null}
      {priceDrop ? (
        <span className={`flex items-center gap-1 rounded-full bg-sv-navy/90 font-black tracking-wide text-white backdrop-blur ${pad}`}>
          <TrendingDown className={icon} aria-hidden />
          {t('sticker.priceDrop')}
        </span>
      ) : null}
    </div>
  )
}

function AIScoreRing({ score, size = 36 }: { score: number; size?: number }) {
  const gradId = useId()
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 36 36" className="-rotate-90" style={{ width: size, height: size }}>
        <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--sv-blue)" strokeOpacity="0.15" strokeWidth="3.5" />
        <circle
          cx="18" cy="18" r="15.5" fill="none" stroke={`url(#${gradId})`} strokeWidth="3.5"
          strokeLinecap="round" strokeDasharray={`${(score / 100) * 97.4} 97.4`}
        />
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--sv-blue)" />
            <stop offset="100%" stopColor="var(--sv-violet)" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute text-[10px] font-black text-sv-blue">{score}</span>
    </div>
  )
}

interface ListingCardProps {
  l: Listing
  i?: number
  /** grid (default, fixed scroller width) | wide (fills grid cell) | list (horizontal) */
  layout?: 'grid' | 'wide' | 'list'
  animate?: boolean
}

/** Card gallery teaser — rest of photos live on the listing detail page (myhome/ss pattern). */
const CARD_PHOTO_CAP = 4

function postedLabel(days: number): string {
  if (days <= 0) return 'დღეს'
  if (days === 1) return '1 დღის წინ'
  if (days < 7) return `${days} დღის წინ`
  const weeks = Math.ceil(days / 7)
  return weeks === 1 ? '1 კვირის წინ' : `${weeks} კვირის წინ`
}

export default function ListingCard({ l, i = 0, layout = 'grid', animate = true }: ListingCardProps) {
  const { has, toggle } = useFavorites()
  const { has: inCompare, toggle: toggleCompare, full: compareFull } = useCompare()
  const { t } = useI18n()
  const { format, currency } = useCurrency()
  const fav = has(l.id)
  const compared = inCompare(l.id)
  const lifestyle = l.dealType === 'daily' ? pickDailySignals(l.features) : []
  const metro = nearestMetro(l.coords.lat, l.coords.lng)

  // ponytail: first 4 only; full gallery on detail. Cap here so search payloads can stay fat.
  const photos = (l.images.length > 0 ? l.images : [l.img]).slice(0, CARD_PHOTO_CAP)
  const totalPhotos = Math.max(l.images.length, photos.length)
  const [photo, setPhoto] = useState(0)
  const photoSrc = photos[Math.min(photo, photos.length - 1)] ?? l.img
  const multi = photos.length > 1
  const imgRef = useRef<HTMLDivElement>(null)
  const touchRef = useRef<{ x: number; y: number } | null>(null)
  const axisLock = useRef<'h' | 'v' | null>(null)
  const swipedRef = useRef(false)

  const priceGEL = l.priceGEL
  const suffix = l.dealType === 'rent' ? t('detail.perMonth') : l.dealType === 'daily' ? t('detail.perDay') : ''
  const displayPrice = `${format(priceGEL)}${suffix}`

  const navPhoto = (dir: number, e: React.SyntheticEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setPhoto((p) => (p + dir + photos.length) % photos.length)
  }

  const onImgTouchStart = (e: React.TouchEvent) => {
    if (!multi || !imgRef.current) return
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
    if (navigator.share) {
      navigator.share({ title: l.title, text: l.title, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).catch(() => {})
    }
  }

  const favButton = (
    <div className="absolute right-3 top-3 z-10 flex gap-1.5">
      <button
        aria-label={t('detail.share')}
        onClick={handleShare}
        className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-sv-navy shadow-sm backdrop-blur transition-all duration-300 hover:scale-110 hover:bg-sv-surface hover:text-sv-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-blue"
      >
        <Share2 className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        aria-label={compared ? 'Remove from compare' : compareFull ? 'Compare full (max 4)' : 'Add to compare'}
        aria-pressed={compared}
        disabled={!compared && compareFull}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          toggleCompare(l.id)
        }}
        className={`grid h-9 w-9 place-items-center rounded-full shadow-sm backdrop-blur transition-all duration-300 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-blue disabled:cursor-not-allowed disabled:opacity-40 ${
          compared
            ? 'bg-sv-surface text-sv-blue'
            : 'bg-white/90 text-sv-navy hover:bg-sv-surface hover:text-sv-blue'
        }`}
      >
        <Columns2 className={`h-3.5 w-3.5 ${compared ? 'stroke-[2.5]' : ''}`} />
      </button>
      <button
        aria-label={fav ? t('detail.removeFavorite') : t('detail.addFavorite')}
        aria-pressed={fav}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          toggle(l.id)
        }}
        className={`grid h-9 w-9 place-items-center rounded-full shadow-sm backdrop-blur transition-all duration-300 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-blue ${
          fav
            ? 'bg-sv-surface text-sv-orange'
            : 'bg-white/90 text-sv-navy hover:bg-sv-surface hover:text-sv-orange'
        }`}
      >
        <Heart className={`h-3.5 w-3.5 ${fav ? 'fill-current' : ''}`} />
      </button>
    </div>
  )

  const imageBlock = (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${layout === 'list' ? 'aspect-[4/3] w-full sm:aspect-auto sm:h-full sm:min-h-[200px] sm:w-[280px] sm:shrink-0' : 'aspect-[4/3]'}`}
    >
      <Image
        key={photoSrc}
        src={photoSrc}
        alt={l.title}
        fill
        sizes="(max-width:640px) 86vw, (max-width:1280px) 44vw, 440px"
        priority={i === 0 && photo === 0}
        className={`object-cover transition-transform duration-700 ease-out ${multi ? '' : 'group-hover:scale-[1.04]'}`}
        {...blurProps(photoSrc)}
      />
      {/* Soft scrub — price lives in body (ss/myhome scan pattern) */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-sv-navy/25 via-transparent to-sv-navy/35" />
      {l.badge && (
        <span className={`absolute left-3 top-3 z-[1] flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black tracking-wider ${BADGE_STYLE[l.badge]}`}>
          {l.badge === 'SUPER VIP' ? <Crown className="h-3 w-3" /> : <Flame className="h-3 w-3" />}
          {l.badge}
        </span>
      )}
      {l.projectCatalog && !l.badge && (
        <span className="absolute left-3 top-3 z-[1] rounded-full bg-sv-navy/85 px-2.5 py-1 text-[10px] font-black tracking-wider text-white backdrop-blur">
          პროექტი
        </span>
      )}
      <ListingStickerStack
        urgent={l.stickerUrgent}
        priceDrop={l.stickerPriceDrop}
        inStory={l.inStory}
        className={`absolute left-3 z-[1] ${l.badge || l.projectCatalog ? 'top-12' : 'top-3'}`}
      />
      {favButton}
      {/* Edge zones clear top actions (fav/share) — full-height zones ate those hits */}
      {multi && (
        <>
          <button
            type="button"
            aria-label={t('detail.prevPhoto')}
            onClick={(e) => navPhoto(-1, e)}
            className="absolute bottom-0 left-0 top-12 z-10 flex w-[24%] items-center justify-start bg-transparent pl-1.5 focus-visible:outline-none"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-sv-navy shadow-sm backdrop-blur opacity-70 transition-opacity group-hover:opacity-100 max-md:opacity-80 md:opacity-0 md:group-hover:opacity-100">
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </span>
          </button>
          <button
            type="button"
            aria-label={t('detail.nextPhoto')}
            onClick={(e) => navPhoto(1, e)}
            className="absolute bottom-0 right-0 top-12 z-10 flex w-[24%] items-center justify-end bg-transparent pr-1.5 focus-visible:outline-none"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-sv-navy shadow-sm backdrop-blur opacity-70 transition-opacity group-hover:opacity-100 max-md:opacity-80 md:opacity-0 md:group-hover:opacity-100">
              <ChevronRight className="h-4 w-4" aria-hidden />
            </span>
          </button>
          <div className="pointer-events-none absolute bottom-3 left-1/2 z-[1] flex -translate-x-1/2 items-center gap-1.5">
            {photos.map((_, idx) => (
              <span
                key={idx}
                aria-hidden
                className={`h-1.5 rounded-full transition-all ${
                  photo === idx ? 'w-3.5 bg-white' : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
            {totalPhotos > CARD_PHOTO_CAP && (
              <span className="ml-0.5 rounded-full bg-sv-navy/55 px-1.5 py-0.5 text-[10px] font-black text-white backdrop-blur">
                +{totalPhotos - CARD_PHOTO_CAP}
              </span>
            )}
          </div>
        </>
      )}
      {lifestyle.length > 0 && (
        <div className="absolute bottom-10 left-3 z-[1] flex max-w-[70%] flex-wrap gap-1">
          {lifestyle.map((key) => {
            const Icon = SIGNAL_ICON[key]
            return (
              <span
                key={key}
                className="flex max-w-full items-center gap-1 rounded-full bg-sv-navy/60 px-2 py-0.5 text-[10px] font-extrabold text-white backdrop-blur"
              >
                <Icon className="h-3 w-3 shrink-0" aria-hidden />
                <span className="truncate">{t(key)}</span>
              </span>
            )
          })}
        </div>
      )}
      {/* Photo count — always visible (ss.ge/myhome parity) */}
      {totalPhotos > 0 && (
        <span className="absolute bottom-3 right-3 z-[1] flex items-center gap-1 rounded-full bg-sv-navy/60 px-2 py-1 text-[11px] font-bold text-white backdrop-blur">
          <Camera className="h-3 w-3" aria-hidden />
          {multi ? `${photo + 1}/${totalPhotos}` : totalPhotos}
        </span>
      )}
    </div>
  )

  const streetHref = streetHrefForListing(l.address, l.district, l.city)
  const publicId = listingPublicId(l)
  const days = postedDaysAgo(l)
  // District sometimes already embeds the city (project catalog addresses).
  const place = l.district && l.city && l.district.includes(l.city)
    ? l.district
    : [l.district, l.city].filter(Boolean).join(', ')
  const href = l.projectCatalog && l.projectSlug ? `/projects/${l.projectSlug}` : listingPath(l)

  const bodyBlock = (
    <div className="flex min-w-0 flex-1 flex-col p-4">
      {/* Price first — scannable like ss.ge / myhome */}
      <div className="text-[22px] font-black tracking-tight text-sv-ink">{displayPrice}</div>
      {l.dealType === 'sale' && l.perM2USD > 0 && (
        <p className="mt-0.5 text-[13px] font-bold text-sv-ink/50">{formatPerM2(l, currency)}</p>
      )}

      <h3 className="mt-2.5 line-clamp-2 text-[15px] font-extrabold leading-snug text-sv-ink transition-colors group-hover:text-sv-blue">
        <LocalizedLink
          href={href}
          aria-label={l.title}
          onClick={(e) => {
            if (swipedRef.current) {
              e.preventDefault()
              swipedRef.current = false
            }
          }}
          className="rounded-sm after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
        >
          {l.title}
        </LocalizedLink>
      </h3>

      <p className="relative z-10 mt-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-sv-ink/50">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-sv-blue" aria-hidden />
        {streetHref ? (
          <LocalizedLink
            href={streetHref}
            className="truncate text-sv-blue hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {place || l.address}
          </LocalizedLink>
        ) : (
          <span className="truncate">{place || l.address}</span>
        )}
      </p>

      {metro && (
        <p className="mt-1 flex items-center gap-1.5 text-[12px] font-bold text-sv-blue">
          <TrainFront className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">
            {metro.name} · {formatMetroDist(metro)}
          </span>
        </p>
      )}

      {/* Key stats — omit unknowns (project catalog often has no beds/floor) */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] font-bold text-sv-ink/70">
        {l.area > 0 && (
          <span className="flex items-center gap-1">
            <Ruler className="h-3.5 w-3.5 text-sv-ink/40" aria-hidden />
            {l.projectCatalog ? `${l.area} მ²-დან` : `${l.area} მ²`}
          </span>
        )}
        {(l.beds > 0 || l.rooms > 0) && (
          <span className="flex items-center gap-1">
            <BedDouble className="h-3.5 w-3.5 text-sv-ink/40" aria-hidden />
            {l.beds > 0 ? l.beds : l.rooms}
          </span>
        )}
        {l.baths > 0 && (
          <span className="flex items-center gap-1">
            <Bath className="h-3.5 w-3.5 text-sv-ink/40" aria-hidden />
            {l.baths}
          </span>
        )}
        {!l.projectCatalog && (l.floor > 0 || l.totalFloors > 0) && (
          <span className="text-sv-ink/45">{formatFloor(l)}</span>
        )}
      </div>

      {/* AI — compact differentiator (competitors don't have this on cards) */}
      <div className="mt-3 flex items-center gap-2.5 rounded-module bg-gradient-to-r from-sv-blue/[0.06] to-sv-violet/[0.06] px-2.5 py-2 ring-1 ring-inset ring-sv-blue/12">
        <AIScoreRing score={l.ai.score} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-extrabold text-sv-ink">{l.ai.label || t('detail.aiScore')}</div>
        </div>
        {l.isNew && (
          <span className="shrink-0 rounded-full bg-sv-orange/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-sv-orange">
            ახალი
          </span>
        )}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 text-[12px] font-semibold text-sv-ink/40">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" aria-hidden />
          {postedLabel(days)}
        </span>
        <span className="font-mono text-[10px] font-black tabular-nums text-sv-ink/30">ID {publicId}</span>
      </div>
    </div>
  )

  const sizeClass =
    layout === 'grid'
      ? 'w-[86vw] max-w-[400px] shrink-0 sm:w-[380px]'
      : layout === 'list'
        ? 'w-full flex-col sm:flex-row'
        : 'w-full'

  return (
    <motion.article
      initial={animate ? { opacity: 0, y: 28 } : false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.7, delay: (i % 3) * 0.08, ease: [0.21, 0.65, 0.2, 1] }}
      onTouchStart={onImgTouchStart}
      onTouchMove={onImgTouchMove}
      onTouchEnd={onImgTouchEnd}
      className={`group relative flex flex-col overflow-hidden rounded-card border bg-sv-surface shadow-card transition-all duration-500 hover:-translate-y-1.5 hover:shadow-card-hover ${sizeClass} ${
        l.highlighted
          ? 'border-sv-blue/45 ring-2 ring-sv-blue/25'
          : 'border-sv-ink/[0.06]'
      }`}
    >
      {imageBlock}
      {bodyBlock}
    </motion.article>
  )
}
