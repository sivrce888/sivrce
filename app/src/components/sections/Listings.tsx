'use client'

import LocalizedLink from '@/components/LocalizedLink'
import { ArrowRight, Crown, Flame } from 'lucide-react'
import { Reveal } from '@/components/Reveal'
import ListingCard from '@/components/ListingCard'
import HScroll from '@/components/HScroll'
import { useI18n } from '@/lib/i18n/context'
import type { CmsBlockKey } from '@/lib/cms-blocks'
import type { Listing } from '@/data/listings'
import { homeRailSearchHref } from '@/lib/listings-home-rail'

export type ListingsRail = 'superVip' | 'vipPlus'

const RAIL: Record<
  ListingsRail,
  {
    kicker: CmsBlockKey
    title: CmsBlockKey
    sub: CmsBlockKey
    viewAll: CmsBlockKey
    scroll: CmsBlockKey
    href: string
    Icon: typeof Crown
    kickerClass: string
    sectionClass: string
  }
> = {
  superVip: {
    kicker: 'home.listings.kicker',
    title: 'home.listings.title',
    sub: 'home.listings.sub',
    viewAll: 'home.listings.viewAll',
    scroll: 'home.listings.scrollLabel',
    href: homeRailSearchHref('diamond'),
    Icon: Crown,
    kickerClass: 'bg-gradient-to-r from-sv-orange to-sv-orange-deep text-white shadow-glow-orange',
    sectionClass: 'bg-sv-surface',
  },
  vipPlus: {
    kicker: 'home.vipPlus.kicker',
    title: 'home.vipPlus.title',
    sub: 'home.vipPlus.sub',
    viewAll: 'home.vipPlus.viewAll',
    scroll: 'home.vipPlus.scrollLabel',
    href: homeRailSearchHref('super_vip'),
    Icon: Flame,
    kickerClass: 'bg-gradient-to-r from-sv-blue to-sv-violet text-white shadow-glow-blue-sm',
    sectionClass: 'bg-sv-cloud',
  },
}

export default function Listings({ items, rail }: { items: Listing[]; rail: ListingsRail }) {
  const { b } = useI18n()
  if (items.length === 0) return null
  const r = RAIL[rail]
  const Icon = r.Icon

  return (
    <section id={rail === 'superVip' ? 'super-vip' : 'vip-plus'} className={`relative overflow-hidden py-[clamp(3.5rem,2.4rem+4vw,7rem)] ${r.sectionClass}`}>
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <span className={`mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[12px] font-black uppercase tracking-wider ${r.kickerClass}`}>
              <Icon className="h-3.5 w-3.5" aria-hidden /> {b(r.kicker)}
            </span>
            <h2 className="sv-h2 text-sv-ink">
              {b(r.title)}
            </h2>
            <p className="mt-2 text-[15px] font-semibold text-sv-ink/65 md:text-[16px]">
              {b(r.sub)}
            </p>
          </div>
          <LocalizedLink
            href={r.href}
            className="group flex items-center gap-2 text-[15px] font-extrabold text-sv-blue-deep transition-colors hover:text-sv-blue-deep"
          >
            {b(r.viewAll)}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </LocalizedLink>
        </Reveal>

        <HScroll aria-label={b(r.scroll)} step={420} className="gap-6 pb-2 pt-2">
          {items.map((l, i) => (
            <ListingCard key={l.id} l={l} i={i} animate={false} />
          ))}
        </HScroll>
      </div>
    </section>
  )
}
