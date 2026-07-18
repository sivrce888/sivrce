'use client'

import LocalizedLink from '@/components/LocalizedLink'
import { ArrowRight, Crown } from 'lucide-react'
import { Reveal } from '@/components/Reveal'
import ListingCard from '@/components/ListingCard'
import HScroll from '@/components/HScroll'
import { useI18n } from '@/lib/i18n/context'
import type { Listing } from '@/data/listings'

export default function Listings({ items }: { items: Listing[] }) {
  const { b } = useI18n()

  return (
    <section className="relative overflow-hidden bg-sv-cloud py-20 md:py-28">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-5">
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
      </div>

      <HScroll
        aria-label="SUPER VIP განცხადებები"
        step={420}
        className="gap-6 px-5 pb-2 pt-2 md:px-10 lg:px-[max(2.5rem,calc((100vw-1440px)/2+2.5rem))]"
      >
        {items.map((l, i) => (
          <ListingCard key={l.id} l={l} i={i} />
        ))}
      </HScroll>
    </section>
  )
}
