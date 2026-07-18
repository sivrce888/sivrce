'use client'

import { useId } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import LocalizedLink from '@/components/LocalizedLink'
import {
  Heart, BedDouble, Bath, Ruler, MapPin, Eye, Crown, Flame, Share2, TrendingUp, Zap,
  Waves, Bath as BathTub, PartyPopper, Palmtree, KeyRound, PawPrint, MountainSnow, Laptop,
  TrendingDown, TrainFront, CircleDot,
  type LucideIcon,
} from 'lucide-react'
import type { Listing } from '@/data/listings'
import { formatPerM2, formatViews, formatFloor } from '@/data/listings'
import { listingPath } from '@/lib/listing-slug'
import { useCurrency } from '@/lib/currency'
import { useFavorites } from '@/lib/favorites'
import { useI18n } from '@/lib/i18n/context'
import { BRAND } from '@/lib/brand'
import { blurProps } from '@/lib/media'
import { useSocialSignals } from '@/lib/social-proof'
import { WeatherBadge } from '@/components/WeatherBadge'
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

function AIScoreRing({ score, size = 40 }: { score: number; size?: number }) {
  // useId: gradient id must be unique per card instance (duplicate ids across cards collide)
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
      <span className="absolute text-[11px] font-black text-sv-blue">{score}</span>
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

export default function ListingCard({ l, i = 0, layout = 'grid', animate = true }: ListingCardProps) {
  const { has, toggle } = useFavorites()
  const { t } = useI18n()
  const { format, currency } = useCurrency()
  const fav = has(l.id)
  const signals = useSocialSignals(l.views, l.postedAt)
  const lifestyle = l.dealType === 'daily' ? pickDailySignals(l.features) : []
  const metro = nearestMetro(l.coords.lat, l.coords.lng)

  const priceGEL = l.priceGEL
  const suffix = l.dealType === 'rent' ? t('detail.perMonth') : l.dealType === 'daily' ? t('detail.perDay') : ''
  const displayPrice = `${format(priceGEL)}${suffix}`

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const url = `${window.location.origin}${listingPath(l)}`
    if (navigator.share) {
      navigator.share({ title: l.title, text: l.title, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).catch(() => {})
    }
  }

  const favButton = (
    <div className="absolute right-4 top-4 z-10 flex gap-2">
      <button
        aria-label={t('detail.share')}
        onClick={handleShare}
        className="grid h-11 w-11 place-items-center rounded-full bg-white/90 text-sv-navy backdrop-blur transition-all duration-300 hover:scale-110 hover:bg-sv-surface hover:text-sv-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-blue"
      >
        <Share2 className="h-4 w-4" />
      </button>
      <button
        aria-label={fav ? t('detail.removeFavorite') : t('detail.addFavorite')}
        aria-pressed={fav}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          toggle(l.id)
        }}
        className={`grid h-11 w-11 place-items-center rounded-full backdrop-blur transition-all duration-300 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-blue ${
          fav
            ? 'bg-sv-surface text-sv-orange'
            : 'bg-white/90 text-sv-navy hover:bg-sv-surface hover:text-sv-orange'
        }`}
      >
        <Heart className={`h-4 w-4 ${fav ? 'fill-current' : ''}`} />
      </button>
    </div>
  )

  const imageBlock = (
    <div className={`relative overflow-hidden ${layout === 'list' ? 'aspect-[4/3] w-full sm:aspect-auto sm:h-full sm:min-h-[220px] sm:w-[300px] sm:shrink-0' : 'aspect-[4/3]'}`}>
      <Image
        src={l.img}
        alt={l.title}
        fill
        sizes="(max-width:640px) 86vw, (max-width:1280px) 44vw, 440px"
        priority={i === 0}
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
        {...blurProps(l.img)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-sv-navy/70 via-transparent to-sv-navy/10" />
      {l.badge && (
        <span className={`absolute left-4 top-4 z-[1] flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-black tracking-wider ${BADGE_STYLE[l.badge]}`}>
          {l.badge === 'SUPER VIP' ? <Crown className="h-3.5 w-3.5" /> : <Flame className="h-3.5 w-3.5" />}
          {l.badge}
        </span>
      )}
      <ListingStickerStack
        urgent={l.stickerUrgent}
        priceDrop={l.stickerPriceDrop}
        inStory={l.inStory}
        className={`absolute left-4 z-[1] ${
          l.badge || (signals.isHot && !l.stickerUrgent) || (signals.isTrending && !l.stickerUrgent)
            ? 'top-14'
            : 'top-4'
        }`}
      />
      {signals.isHot && !l.badge && !l.stickerUrgent && !l.stickerPriceDrop && (
        <span className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-gradient-to-r from-sv-orange to-sv-orange-deep px-3 py-1 text-[11px] font-black tracking-wider text-white">
          <Zap className="h-3 w-3" /> HOT
        </span>
      )}
      {signals.isTrending && !signals.isHot && !l.badge && !l.stickerUrgent && !l.stickerPriceDrop && (
        <span className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-sv-blue/90 px-3 py-1 text-[11px] font-black tracking-wider text-white backdrop-blur">
          <TrendingUp className="h-3 w-3" /> TRENDING
        </span>
      )}
      {favButton}
      {lifestyle.length > 0 && (
        <div className="absolute bottom-[4.25rem] left-4 flex max-w-[75%] flex-wrap gap-1.5">
          {lifestyle.map((key) => {
            const Icon = SIGNAL_ICON[key]
            return (
              <span
                key={key}
                className="flex max-w-full items-center gap-1 rounded-full bg-sv-navy/60 px-2.5 py-1 text-[11px] font-extrabold text-white backdrop-blur"
              >
                <Icon className="h-3 w-3 shrink-0" aria-hidden />
                <span className="truncate">{t(key)}</span>
              </span>
            )
          })}
        </div>
      )}
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
        <div>
          <div className="text-[24px] font-black tracking-tight text-white [text-shadow:0_2px_10px_rgba(5,11,38,0.55)]">{displayPrice}</div>
          {/* perM2 only meaningful for sale; rent/daily are priced per period */}
          {l.dealType === 'sale' && <div className="text-[12px] font-bold text-white/75">{formatPerM2(l, currency)}</div>}
        </div>
        <span className="flex items-center gap-1 rounded-full bg-sv-navy/55 px-2.5 py-1 text-[11px] font-bold text-white/85 backdrop-blur">
          <Eye className="h-3 w-3" /> {formatViews(l.views)}
        </span>
      </div>
    </div>
  )

  const bodyBlock = (
    <div className="flex min-w-0 flex-1 flex-col p-5">
      <h3 className="line-clamp-1 text-[16px] font-extrabold text-sv-ink transition-colors group-hover:text-sv-blue">
        {/* stretched link: ::after covers the whole card; fav button sits above via z-10 */}
        <LocalizedLink
          href={listingPath(l)}
          aria-label={l.title}
          className="rounded-sm after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
        >
          {l.title}
        </LocalizedLink>
      </h3>
      <p className="mt-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-sv-ink/50">
        <MapPin className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{l.address}</span>
        <span className="mx-1 text-sv-ink/20" aria-hidden="true">·</span>
        <WeatherBadge city={l.city} className="text-sv-ink/40" />
      </p>
      {/* Competitors show ₾/m² in card body, not only image overlay */}
      {l.dealType === 'sale' && (
        <p className="mt-1.5 text-[13px] font-extrabold text-sv-ink/65">{formatPerM2(l, currency)}</p>
      )}
      {metro && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-bold text-sv-blue">
          <TrainFront className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">
            {metro.name} · {formatMetroDist(metro)}
          </span>
        </p>
      )}
      <div className="mt-4 flex items-center gap-4 border-t border-sv-ink/[0.06] pt-4 text-[13px] font-bold text-sv-ink/70">
        <span className="flex items-center gap-1.5"><BedDouble className="h-4 w-4 text-sv-ink/40" /> {l.beds > 0 ? l.beds : '—'}</span>
        <span className="flex items-center gap-1.5"><Bath className="h-4 w-4 text-sv-ink/40" /> {l.baths > 0 ? l.baths : '—'}</span>
        <span className="flex items-center gap-1.5"><Ruler className="h-4 w-4 text-sv-ink/40" /> {l.area} მ²</span>
        <span className="ml-auto text-sv-ink/45">{formatFloor(l)}</span>
      </div>
      {/* AI score */}
      <div className="mt-4 flex items-center gap-3 rounded-module bg-gradient-to-r from-sv-blue/[0.07] to-sv-violet/[0.07] p-3 ring-1 ring-inset ring-sv-blue/15">
        <AIScoreRing score={l.ai.score} />
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-black uppercase tracking-wider text-sv-blue">{t('detail.aiScore')}</div>
          <div className="truncate text-[13px] font-extrabold text-sv-ink">{l.ai.label}</div>
        </div>
        {/* Urgency: new listings or recently posted */}
        {l.isNew && (
          <span className="shrink-0 rounded-full bg-sv-orange/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-sv-orange">
            ახალი
          </span>
        )}
      </div>
      <div className="mt-3 text-[12px] font-semibold text-sv-ink/40">
        {signals.hoursAgo <= 24 ? 'დღეს დამატებული' : signals.hoursAgo <= 72 ? `${Math.ceil(signals.hoursAgo / 24)} დღის წინ` : `${Math.ceil(signals.hoursAgo / 168)} კვირის წინ`}
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
      className={`group relative flex flex-col overflow-hidden rounded-card border bg-sv-surface shadow-card transition-all duration-500 hover:-translate-y-2 hover:shadow-card-hover ${sizeClass} ${
        l.highlighted
          ? "border-sv-blue/45 ring-2 ring-sv-blue/25"
          : "border-sv-ink/[0.06]"
      }`}
    >
      {imageBlock}
      {bodyBlock}
    </motion.article>
  )
}
