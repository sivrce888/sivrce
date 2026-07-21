'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import LocalizedLink from '@/components/LocalizedLink'
import {
  Heart, BedDouble, Bath, Ruler, MapPin, Crown, Flame, Share2, Zap,
  Waves, Bath as BathTub, PartyPopper, Palmtree, KeyRound, PawPrint, MountainSnow, Laptop,
  TrendingDown, TrainFront, CircleDot, Columns2, ChevronLeft, ChevronRight, Images, Clock,
  Layers,
  type LucideIcon,
} from 'lucide-react'
import type { Listing } from '@/data/listings'
import { formatPerM2, formatFloor, postedDaysAgo } from '@/data/listings'
import { listingPath } from '@/lib/listing-slug'
import { listingPublicId } from '@/lib/listing-public-id'
import { streetHrefForListing } from '@/lib/street-href'
import { useCurrency, formatListingPrice } from '@/lib/currency'
import { useFavorites } from '@/lib/favorites'
import { useCompare } from '@/lib/compare'
import { useI18n } from '@/lib/i18n/context'
import { BRAND } from '@/lib/brand'
import { blurProps } from '@/lib/media'
import { photoIndexFromX } from '@/lib/photo-index-from-x'
import { cardGalleryTeaser } from '@/lib/card-gallery-teaser'
import { DAILY_SIGNAL_KEYS, pickDailySignals } from '@/lib/features'
import { formatMetroDist, nearestMetro } from '@/lib/map/pois'
import { SparkMark } from '@/components/SparkMark'

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

interface ListingCardProps {
  l: Listing
  i?: number
  /** grid (default, fixed scroller width) | wide (fills grid cell) | list (horizontal) */
  layout?: 'grid' | 'wide' | 'list'
  animate?: boolean
}

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
  const { currency, rate } = useCurrency()
  const fav = has(l.id)
  const compared = inCompare(l.id)
  const lifestyle = l.dealType === 'daily' ? pickDailySignals(l.features) : []
  const metro = nearestMetro(l.coords.lat, l.coords.lng)

  // ponytail: first N only; full gallery on detail. Cap here so search payloads can stay fat.
  const { photos, morePhotos, multi, dashSlots } = cardGalleryTeaser(l.images, l.img)
  const [photo, setPhoto] = useState(0)
  const imgRef = useRef<HTMLDivElement>(null)
  const touchRef = useRef<{ x: number; y: number } | null>(null)
  const axisLock = useRef<'h' | 'v' | null>(null)
  const swipedRef = useRef(false)

  const priceObj = formatListingPrice({
    priceUSD: l.priceUSD,
    priceGEL: l.priceGEL,
    priceOriginal: l.priceOriginal,
    currencyOriginal: l.currencyOriginal,
    currencyPreference: currency,
    rate,
  })
  const suffix = l.dealType === 'rent' ? t('detail.perMonth') : l.dealType === 'daily' ? t('detail.perDay') : ''
  const displayPrice = `${priceObj.primary}${suffix}`
  const displaySecondaryPrice = priceObj.secondary

  const navPhoto = (dir: number, e: React.SyntheticEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setPhoto((p) => (p + dir + photos.length) % photos.length)
  }

  // Hover scrub (fine pointer only) — move across photo = flip frames. Touch keeps swipe.
  const onImgPointerMove = (e: React.PointerEvent) => {
    if (!multi || e.pointerType !== 'mouse' || !imgRef.current) return
    // Don't fight share/heart/chevrons/segments
    if ((e.target as HTMLElement).closest('button')) return
    const r = imgRef.current.getBoundingClientRect()
    if (r.width <= 0) return
    const next = photoIndexFromX((e.clientX - r.left) / r.width, photos.length)
    setPhoto((p) => (p === next ? p : next))
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

  // Always visible — hover-hide made chrome look "missing" on desktop
  const actionBtn =
    'grid h-8 w-8 place-items-center rounded-full bg-white/90 text-sv-navy shadow-sm backdrop-blur transition-all duration-300 hover:scale-110 hover:bg-sv-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-blue'

  const imageBlock = (
    <div
      ref={imgRef}
      // z-[1] keeps chrome above the title's full-card ::after hit layer
      className={`relative z-[1] overflow-hidden ${layout === 'list' ? 'aspect-[4/3] w-full sm:aspect-auto sm:h-full sm:min-h-[200px] sm:w-[280px] sm:shrink-0' : 'aspect-[4/3]'}`}
      onPointerMove={onImgPointerMove}
    >
      {/* Stacked frames — instant scrub, no flash (Yandex / Zillow pattern) */}
      {photos.map((src, idx) => (
        <Image
          key={`${src}-${idx}`}
          src={src}
          alt={idx === photo ? l.title : ''}
          fill
          sizes="(max-width:640px) 86vw, (max-width:1280px) 44vw, 440px"
          priority={i === 0 && idx === 0}
          aria-hidden={idx !== photo}
          className={`object-cover transition-[opacity,transform] duration-300 ease-out motion-reduce:duration-0 ${
            idx === photo ? 'opacity-100' : 'pointer-events-none opacity-0'
          } ${!multi && idx === photo ? 'group-hover:scale-[1.04]' : ''}`}
          {...blurProps(src)}
        />
      ))}
      {/* Bottom scrub only — lets the photo breathe; navy-tint per brand lock */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-sv-navy/45 via-sv-navy/10 to-transparent" />
      {/* ── Photo chrome map ───────────────────────────────────────────
          TL: VIP / stickers
          TR: share · compare · heart
          Mid: ‹ › chevrons (hover / touch)
          Bottom: fixed - - - - · +N all-photos (overflow)
      */}
      {l.badge && (
        <span className={`absolute left-3 top-4 z-20 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black tracking-wider shadow-sm ${BADGE_STYLE[l.badge]}`}>
          {l.badge === 'SUPER VIP' ? <Crown className="h-3 w-3" /> : <Flame className="h-3 w-3" />}
          {l.badge}
        </span>
      )}
      {l.projectCatalog && !l.badge && (
        <span className="absolute left-3 top-4 z-20 rounded-full bg-sv-navy/85 px-2.5 py-1 text-[10px] font-black tracking-wider text-white shadow-sm backdrop-blur">
          პროექტი
        </span>
      )}
      <ListingStickerStack
        urgent={l.stickerUrgent}
        priceDrop={l.stickerPriceDrop}
        inStory={l.inStory}
        className={`absolute left-3 z-20 ${l.badge || l.projectCatalog ? 'top-14' : 'top-4'}`}
      />

      <div className="absolute right-3 top-4 z-20 flex gap-1.5">
        <button
          type="button"
          aria-label={t('detail.share')}
          onClick={handleShare}
          className={`${actionBtn} hover:text-sv-blue`}
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
          className={`${actionBtn} disabled:cursor-not-allowed disabled:opacity-40 ${
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
          <Heart className={`h-3.5 w-3.5 ${fav ? 'fill-current' : ''}`} />
        </button>
      </div>

      {multi && (
        <>
          {/* Chevrons: icon-only hit target so hover-scrub works edge-to-edge */}
          <button
            type="button"
            aria-label={t('detail.prevPhoto')}
            onClick={(e) => navPhoto(-1, e)}
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 opacity-100 transition-opacity focus-visible:outline-none [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-sv-navy/55 text-white shadow-sm backdrop-blur">
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
            </span>
          </button>
          <button
            type="button"
            aria-label={t('detail.nextPhoto')}
            onClick={(e) => navPhoto(1, e)}
            className="absolute right-1.5 top-1/2 z-10 -translate-y-1/2 opacity-100 transition-opacity focus-visible:outline-none [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-sv-navy/55 text-white shadow-sm backdrop-blur">
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </span>
          </button>
        </>
      )}

      {/* Bottom: fixed - - - - (CARD_PHOTO_CAP) + MyHome-style +N overflow */}
      {/* Bottom: fixed - - - - · +N. ponytail: only live CSS utils (fractionals ghost under turbopack) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex flex-col items-center gap-1.5 px-2.5">
        {morePhotos > 0 && (
          <span className="pointer-events-auto flex items-center gap-1 rounded-full bg-sv-navy/70 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-sm backdrop-blur">
            <Images className="h-3 w-3" aria-hidden />
            {t('card.allPhotos', { n: morePhotos })}
          </span>
        )}
        {multi && (
          <div
            className="pointer-events-auto flex w-32 gap-1.5"
            role="tablist"
            aria-label={t('detail.photoViewer')}
          >
            {Array.from({ length: dashSlots }, (_, idx) => {
              const live = idx < photos.length
              return (
                <button
                  key={idx}
                  type="button"
                  role="tab"
                  disabled={!live}
                  aria-disabled={!live}
                  aria-selected={live && photo === idx}
                  aria-label={live ? t('detail.photo', { n: idx + 1 }) : undefined}
                  onClick={(e) => {
                    if (!live) return
                    e.preventDefault()
                    e.stopPropagation()
                    setPhoto(idx)
                  }}
                  className="h-1 min-w-0 flex-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:pointer-events-none"
                >
                  <span
                    aria-hidden
                    className={`block h-full rounded-full transition-colors ${
                      !live
                        ? 'bg-white/20'
                        : photo === idx
                          ? 'bg-white shadow-sm'
                          : 'bg-white/50'
                    }`}
                  />
                </button>
              )
            })}
          </div>
        )}
      </div>

      {lifestyle.length > 0 && (
        <div className={`absolute left-3 z-10 flex max-w-[70%] flex-wrap gap-1 ${multi || morePhotos > 0 ? 'bottom-24' : 'bottom-4'}`}>
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

  const showPerM2 = l.dealType === 'sale' && l.perM2USD > 0

  const bodyBlock = (
    <div className="flex min-w-0 flex-1 flex-col p-4 pt-3.5">
      {/* Price first — scannable like ss.ge / myhome with locked nominal currency */}
      <div className="flex items-baseline gap-2 text-[22px] font-black tabular-nums tracking-[-0.03em] text-sv-ink">
        <span>{displayPrice}</span>
        <span className="text-[13px] font-semibold text-sv-ink/45">{displaySecondaryPrice}</span>
      </div>
      {/* ponytail: reserved slot so rent/daily cards match sale height */}
      <p
        className={`mt-0.5 min-h-[1.25rem] text-[13px] font-bold tabular-nums text-sv-ink/45 ${showPerM2 ? '' : 'invisible'}`}
        aria-hidden={!showPerM2}
      >
        {showPerM2 ? formatPerM2(l, currency) : '\u00a0'}
      </p>

      <h3 className="mt-2.5 line-clamp-2 min-h-[2.7em] text-[15px] font-extrabold leading-[1.35] text-sv-ink transition-colors group-hover:text-sv-blue">
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

      <p className="relative z-10 mt-1.5 flex min-w-0 items-center gap-1.5 text-[13px] font-semibold text-sv-ink/50">
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

      {/* Reserved metro row — cards without metro stay same height */}
      <p
        className={`mt-1 flex min-h-[1.25rem] min-w-0 items-center gap-1.5 text-[12px] font-bold text-sv-blue ${metro ? '' : 'invisible'}`}
        aria-hidden={!metro}
      >
        <TrainFront className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1 truncate">{metro?.name ?? '\u00a0'}</span>
        <span className="shrink-0 font-semibold text-sv-blue/75">
          · {metro ? formatMetroDist(metro) : '\u00a0'}
        </span>
      </p>

      {/* Specs + AI + meta pinned to bottom — equal card heights in rails */}
      <div className="mt-auto pt-3">
        {/* ponytail: 4 reserved slots — conditional hide made rails look 2-vs-3 jagged */}
        <div className="grid min-h-[1.5rem] grid-cols-4 gap-x-2 overflow-hidden border-t border-sv-ink/[0.06] pt-3 text-[13px] font-bold text-sv-ink/70">
          <span className={`flex min-w-0 items-center gap-1 ${l.area > 0 ? '' : 'invisible'}`} aria-hidden={l.area <= 0}>
            <Ruler className="h-3.5 w-3.5 shrink-0 text-sv-ink/40" aria-hidden />
            <span className="truncate">{l.projectCatalog ? `${l.area} მ²-დან` : `${l.area} მ²`}</span>
          </span>
          <span
            className={`flex min-w-0 items-center gap-1 ${(l.beds > 0 || l.rooms > 0) ? '' : 'invisible'}`}
            aria-hidden={l.beds <= 0 && l.rooms <= 0}
          >
            <BedDouble className="h-3.5 w-3.5 shrink-0 text-sv-ink/40" aria-hidden />
            {l.beds > 0 ? l.beds : l.rooms}
          </span>
          <span className={`flex min-w-0 items-center gap-1 ${l.baths > 0 ? '' : 'invisible'}`} aria-hidden={l.baths <= 0}>
            <Bath className="h-3.5 w-3.5 shrink-0 text-sv-ink/40" aria-hidden />
            {l.baths}
          </span>
          <span
            className={`flex min-w-0 items-center gap-1 text-sv-ink/55 ${
              !l.projectCatalog && (l.floor > 0 || l.totalFloors > 0) ? '' : 'invisible'
            }`}
            aria-hidden={l.projectCatalog || (l.floor <= 0 && l.totalFloors <= 0)}
          >
            <Layers className="h-3.5 w-3.5 shrink-0 text-sv-ink/40" aria-hidden />
            <span className="truncate">{formatFloor(l)}</span>
          </span>
        </div>

        {/* ponytail: Spark + score, no gradient AI chrome box */}
        <div className="mt-2.5 flex min-h-[1.5rem] items-center gap-2">
          <SparkMark className="h-3.5 w-3.5 shrink-0" />
          <span className="shrink-0 text-[13px] font-black tabular-nums tracking-tight text-sv-ink">
            {l.ai.score}
          </span>
          <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-sv-ink/50">
            {l.ai.label || t('detail.aiScore')}
          </span>
          {l.isNew && (
            <span className="shrink-0 rounded-full bg-sv-orange/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-sv-orange">
              ახალი
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 text-[12px] font-semibold text-sv-ink/40">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" aria-hidden />
            {postedLabel(days)}
          </span>
          <span className="min-w-0 truncate font-mono text-[10px] font-black tabular-nums text-sv-ink/28">
            ID {publicId}
          </span>
        </div>
      </div>
    </div>
  )

  const sizeClass =
    layout === 'grid'
      ? 'w-[86vw] max-w-[400px] shrink-0 sm:w-[380px]'
      : layout === 'list'
        ? 'w-full flex-col sm:flex-row'
        : 'h-full w-full'

  return (
    <motion.article
      initial={animate ? { opacity: 0, y: 28 } : false}
      whileInView={animate ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.7, delay: (i % 3) * 0.08, ease: [0.21, 0.65, 0.2, 1] }}
      onTouchStart={onImgTouchStart}
      onTouchMove={onImgTouchMove}
      onTouchEnd={onImgTouchEnd}
      className={`group relative flex min-h-0 flex-col self-stretch overflow-hidden rounded-card border bg-sv-surface shadow-card transition-all duration-500 hover:-translate-y-1.5 hover:shadow-card-hover ${sizeClass} ${
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
