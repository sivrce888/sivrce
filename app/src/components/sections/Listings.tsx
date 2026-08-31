'use client'

import LocalizedLink from '@/components/LocalizedLink'
import { ArrowRight } from 'lucide-react'
import { Reveal } from '@/components/Reveal'
import ListingCard from '@/components/ListingCard'
import HScroll from '@/components/HScroll'
import { useI18n } from '@/lib/i18n/context'
import type { Listing } from '@/data/listings'

export default function Listings({ items }: { items: Listing[] }) {
  const { b } = useI18n()
  if (items.length === 0) return null

  return (
    <section className="relative overflow-hidden bg-sv-surface py-20 md:py-28">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
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
            {b('home.listings.viewAll')}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </LocalizedLink>
        </Reveal>

        <HScroll aria-label={b('home.listings.scrollLabel')} step={420} className="gap-6 pb-2 pt-2">
          {items.map((l, i) => (
            <ListingCard key={l.id} l={l} i={i} />
          ))}
        </HScroll>
      </div>
    </section>
  )
}
