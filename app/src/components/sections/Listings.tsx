'use client'

import { useState } from 'react'
import LocalizedLink from '@/components/LocalizedLink'
import { ArrowRight, Crown } from 'lucide-react'
import { Reveal } from '@/components/Reveal'
import ListingCard from '@/components/ListingCard'
import HScroll from '@/components/HScroll'
import { useI18n } from '@/lib/i18n/context'
import type { Listing } from '@/data/listings'

export default function Listings({ items }: { items: Listing[] }) {
  const { b, t } = useI18n()
  const [dealFilter, setDealFilter] = useState<'all' | 'sale' | 'rent' | 'daily'>('all')
  // Sister rails null-render when empty (DB down) — same contract here;
  // the tab-filter empty state below covers the interactive case.
  if (items.length === 0) return null

  const filteredItems = items.filter((l) => {
    if (dealFilter === 'sale') return l.dealType === 'sale'
    if (dealFilter === 'rent') return l.dealType === 'rent'
    if (dealFilter === 'daily') return l.dealType === 'daily'
    return true
  })

  // Existing 9-locale dict keys — same vocabulary the search UI uses.
  const TABS = [
    { id: 'all', label: t('search.all') },
    { id: 'sale', label: t('search.sale') },
    { id: 'rent', label: t('search.rent') },
    { id: 'daily', label: t('nav.daily') },
  ] as const

  return (
    <section className="relative overflow-hidden bg-sv-cloud py-20 md:py-28">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-sv-orange/10 px-4 py-1.5 text-[12px] font-black uppercase tracking-wider text-sv-navy">
              <Crown className="h-3.5 w-3.5" /> {b('home.listings.kicker')}
            </span>
            <h2 className="text-balance text-[30px] font-black tracking-[-0.02em] text-sv-ink md:text-[40px]">
              {b('home.listings.title')}
            </h2>
            <p className="mt-2 text-[15px] font-semibold text-sv-ink/65 md:text-[16px]">
              {b('home.listings.sub')}
            </p>
          </div>
          <LocalizedLink
            href="/sale"
            className="group flex items-center gap-2 text-[15px] font-extrabold text-sv-blue-deep transition-colors hover:text-sv-blue-deep"
          >
            {/* SEO: indexable hub + keyword anchor — /search is noindex. */}
            {b('home.listings.viewAll')}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </LocalizedLink>
        </Reveal>

        <div className="mb-8 flex flex-wrap items-center gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDealFilter(tab.id as typeof dealFilter)}
              className={`rounded-full px-5 py-2 text-[13px] font-extrabold transition-all duration-200 ${
                dealFilter === tab.id
                  ? 'bg-sv-navy text-white shadow-glow-navy'
                  : 'bg-sv-surface text-sv-ink/75 border border-sv-ink/10 hover:border-sv-blue/30 hover:text-sv-blue'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <HScroll aria-label={b('home.listings.scrollLabel')} step={420} className="gap-6 pb-2 pt-2">
          {filteredItems.length === 0 && (
            <div className="w-full rounded-card border border-dashed border-sv-ink/15 px-6 py-10 text-center text-[14px] font-semibold text-sv-ink/50">
              {t('search.emptyTitle')}
            </div>
          )}
          {filteredItems.map((l, i) => (
            <ListingCard key={l.id} l={l} i={i} />
          ))}
        </HScroll>
      </div>
    </section>
  )
}
