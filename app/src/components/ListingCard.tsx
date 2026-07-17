'use client'

import { useId } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, BedDouble, Bath, Ruler, MapPin, Eye, Crown, Flame } from 'lucide-react'
import type { Listing } from '@/data/listings'
import { formatListingPrice, formatPerM2, formatViews, formatFloor } from '@/data/listings'
import { useFavorites } from '@/lib/favorites'
import { useI18n } from '@/lib/i18n/context'
import { BRAND } from '@/lib/brand'

/* VIP badge system — locked in BRAND.vipTiers, consumed here (BRAND.md §8) */
export const BADGE_STYLE: Record<NonNullable<Listing['badge']>, string> = {
  'SUPER VIP': BRAND.vipTiers['SUPER VIP'].style,
  'VIP+': BRAND.vipTiers['VIP+'].style,
  VIP: BRAND.vipTiers.VIP.style,
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
  const fav = has(l.id)

  const favButton = (
    <button
      aria-label={fav ? t('detail.removeFavorite') : t('detail.addFavorite')}
      aria-pressed={fav}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle(l.id)
      }}
      className={`absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full backdrop-blur transition-all duration-300 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-blue ${
        fav
          ? 'bg-sv-surface text-sv-orange'
          : 'bg-white/90 text-sv-navy hover:bg-sv-surface hover:text-sv-orange'
      }`}
    >
      <Heart className={`h-4 w-4 ${fav ? 'fill-current' : ''}`} />
    </button>
  )

  const imageBlock = (
    <div className={`relative overflow-hidden ${layout === 'list' ? 'aspect-[4/3] w-full sm:aspect-auto sm:h-full sm:min-h-[220px] sm:w-[300px] sm:shrink-0' : 'aspect-[4/3]'}`}>
      <Image
        src={l.img}
        alt={l.title}
        fill
        sizes="(max-width:640px) 86vw, 380px"
        priority={i === 0}
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-sv-navy/70 via-transparent to-sv-navy/10" />
      {l.badge && (
        <span className={`absolute left-4 top-4 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-black tracking-wider ${BADGE_STYLE[l.badge]}`}>
          {l.badge === 'SUPER VIP' ? <Crown className="h-3.5 w-3.5" /> : <Flame className="h-3.5 w-3.5" />}
          {l.badge}
        </span>
      )}
      {favButton}
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
        <div>
          <div className="text-[24px] font-black tracking-tight text-white [text-shadow:0_2px_10px_rgba(5,11,38,0.55)]">{formatListingPrice(l)}</div>
          {/* perM2 only meaningful for sale; rent/daily are priced per period */}
          {l.dealType === 'sale' && <div className="text-[12px] font-bold text-white/75">{formatPerM2(l)}</div>}
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
        <Link
          href={`/listing/${l.id}`}
          aria-label={l.title}
          className="rounded-sm after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
        >
          {l.title}
        </Link>
      </h3>
      <p className="mt-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-sv-ink/50">
        <MapPin className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{l.address}</span>
      </p>
      <div className="mt-4 flex items-center gap-4 border-t border-sv-ink/[0.06] pt-4 text-[13px] font-bold text-sv-ink/70">
        <span className="flex items-center gap-1.5"><BedDouble className="h-4 w-4 text-sv-ink/40" /> {l.beds > 0 ? l.beds : '—'}</span>
        <span className="flex items-center gap-1.5"><Bath className="h-4 w-4 text-sv-ink/40" /> {l.baths > 0 ? l.baths : '—'}</span>
        <span className="flex items-center gap-1.5"><Ruler className="h-4 w-4 text-sv-ink/40" /> {l.area} მ²</span>
        <span className="ml-auto text-sv-ink/45">{formatFloor(l)}</span>
      </div>
      {/* AI score */}
      <div className="mt-4 flex items-center gap-3 rounded-module bg-gradient-to-r from-sv-blue/[0.07] to-sv-violet/[0.07] p-3 ring-1 ring-inset ring-sv-blue/15">
        <AIScoreRing score={l.ai.score} />
        <div className="min-w-0">
          <div className="text-[11px] font-black uppercase tracking-wider text-sv-blue">{t('detail.aiScore')}</div>
          <div className="truncate text-[13px] font-extrabold text-sv-ink">{l.ai.label}</div>
        </div>
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
      className={`group relative flex flex-col overflow-hidden rounded-card border border-sv-ink/[0.06] bg-sv-surface shadow-card transition-all duration-500 hover:-translate-y-2 hover:shadow-card-hover ${sizeClass}`}
    >
      {imageBlock}
      {bodyBlock}
    </motion.article>
  )
}
