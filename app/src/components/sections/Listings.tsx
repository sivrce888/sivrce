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
  const { b } = useI18n()
  const [dealFilter, setDealFilter] = useState<'all' | 'sale' | 'rent' | 'daily'>('all')

  const filteredItems = items.filter((l) => {
    if (dealFilter === 'sale') return l.dealType === 'sale'
    if (dealFilter === 'rent') return l.dealType === 'rent'
    if (dealFilter === 'daily') return l.dealType === 'daily'
    return true
  })

  return (
    <section className="relative overflow-hidden bg-sv-cloud py-20 md:py-28">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-sv-orange/10 px-4 py-1.5 text-[12px] font-black uppercase tracking-wider text-sv-orange">
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
            className="group flex items-center gap-2 text-[15px] font-extrabold text-sv-blue transition-colors hover:text-sv-blue-deep"
          >
            {/* SEO: indexable hub + keyword anchor — /search is noindex. */}
            ყველა განცხადების ნახვა
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </LocalizedLink>
        </Reveal>

        {/* Super VIP Deal Filters */}
        <div className="mb-8 flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'ყველა' },
            { id: 'sale', label: 'იყიდება' },
            { id: 'rent', label: 'ქირავდება' },
            { id: 'daily', label: 'დღიურად' },
          ].map((tab) => (
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
      </div>

      <HScroll
        aria-label="SUPER VIP განცხადებები"
        step={420}
        pageGutter
        className="gap-6 px-5 pb-2 pt-2 md:px-10"
      >
        {filteredItems.map((l, i) => (
          <ListingCard key={l.id} l={l} i={i} />
        ))}
      </HScroll>
    </section>
  )
}

